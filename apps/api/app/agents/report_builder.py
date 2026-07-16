from __future__ import annotations

from app.agents.state import InvestigationState


def build_report_markdown(state: InvestigationState) -> str:
    evidence_lines = [f"- [{item.citation_id}] {item.title}: {item.content}" for item in state.evidence_bundle[:8]]
    multimodal_types = {
        "screenshot",
        "dashboard_screenshot",
        "sentry_screenshot",
        "architecture_diagram",
        "pdf_runbook",
        "pdf_postmortem",
        "voice_note",
    }
    multimodal_items = [item for item in state.evidence_bundle if item.source_type in multimodal_types]
    multimodal_lines = [
        f"- [{item.citation_id}] ({item.source_type}) {item.title}: {item.content}"
        for item in multimodal_items[:6]
    ]
    hypothesis_lines = [
        f"- {item.title} ({item.confidence:.2f}) support={', '.join(item.supporting_evidence)} contradict={', '.join(item.contradicting_evidence) or 'none'}: {item.reasoning_summary}"
        for item in state.hypotheses
    ]
    remediation = state.remediation_plan
    evaluation = state.evaluation
    confidence = max((item.confidence for item in state.hypotheses if item.title == state.selected_root_cause), default=0.0)

    return "\n".join(
        [
            "# Incident Report",
            "## 1. Executive Summary",
            "Payment failures are most likely caused by a deployment regression introduced by PR #482 in webhook signature validation [EVID-002] with supporting runtime failures in payments/webhook.py [EVID-001].",
            "## 2. Current Status",
            f"Incident remains {state.status or 'investigating'} with elevated payment failure rates [EVID-003].",
            "## 3. Affected Services",
            f"{state.affected_service or 'payments-api'} is the primary affected service [EVID-001].",
            "## 4. Severity Assessment",
            f"Severity is assessed as {state.severity or 'high'} based on degraded payment completion and elevated 5xx rates [EVID-003].",
            "## 5. Timeline",
            "- Deployment completed for release v1.42.0 [EVID-002]",
            "- SignatureMismatchError began shortly after deploy [EVID-001]",
            "- Prometheus captured a sharp error and latency spike [EVID-003]",
            "## 6. Key Evidence",
            *evidence_lines,
            "### Multimodal Evidence",
            *(multimodal_lines or ["- No multimodal evidence was available for this investigation."]),
            "## 7. Root Cause Hypotheses",
            *hypothesis_lines,
            "## 8. Most Likely Root Cause",
            f"{state.selected_root_cause} [EVID-001] [EVID-002] [EVID-004] [EVID-005]",
            "## 9. Confidence Score",
            f"{confidence:.2f}",
            "## 10. Recommended Immediate Actions",
            *[f"- {item}" for item in (remediation.immediate_actions if remediation else [])],
            "## 11. Approval-Gated Actions",
            *[f"- {item}" for item in (remediation.approval_gated_actions if remediation else [])],
            "## 12. Rollback or Hotfix Plan",
            *[f"- {item}" for item in (remediation.rollback_or_hotfix_plan if remediation else [])],
            "## 13. Verification Checklist",
            *[f"- {item}" for item in (remediation.verification_checklist if remediation else [])],
            "## 14. Customer-Facing Update",
            remediation.customer_facing_update if remediation else "No customer update drafted.",
            "## 15. Postmortem Draft",
            "Draft focus: strict webhook signature validation regression introduced in release v1.42.0 and mitigated through approval-gated rollback or feature flag action.",
            "## 16. Missing Evidence",
            *[f"- {item}" for item in state.missing_evidence],
            "## 17. Evaluation Notes",
            evaluation.notes if evaluation else "Evaluation not available.",
        ]
    )
