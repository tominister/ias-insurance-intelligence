from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


def _strip_optional(value: str | None) -> str | None:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ias_env: str = Field(default="development", alias="IAS_ENV")
    ias_api_host: str = Field(default="127.0.0.1", alias="IAS_API_HOST")
    ias_api_port: int = Field(default=8000, alias="IAS_API_PORT")
    cors_allowed_origins: str = Field(
        default=(
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:5174,http://127.0.0.1:5174"
        ),
        alias="CORS_ALLOWED_ORIGINS",
    )

    # Azure OpenAI via API Management
    azure_openai_api_base_url: str | None = Field(default=None, alias="AZURE_OPENAI_API_BASE_URL")
    azure_openai_subscription_key: str | None = Field(default=None, alias="AZURE_OPENAI_SUBSCRIPTION_KEY")
    azure_openai_model: str = Field(default="gpt-4o", alias="AZURE_OPENAI_MODEL")
    azure_openai_api_version: str = Field(default="2024-08-01-preview", alias="AZURE_OPENAI_API_VERSION")
    azure_openai_chat_path: str | None = Field(default=None, alias="AZURE_OPENAI_CHAT_PATH")
    azure_openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        alias="AZURE_OPENAI_EMBEDDING_MODEL",
    )

    # Intent routing
    use_embedding_intent: bool = Field(default=True, alias="USE_EMBEDDING_INTENT")
    intent_embedding_threshold: float = Field(default=0.72, alias="INTENT_EMBEDDING_THRESHOLD")

    # Demo dataset mode (default on for portfolio)
    use_mock_data: bool = Field(default=True, alias="USE_MOCK_DATA")

    chat_request_timeout_seconds: int = Field(default=120, alias="CHAT_REQUEST_TIMEOUT_SECONDS")
    chat_max_history_messages: int = Field(default=30, alias="CHAT_MAX_HISTORY_MESSAGES")
    chat_max_history_chars_per_message: int = Field(default=4000, alias="CHAT_MAX_HISTORY_CHARS_PER_MESSAGE")

    # Microsoft Entra ID (optional; gated by AUTH_ENABLED)
    auth_enabled: bool = Field(default=False, alias="AUTH_ENABLED")
    azure_ad_tenant_id: str | None = Field(default=None, alias="AZURE_AD_TENANT_ID")
    azure_ad_client_id: str | None = Field(default=None, alias="AZURE_AD_CLIENT_ID")
    azure_api_scope: str | None = Field(default=None, alias="AZURE_API_SCOPE")

    @field_validator("auth_enabled", "use_mock_data", "use_embedding_intent", mode="before")
    @classmethod
    def parse_bool(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    @model_validator(mode="after")
    def validate_auth(self) -> "Settings":
        if self.auth_enabled:
            missing = [
                name
                for name, val in {
                    "AZURE_AD_TENANT_ID": self.azure_ad_tenant_id,
                    "AZURE_AD_CLIENT_ID": self.azure_ad_client_id,
                }.items()
                if not val
            ]
            if missing:
                raise ValueError(f"AUTH_ENABLED requires: {', '.join(missing)}")
        return self

    @field_validator(
        "azure_openai_api_base_url",
        "azure_ad_tenant_id",
        "azure_ad_client_id",
        "azure_api_scope",
        mode="before",
    )
    @classmethod
    def strip_whitespace(cls, value: str | None) -> str | None:
        return _strip_optional(value)

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @property
    def azure_openai_configured(self) -> bool:
        return bool(self.azure_openai_api_base_url and self.azure_openai_subscription_key)

    # Backward-compatible aliases used by intent classifier
    @property
    def origami_use_embedding_intent(self) -> bool:
        return self.use_embedding_intent

    @property
    def origami_intent_embedding_threshold(self) -> float:
        return self.intent_embedding_threshold


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    from app.security.token_validator import reset_token_validator_cache

    get_settings.cache_clear()
    reset_token_validator_cache()
    return get_settings()
