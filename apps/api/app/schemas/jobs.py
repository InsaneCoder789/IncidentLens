from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    incident_id: int | None
    status: str
    progress: int
    result_json: dict
    error_message: str | None
    attempts: int
    max_attempts: int
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class JobListRead(BaseModel):
    jobs: list[JobRead] = Field(default_factory=list)
