from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState


class IntakeAgent(BaseAgent):
    name = "Intake Agent"
    prompt_file = "intake_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        title = state.title.lower()
        description = state.description.lower()
        state.incident_type = "deployment_regression" if "deployment" in title or "deployment" in description else "unknown"
        state.severity = state.severity or "high"
        state.affected_service = state.affected_service or "payments-api"
        state.investigation_plan = [
            "Review recent GitHub changes around release v1.42.0",
            "Inspect Sentry SignatureMismatchError traces",
            "Compare Prometheus error rate and latency around deploy time",
            "Search payment webhook runbook",
            "Check whether payment provider has an active outage",
        ]
        state.required_tools = ["retriever", "github", "sentry", "prometheus", "statuspage", "runbooks", "previous_incidents"]
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Classified as {state.incident_type} affecting {state.affected_service} with severity {state.severity}."
