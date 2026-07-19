from __future__ import annotations

from pydantic import BaseModel, Field

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState, RootCauseHypothesis


class RootCauseOutput(BaseModel):
    hypotheses: list[RootCauseHypothesis] = Field(min_length=2)
    selected_root_cause: str
    missing_evidence: list[str] = Field(default_factory=list)


class RootCauseAgent(BaseAgent):
    name = "Root Cause Agent"
    prompt_file = "root_cause_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        output = RootCauseOutput.model_validate(self.generate({
            "incident": {"title": state.title, "description": state.description, "service": state.affected_service, "type": state.incident_type},
            "evidence": [item.model_dump() for item in state.evidence_bundle],
            "tool_outputs": state.tool_outputs,
            "requirements": "Return at least two competing hypotheses. Cite only citation_id values present in evidence.",
        }))
        state.hypotheses = output.hypotheses
        state.selected_root_cause = output.selected_root_cause
        state.missing_evidence = list(dict.fromkeys([*state.missing_evidence, *output.missing_evidence]))
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Generated {len(state.hypotheses)} hypotheses and selected {state.selected_root_cause}."
