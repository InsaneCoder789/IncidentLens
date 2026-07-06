from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class EvalRunRead(BaseModel):
    id: str
    dataset_name: str
    recall_at_5: float
    recall_at_10: float
    mrr: float
    root_cause_accuracy: float
    citation_coverage: float
    unsupported_claim_rate: float
    unsafe_action_rate: float
    avg_latency_ms: float
    avg_cost_usd: float
    summary_json: dict = Field(default_factory=dict)
    failed_cases_json: list[dict] = Field(default_factory=list)
    created_at: datetime


class EvalRunTriggerResponse(BaseModel):
    status: str
    run: EvalRunRead
