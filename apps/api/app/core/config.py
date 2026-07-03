from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "IncidentLens AI API"
    environment: str = "development"
    database_url: str = "sqlite:///./incidentlens.db"
    redis_url: str = "redis://localhost:6379/0"
    mock_mode: bool = True
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimension: int = 384
    reasoning_model_primary: str = "mock-llm"
    reasoning_model_fallback: str = "mock-llm"
    generation_temperature: float = 0.2
    generation_max_tokens: int = 2000
    tracing_enabled: bool = True
    cost_tracking_enabled: bool = True
    prompt_versioning_enabled: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
