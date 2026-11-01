from .base import ChatProvider, ProviderError
from .openai_compatible import OpenAICompatibleProvider
from ..config import settings

_REGISTRY = {"openai_compatible": OpenAICompatibleProvider}


def get_provider() -> ChatProvider:
    cls = _REGISTRY.get(settings.model_provider)
    if cls is None:
        raise ProviderError(f"Unknown MODEL_PROVIDER '{settings.model_provider}'. Options: {', '.join(_REGISTRY)}")
    return cls()


__all__ = ["get_provider", "ChatProvider", "ProviderError"]
