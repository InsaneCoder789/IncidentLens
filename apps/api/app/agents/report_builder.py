from __future__ import annotations

from app.agents.state import InvestigationState


def _lines(items: list[str], empty: str = "- None recorded.") -> list[str]:
    return [f"- {item}" for item in items] or [empty]


def build_report_markdown(state: InvestigationState) -> str:
    evidence_lines = [f"- [{item.citation_id}] {item.title}: {item.content}" for item in state.evidence_bundle[:12]]
    hypothesis_lines = [
        f"- {item.title} ({item.confidence:.0%}): {item.reasoning_summary} Support: {', '.join(item.supporting_evidence) or 'none'}. Contradictions: {', '.join(item.contradicting_evidence) or 'none'}."
        for item in state.hypotheses
    ]
    remediation = state.remediation_plan
    evaluation = state.evaluation
    confidence = max((item.confidence for item in state.hypotheses if item.title == state.selected_root_cause), default=0.0)
    supporting = next((item.supporting_evidence for item in state.hypotheses if item.title == state.selected_root_cause), [])
    citations = " ".join(f"[{item}]" for item in supporting)
    return "\n".join([
        "# Incident Report",
        "## 1. Executive Summary",
        f"{state.title}. The leading root-cause hypothesis is {state.selected_root_cause or 'not established'} with {confidence:.0%} confidence. {citations}".strip(),
        "## 2. Current Status",
        state.status or "unknown",
        "## 3. Affected Services",
        state.affected_service or "Not established",
        "## 4. Severity Assessment",
        state.severity or "Not established",
        "## 5. Timeline",
        *_lines(state.timeline, "- No timeline events were supplied."),
        "## 6. Key Evidence",
        *(evidence_lines or ["- No evidence was retrieved."]),
        "## 7. Root Cause Hypotheses",
        *(hypothesis_lines or ["- No hypotheses were generated."]),
        "## 8. Most Likely Root Cause",
        f"{state.selected_root_cause or 'Insufficient evidence'} {citations}".strip(),
        "## 9. Confidence Score",
        f"{confidence:.2f}",
        "## 10. Recommended Immediate Actions",
        *_lines(remediation.immediate_actions if remediation else []),
        "## 11. Approval-Gated Actions",
        *_lines(remediation.approval_gated_actions if remediation else []),
        "## 12. Rollback or Hotfix Plan",
        *_lines(remediation.rollback_or_hotfix_plan if remediation else []),
        "## 13. Verification Checklist",
        *_lines(remediation.verification_checklist if remediation else []),
        "## 14. Customer-Facing Update",
        remediation.customer_facing_update if remediation else "No update drafted.",
        "## 15. Follow-Up Work",
        *_lines(remediation.follow_up_tickets if remediation else []),
        "## 16. Missing Evidence",
        *_lines(state.missing_evidence),
        "## 17. Evaluation Notes",
        evaluation.notes if evaluation else "Evaluation not available.",
    ])
