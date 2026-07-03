from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class EvidenceBundleItem(BaseModel):
    citation_id: str
    source_type: str
    title: str
    content: str
    relevance_score: float
    metadata: dict[str, Any] = Field(default_factory=dict)


class RootCauseHypothesis(BaseModel):
    title: str
    confidence: float
    supporting_evidence: list[str]
    contradicting_evidence: list[str] = Field(default_factory=list)
    reasoning_summary: str


class RemediationPlan(BaseModel):
    immediate_actions: list[str]
    approval_gated_actions: list[str]
    rollback_or_hotfix_plan: list[str]
    verification_checklist: list[str]
    customer_facing_update: str
    follow_up_tickets: list[str]


class EvaluationResult(BaseModel):
    quality_score: float
    citation_coverage: float
    unsupported_claims: list[str]
    unsafe_recommendations: list[str]
    missing_evidence: list[str]
    notes: str


class InvestigationState(BaseModel):
    incident_id: str
    title: str
    description: str
    severity: str | None = None
    status: str | None = None
    affected_service: str | None = None
    incident_type: str | None = None
    investigation_plan: list[str] = Field(default_factory=list)
    required_tools: list[str] = Field(default_factory=list)
    evidence_bundle: list[EvidenceBundleItem] = Field(default_factory=list)
    missing_evidence: list[str] = Field(default_factory=list)
    hypotheses: list[RootCauseHypothesis] = Field(default_factory=list)
    selected_root_cause: str | None = None
    remediation_plan: RemediationPlan | None = None
    evaluation: EvaluationResult | None = None
    report_markdown: str | None = None
    timeline: list[str] = Field(default_factory=list)
    tool_outputs: dict[str, Any] = Field(default_factory=dict)
    active_agent_run_id: str | None = Field(default=None, exclude=True)
