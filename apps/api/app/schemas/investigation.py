from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class InvestigationStartResponse(BaseModel):
    incident_id: str
    status: str
    report_id: str
    selected_root_cause: str
    confidence_score: float
    quality_score: float


class IncidentReportRead(BaseModel):
    incident_id: str
    report_id: str
    report_markdown: str
    selected_root_cause: str
    confidence_score: float
    evaluation_score: float
    created_at: datetime


class AgentRunRead(BaseModel):
    id: str
    agent_name: str
    status: str
    input_summary: str
    output_summary: str
    model_name: str
    prompt_version: str
    latency_ms: int
    token_input: int
    token_output: int
    estimated_cost_usd: float
    started_at: datetime
    completed_at: datetime | None = None
    error_message: str | None = None


class ToolCallRead(BaseModel):
    id: str
    agent_run_id: str
    tool_name: str
    status: str
    input_json: dict = Field(default_factory=dict)
    output_json: dict = Field(default_factory=dict)
    latency_ms: int
    created_at: datetime
    error_message: str | None = None


class IncidentTraceRead(BaseModel):
    incident_id: str
    agent_runs: list[AgentRunRead]
    tool_calls: list[ToolCallRead]
