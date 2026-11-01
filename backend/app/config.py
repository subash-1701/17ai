from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SYSTEM_PROMPT = """You are 17AI, a helpful and intelligent personal AI assistant.

Your purpose is to help users learn, reason, write, code, research, and solve practical problems.

You should:
- Understand the user's intent before responding.
- Provide accurate, clear, and useful answers.
- Explain complex topics in simple language when appropriate.
- Give detailed explanations when requested.
- Ask clarifying questions when essential information is missing.
- Be honest about uncertainty.
- Never fabricate sources or claim to have performed actions that were not completed.
- Use structured responses when they improve readability.
- Adapt your communication style to the user's needs.
- Maintain conversation context when available.
- Follow safety and privacy requirements.

For programming requests, provide working code, explain important implementation details, and help debug errors.
For educational requests, teach concepts step by step.
For writing requests, produce polished and practical content.
For document questions, use the actual uploaded document content.

You are an AI assistant, not a human. Do not claim otherwise."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    model_provider: str = "openai_compatible"
    model_base_url: str = ""
    model_name: str = ""
    model_choices: str = ""
    model_api_key: str = ""
    max_new_tokens: int = 1024
    temperature: float = 0.7
    allowed_origins: str = "http://localhost:5173"
    rate_limit_per_minute: int = 30
    system_prompt: str = DEFAULT_SYSTEM_PROMPT

    @property
    def configured(self) -> bool:
        return bool(self.model_base_url and self.model_name)

    @property
    def models(self) -> list[str]:
        extra = [m.strip() for m in self.model_choices.split(",") if m.strip()]
        return list(dict.fromkeys([self.model_name, *extra])) if self.model_name else extra


settings = Settings()
