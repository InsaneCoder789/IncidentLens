from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState, RootCauseHypothesis


class RootCauseAgent(BaseAgent):
    name = "Root Cause Agent"
    prompt_file = "root_cause_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        supporting_sources = {
            "sentry_issue",
            "github_pr",
            "prometheus_metric",
            "runbook",
            "previous_incident",
            "dashboard_screenshot",
            "sentry_screenshot",
            "voice_note",
            "pdf_runbook",
            "pdf_postmortem",
        }
        supporting_citations = [
            item.citation_id for item in state.evidence_bundle if item.source_type in supporting_sources
        ]
        outage_citations = [
            item.citation_id for item in state.evidence_bundle if item.source_type == "statuspage"
        ]
        state.hypotheses = [
            RootCauseHypothesis(
                title="Webhook validation regression",
                confidence=0.91 if any(
                    item.source_type in {"dashboard_screenshot", "sentry_screenshot", "voice_note"}
                    for item in state.evidence_bundle
                ) else 0.86,
                supporting_evidence=supporting_citations,
                contradicting_evidence=outage_citations,
                reasoning_summary=(
                    "The error spike began shortly after PR #482 changed webhook signature validation. "
                    "Sentry reports SignatureMismatchError in payments/webhook.py for release v1.42.0, "
                    "while the Grafana and Sentry screenshots plus war-room voice note independently align "
                    "the production degradation with the same deployment window."
                ),
            ),
            RootCauseHypothesis(
                title="Third-party payment provider outage",
                confidence=0.18,
                supporting_evidence=[],
                contradicting_evidence=outage_citations,
                reasoning_summary="The payment provider statuspage reports operational status, reducing the likelihood of an external provider outage.",
            ),
        ]
        state.selected_root_cause = "Webhook validation regression"
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Generated {len(state.hypotheses)} hypotheses and selected {state.selected_root_cause}."
