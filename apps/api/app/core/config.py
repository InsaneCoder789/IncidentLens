from functools import lru_cache
from typing import Literal

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "IncidentLens AI API"
    environment: Literal["development", "test", "production"] = "development"
    database_url: str = "sqlite:///./incidentlens.db"
    redis_url: str = "redis://localhost:6379/0"
    api_token: SecretStr | None = None
    cors_allowed_origins: str = "http://localhost:3000"
    llm_api_key: SecretStr | None = None
    llm_base_url: str = "https://api.openai.com/v1"
    vision_model_name: str = "gpt-4.1-mini"
    transcription_model_name: str = "gpt-4o-mini-transcribe"
    github_token: SecretStr | None = None
    github_repository: str | None = None
    sentry_auth_token: SecretStr | None = None
    sentry_organization: str | None = None
    sentry_project: str | None = None
    prometheus_url: str | None = None
    statuspage_url: str | None = None
    runbook_directory: str = "runbooks"
    job_queue_name: str = "incidentlens:jobs"
    job_max_attempts: int = 3
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    reasoning_model_primary: str = "gpt-4.1-mini"
    reasoning_model_fallback: str = "gpt-4.1-nano"
    generation_temperature: float = 0.2
    generation_max_tokens: int = 2000
    tracing_enabled: bool = True
    cost_tracking_enabled: bool = True
    prompt_versioning_enabled: bool = True
    evidence_storage_dir: str = "storage/evidence"
    max_evidence_upload_bytes: int = 25 * 1024 * 1024

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        if self.environment == "production":
            if self.api_token is None or len(self.api_token.get_secret_value()) < 32:
                raise ValueError("API_TOKEN must contain at least 32 characters in production")
            if "*" in self.cors_origins:
                raise ValueError("CORS_ALLOWED_ORIGINS cannot contain '*' in production")
            if self.database_url.startswith("sqlite"):
                raise ValueError("Production requires PostgreSQL; SQLite is development-only")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
