from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState, RemediationPlan


class RemediationAgent(BaseAgent):
    name = "Remediation Agent"
    prompt_file = "remediation_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        state.remediation_plan = RemediationPlan.model_validate(self.generate({
            "incident": {"title": state.title, "description": state.description, "service": state.affected_service, "severity": state.severity},
            "selected_root_cause": state.selected_root_cause,
            "hypotheses": [item.model_dump() for item in state.hypotheses],
            "evidence": [item.model_dump() for item in state.evidence_bundle],
            "safety_policy": "Read-only verification may be immediate. Rollbacks, feature flags, restarts, deployments, and customer-impacting mutations must be approval_gated_actions.",
        }))
        return state

    def output_summary(self, state: InvestigationState) -> str:
        plan = state.remediation_plan
        return f"Created {len(plan.immediate_actions) if plan else 0} immediate and {len(plan.approval_gated_actions) if plan else 0} approval-gated actions."
