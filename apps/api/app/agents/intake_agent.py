from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState
from pydantic import BaseModel, Field


class IntakeOutput(BaseModel):
    incident_type: str
    severity: str
    affected_service: str
    investigation_plan: list[str] = Field(min_length=1)
    required_tools: list[str] = Field(default_factory=list)


class IntakeAgent(BaseAgent):
    name = "Intake Agent"
    prompt_file = "intake_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        output = IntakeOutput.model_validate(self.generate({
            "title": state.title,
            "description": state.description,
            "reported_severity": state.severity,
            "reported_service": state.affected_service,
            "allowed_incident_types": ["deployment_regression", "database_issue", "auth_failure", "third_party_outage", "infra_issue", "performance_degradation", "security_suspicious", "frontend_bug", "unknown"],
            "allowed_tools": ["retriever", "github", "sentry", "prometheus", "statuspage", "runbooks", "previous_incidents"],
        }))
        state.incident_type = output.incident_type
        state.severity = output.severity
        state.affected_service = output.affected_service
        state.investigation_plan = output.investigation_plan
        state.required_tools = output.required_tools
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Classified as {state.incident_type} affecting {state.affected_service} with severity {state.severity}."
