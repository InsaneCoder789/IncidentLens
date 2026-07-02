from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class IncidentBase(BaseModel):
    title: str
    description: str
    severity: str
    status: str = "open"
    affected_service: str
    incident_type: str = "unknown"
    latest_confidence_score: float | None = None
    owner: str | None = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    severity: str | None = None
    status: str | None = None
    affected_service: str | None = None
    incident_type: str | None = None
    latest_confidence_score: float | None = None
    owner: str | None = None


class IncidentRead(IncidentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None = None
    evidence_count: int = 0

