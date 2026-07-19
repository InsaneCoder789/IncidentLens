from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.incident import IncidentRead


class IncidentEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    incident_id: int
    event_type: str
    title: str
    description: str
    actor: str
    metadata_json: dict
    created_at: datetime


class ApprovalCreate(BaseModel):
    action: str = Field(min_length=5, max_length=2_000)
    rationale: str = Field(default="", max_length=5_000)


class ApprovalDecision(BaseModel):
    decision: Literal["approved", "rejected", "cancelled"]
    decision_note: str = Field(default="", max_length=5_000)
    expected_version: int = Field(ge=1)


class ApprovalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    incident_id: int
    action: str
    rationale: str
    status: str
    requested_by: str
    reviewed_by: str | None
    decision_note: str | None
    version: int
    created_at: datetime
    reviewed_at: datetime | None


class RuntimeSettingsRead(BaseModel):
    reasoning_model_primary: str
    reasoning_model_fallback: str
    embedding_model_name: str
    tracing_enabled: bool
    cost_tracking_enabled: bool
    prompt_versioning_enabled: bool
    generation_temperature: float
    generation_max_tokens: int
    monthly_cost_limit_usd: float
    eval_root_cause_threshold: float
    eval_citation_threshold: float


class RuntimeSettingsUpdate(BaseModel):
    reasoning_model_primary: str | None = Field(default=None, min_length=1, max_length=255)
    reasoning_model_fallback: str | None = Field(default=None, min_length=1, max_length=255)
    embedding_model_name: str | None = Field(default=None, min_length=1, max_length=255)
    tracing_enabled: bool | None = None
    cost_tracking_enabled: bool | None = None
    prompt_versioning_enabled: bool | None = None
    generation_temperature: float | None = Field(default=None, ge=0, le=2)
    generation_max_tokens: int | None = Field(default=None, ge=128, le=32_768)
    monthly_cost_limit_usd: float | None = Field(default=None, ge=0, le=1_000_000)
    eval_root_cause_threshold: float | None = Field(default=None, ge=0, le=1)
    eval_citation_threshold: float | None = Field(default=None, ge=0, le=1)


class DashboardMetric(BaseModel):
    label: str
    value: str
    detail: str
    tone: Literal["neutral", "warning", "danger", "accent", "success"] = "neutral"


class DashboardRead(BaseModel):
    incidents: list[IncidentRead]
    metrics: list[DashboardMetric]
    recent_events: list[IncidentEventRead]
    pending_approvals: int
