import json
import httpx
from .base import ChatProvider, ProviderError
from ..config import settings


class OpenAICompatibleProvider(ChatProvider):
    async def stream(self, messages, model, temperature, max_tokens):
        if not settings.configured:
            raise ProviderError("Model is not configured. Set MODEL_BASE_URL, MODEL_NAME and MODEL_API_KEY in backend/.env.")
        headers = {"Content-Type": "application/json"}
        if settings.model_api_key:
            headers["Authorization"] = f"Bearer {settings.model_api_key}"
        body = {"model": model, "messages": messages, "temperature": temperature,
                "max_tokens": max_tokens, "stream": True}
        url = settings.model_base_url.rstrip("/") + "/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, read=120.0)) as client:
                async with client.stream("POST", url, headers=headers, json=body) as r:
                    if r.status_code >= 400:
                        detail = (await r.aread()).decode(errors="ignore")[:300]
                        raise ProviderError(f"Model provider returned {r.status_code}. {detail}")
                    async for line in r.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        data = line[5:].strip()
                        if data == "[DONE]":
                            return
                        try:
                            delta = json.loads(data)["choices"][0].get("delta", {}).get("content")
                        except (KeyError, IndexError, json.JSONDecodeError):
                            continue
                        if delta:
                            yield delta
        except httpx.HTTPError as e:
            raise ProviderError(f"Could not reach the model provider: {type(e).__name__}") from e
