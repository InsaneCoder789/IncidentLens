from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState, RootCauseHypothesis


class RootCauseAgent(BaseAgent):
    name = "Root Cause Agent"
    prompt_file = "root_cause_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        state.hypotheses = [
            RootCauseHypothesis(
                title="Webhook validation regression",
                confidence=0.86,
                supporting_evidence=["EVID-001", "EVID-002", "EVID-003", "EVID-004", "EVID-005"],
                contradicting_evidence=["EVID-006"],
                reasoning_summary=(
                    "The error spike began shortly after PR #482 changed webhook signature validation. "
                    "Sentry reports SignatureMismatchError in payments/webhook.py for release v1.42.0, "
                    "and the runbook plus previous incident point to strict validation as a known failure mode."
                ),
            ),
            RootCauseHypothesis(
                title="Third-party payment provider outage",
                confidence=0.18,
                supporting_evidence=[],
                contradicting_evidence=["EVID-006"],
                reasoning_summary="The payment provider statuspage reports operational status, reducing the likelihood of an external provider outage.",
            ),
        ]
        state.selected_root_cause = "Webhook validation regression"
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Generated {len(state.hypotheses)} hypotheses and selected {state.selected_root_cause}."
