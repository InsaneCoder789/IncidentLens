from __future__ import annotations

from math import isfinite
from statistics import mean
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.agents.state import EvaluationResult, RemediationPlan, RootCauseHypothesis


class RetrievalCase(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=1, max_length=2000)
    expected_citations: list[str] = Field(min_length=1, max_length=100)

    @field_validator("query")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("query is blank")
        return value.strip()

    @field_validator("expected_citations")
    @classmethod
    def unique(cls, values: list[str]) -> list[str]:
        if len(set(values)) != len(values) or any(not value.strip() or len(value) > 128 for value in values):
            raise ValueError("citations must be unique nonblank identifiers")
        return values


class EvaluationDataset(BaseModel):
    model_config = ConfigDict(extra="forbid")
    dataset_name: str = Field(min_length=1, max_length=255)
    incident_id: int = Field(strict=True, gt=0)
    expected_root_cause: str = Field(min_length=1)
    retrieval_cases: list[RetrievalCase] = Field(min_length=2, max_length=100)

    @field_validator("retrieval_cases")
    @classmethod
    def distinct(cls, values: list[RetrievalCase]) -> list[RetrievalCase]:
        if len({value.query.casefold() for value in values}) != len(values):
            raise ValueError("queries must be distinct")
        return values


def retrieval_metrics(ranked: list[str], expected: list[str]) -> dict[str, float]:
    if not expected or len(set(expected)) != len(expected):
        raise ValueError("expected citations must be nonempty and unique")
    ranking = list(dict.fromkeys(ranked))
    targets = set(expected)
    return {"recall_at_5": len(targets.intersection(ranking[:5])) / len(targets),
            "recall_at_10": len(targets.intersection(ranking[:10])) / len(targets),
            "reciprocal_rank": next((1 / rank for rank, citation in enumerate(ranking, 1) if citation in targets), 0.0)}


def average_retrieval(results: list[dict[str, float]]) -> dict[str, float]:
    if len(results) < 2:
        raise ValueError("this suite requires at least two queries for MRR")
    return {"recall_at_5": mean(row["recall_at_5"] for row in results),
            "recall_at_10": mean(row["recall_at_10"] for row in results),
            "mrr": mean(row["reciprocal_rank"] for row in results)}


def structured_report_checks(analysis: dict[str, Any], expected: set[str], available: set[str]) -> dict[str, Any]:
    if not expected:
        raise ValueError("report citation targets are empty")
    hypotheses = [RootCauseHypothesis.model_validate(item) for item in analysis["hypotheses"]]
    if not hypotheses:
        raise ValueError("no structured hypotheses")
    remediation = RemediationPlan.model_validate(analysis["remediation_plan"])
    evaluation = EvaluationResult.model_validate(analysis["evaluation"])
    cited = {citation for item in hypotheses for citation in [*item.supporting_evidence, *item.contradicting_evidence]}
    return {"citation_coverage": len(expected.intersection(cited, available)) / len(expected),
            "unknown_citations": sorted(cited - available),
            "immediate_action_count": len(remediation.immediate_actions),
            "approval_gated_action_count": len(remediation.approval_gated_actions),
            "model_flagged_claims": evaluation.unsupported_claims,
            "model_flagged_actions": evaluation.unsafe_recommendations}


def measured_average(values: list[float | int | None]) -> float | None:
    measured = [value for value in values if isinstance(value, (float, int)) and not isinstance(value, bool) and isfinite(value) and value >= 0]
    return mean(measured) if measured else None
