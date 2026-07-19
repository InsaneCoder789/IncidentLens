from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Severity = Literal["low", "medium", "high", "critical"]
IncidentStatus = Literal["open", "investigating", "mitigated", "resolved", "postmortem_ready"]
IncidentType = Literal[
    "deployment_regression",
    "database_issue",
    "auth_failure",
    "third_party_outage",
    "infra_issue",
    "performance_degradation",
    "security_suspicious",
    "frontend_bug",
    "unknown",
]


class IncidentBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=20_000)
    severity: Severity
    status: IncidentStatus = "open"
    affected_service: str = Field(min_length=1, max_length=255)
    incident_type: IncidentType = "unknown"
    latest_confidence_score: float | None = Field(default=None, ge=0, le=1)
    owner: str | None = Field(default=None, max_length=255)

    @field_validator("title", "description", "affected_service", "owner")
    @classmethod
    def strip_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=10, max_length=20_000)
    severity: Severity | None = None
    status: IncidentStatus | None = None
    affected_service: str | None = Field(default=None, min_length=1, max_length=255)
    incident_type: IncidentType | None = None
    latest_confidence_score: float | None = Field(default=None, ge=0, le=1)
    owner: str | None = Field(default=None, max_length=255)

    @field_validator("title", "description", "affected_service", "owner")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None


class IncidentRead(IncidentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    evidence_count: int = 0
