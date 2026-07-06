from pydantic import BaseModel, Field


class IntegrationHealthRead(BaseModel):
    key: str
    label: str
    status: str
    detail: str
    source_types: list[str] = Field(default_factory=list)


class IntegrationImportResponse(BaseModel):
    incident_id: int
    integration_key: str
    imported: int
    updated: int
