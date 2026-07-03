from pydantic import BaseModel, Field


class RetrievalSearchRequest(BaseModel):
    incident_id: int
    query: str
    source_types: list[str] | None = None
    metadata_filters: dict[str, str | int | float | bool] | None = None
    top_k: int = Field(default=8, ge=1, le=25)
    score_threshold: float = Field(default=0.25, ge=0, le=1)


class RetrievalResultRead(BaseModel):
    citation_id: str
    source_type: str
    title: str
    content: str
    relevance_score: float
    metadata: dict


class RetrievalSearchResponse(BaseModel):
    query: str
    results: list[RetrievalResultRead]
