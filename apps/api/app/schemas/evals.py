from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class EvalRunRead(BaseModel):
    id: str
    dataset_name: str
    recall_at_5: float
    recall_at_10: float
    mrr: float | None
    root_cause_accuracy: float
    citation_coverage: float | None
    unsupported_claim_rate: float | None
    unsafe_action_rate: float | None
    avg_latency_ms: float | None
    avg_cost_usd: float | None
    summary_json: dict = Field(default_factory=dict)
    failed_cases_json: list[dict] = Field(default_factory=list)
    created_at: datetime

    @model_validator(mode="after")
    def preserve_legacy_measurement_boundary(self):
        if self.summary_json.get("evaluation_version") != 2:
            self.mrr = None
            self.citation_coverage = None
            self.unsupported_claim_rate = None
            self.unsafe_action_rate = None
            self.avg_latency_ms = None
            self.avg_cost_usd = None
        return self


class EvalRunTriggerResponse(BaseModel):
    status: str
    run: EvalRunRead
