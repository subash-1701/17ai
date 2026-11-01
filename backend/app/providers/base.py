from abc import ABC, abstractmethod
from typing import AsyncIterator


class ProviderError(Exception):
    """Raised for any provider failure; message is safe to show to the user."""


class ChatProvider(ABC):
    @abstractmethod
    def stream(self, messages: list[dict], model: str, temperature: float, max_tokens: int) -> AsyncIterator[str]:
        """Yield generated text fragments."""

    async def complete(self, messages, model, temperature, max_tokens) -> str:
        return "".join([t async for t in self.stream(messages, model, temperature, max_tokens)])
