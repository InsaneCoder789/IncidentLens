from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState, RemediationPlan


class RemediationAgent(BaseAgent):
    name = "Remediation Agent"
    prompt_file = "remediation_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        state.remediation_plan = RemediationPlan(
            immediate_actions=[
                "Confirm current payment_webhook_strict_mode feature flag state.",
                "Review Sentry SignatureMismatchError volume for release v1.42.0.",
                "Compare webhook success rate before and after the deployment.",
                "Notify payment service owner and incident channel.",
            ],
            approval_gated_actions=[
                "Disable payment_webhook_strict_mode feature flag.",
                "Rollback release v1.42.0.",
                "Restart affected payment webhook workers only if required after mitigation approval.",
            ],
            rollback_or_hotfix_plan=[
                "Prepare rollback plan for release v1.42.0 if mitigation fails.",
                "Patch webhook payload canonicalization in the strict validation path.",
                "Ship a hotfix behind a guarded rollout if rollback is not viable.",
            ],
            verification_checklist=[
                "5xx rate returns near baseline.",
                "Webhook success rate recovers.",
                "Payment completion rate recovers.",
                "Sentry SignatureMismatchError volume drops.",
                "No active third-party provider outage appears.",
            ],
            customer_facing_update=(
                "We are investigating elevated payment failures affecting a subset of checkout attempts. "
                "The team has identified a likely validation issue in the payment webhook path and is applying a mitigation."
            ),
            follow_up_tickets=[
                "Patch webhook signature normalization regression.",
                "Add regression coverage for strict validation payloads.",
                "Audit feature flag rollout safety for payment_webhook_strict_mode.",
            ],
        )
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return "Created immediate, approval-gated, rollback, verification, and customer update plans."
