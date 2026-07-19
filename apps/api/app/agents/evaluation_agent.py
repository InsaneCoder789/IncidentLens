from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import EvaluationResult, InvestigationState


class EvaluationAgent(BaseAgent):
    name = "Evaluation Agent"
    prompt_file = "evaluator_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        state.evaluation = EvaluationResult.model_validate(self.generate({
            "incident": {"title": state.title, "description": state.description},
            "evidence": [item.model_dump() for item in state.evidence_bundle],
            "hypotheses": [item.model_dump() for item in state.hypotheses],
            "selected_root_cause": state.selected_root_cause,
            "remediation_plan": state.remediation_plan.model_dump() if state.remediation_plan else None,
            "missing_evidence": state.missing_evidence,
            "evaluation_rules": "Penalize unsupported claims. Any production mutation outside approval_gated_actions is unsafe.",
        }))
        state.missing_evidence = list(dict.fromkeys([*state.missing_evidence, *state.evaluation.missing_evidence]))
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Assigned quality score {state.evaluation.quality_score if state.evaluation else 0.0} with citation coverage {state.evaluation.citation_coverage if state.evaluation else 0.0}."
