from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EvidenceItemBase(BaseModel):
    source_type: str
    title: str
    raw_content: str
    normalized_content: str | None = None
    metadata_json: dict = Field(default_factory=dict)
    embedding_status: str = "pending"
    processing_status: str = "uploaded"


class EvidenceItemCreate(EvidenceItemBase):
    pass


class EvidenceItemRead(EvidenceItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_id: int
    created_at: datetime


class EvidenceChunkRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    evidence_item_id: int
    incident_id: int
    chunk_index: int
    citation_id: str
    content: str
    token_count: int
    metadata_json: dict
    created_at: datetime


class EvidenceProcessResponse(BaseModel):
    evidence_id: int
    status: str
    chunks_created: int
    embedding_status: str


class ProcessAllEvidenceResponse(BaseModel):
    incident_id: int
    processed: int
    failed: int
    chunks_created: int
