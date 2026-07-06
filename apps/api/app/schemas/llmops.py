from __future__ import annotations

from pydantic import BaseModel, Field


class PromptVersionSummary(BaseModel):
    name: str
    version: str


class LlmopsOverviewRead(BaseModel):
    mock_mode: bool
    reasoning_model_primary: str
    reasoning_model_fallback: str
    embedding_model_name: str
    tracing_enabled: bool
    cost_tracking_enabled: bool
    prompt_versioning_enabled: bool
    generation_temperature: float
    generation_max_tokens: int
    integration_status_summary: dict[str, int] = Field(default_factory=dict)
    latest_eval_summary: dict[str, float | str] = Field(default_factory=dict)
    prompt_versions: list[PromptVersionSummary] = Field(default_factory=list)
