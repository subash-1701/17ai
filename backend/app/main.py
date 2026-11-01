import json
import time
from collections import defaultdict, deque
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .config import settings
from .providers import ProviderError, get_provider

app = FastAPI(title="17AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",")],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(request: Request) -> None:
    """Simple in-memory sliding window per client IP. Use Redis when running multiple instances."""
    ip = request.client.host if request.client else "unknown"
    now, q = time.monotonic(), _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= settings.rate_limit_per_minute:
        raise HTTPException(429, "Too many requests. Please wait a moment.")
    q.append(now)


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=60)
    model: str | None = None
    temperature: float | None = Field(default=None, ge=0, le=2)
    max_tokens: int | None = Field(default=None, ge=16, le=4096)
    custom_instructions: str | None = Field(default=None, max_length=2000)


def _prepare(req: ChatRequest):
    model = req.model or settings.model_name
    if settings.models and model not in settings.models:
        raise HTTPException(400, "Unknown model.")
    system = settings.system_prompt
    if req.custom_instructions:
        system += "\n\nUser's custom instructions:\n" + req.custom_instructions
    msgs = [{"role": "system", "content": system}, *[m.model_dump() for m in req.messages]]
    return (msgs, model,
            req.temperature if req.temperature is not None else settings.temperature,
            req.max_tokens or settings.max_new_tokens)


@app.get("/api/health")
def health():
    return {"configured": settings.configured, "provider": settings.model_provider,
            "model": settings.model_name, "models": settings.models}


@app.post("/api/chat", dependencies=[])
async def chat(req: ChatRequest, request: Request):
    rate_limit(request)
    if not settings.configured:
        raise HTTPException(503, "Model is not configured.")
    args = _prepare(req)
    try:
        return {"content": await get_provider().complete(*args), "model": args[1]}
    except ProviderError as e:
        raise HTTPException(502, str(e))


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest, request: Request):
    rate_limit(request)
    if not settings.configured:
        raise HTTPException(503, "Model is not configured.")
    args = _prepare(req)
    provider = get_provider()

    async def events():
        try:
            async for token in provider.stream(*args):
                if await request.is_disconnected():
                    return
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except ProviderError as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
