from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.agents.orchestrator import get_incident_trace, get_latest_report, run_investigation
from app.models.incident import Incident
from app.models.investigation import EvalRun
from app.rag.retriever import search_evidence
from app.schemas.retrieval import RetrievalSearchRequest
from app.evals.metrics import EvaluationDataset, average_retrieval, measured_average, retrieval_metrics, structured_report_checks
from app.services.evidence_service import list_incident_chunks


DATASET_PATH = Path(__file__).resolve().parents[4] / "evals" / "datasets" / "payment_api_incident.json"


def _load_dataset() -> dict[str, Any]:
    return EvaluationDataset.model_validate(json.loads(DATASET_PATH.read_text(encoding="utf-8"))).model_dump()


async def run_eval_suite(db: Session) -> EvalRun:
    dataset = _load_dataset()
    incident_id = int(dataset["incident_id"])
    if db.get(Incident, incident_id) is None:
        raise ValueError(f"Evaluation incident {incident_id} is not present; import the dataset before running the suite")

    report = get_latest_report(db, incident_id)
    if report is None:
        report = await run_investigation(db, incident_id)

    cases = []
    for case in dataset["retrieval_cases"]:
        retrieval = search_evidence(db, RetrievalSearchRequest(incident_id=incident_id,
            query=case["query"], top_k=10, score_threshold=0.2))
        ranking = [item.citation_id for item in retrieval]
        cases.append({**case, "ranked_citations": ranking, **retrieval_metrics(ranking, case["expected_citations"])})
    aggregate = average_retrieval(cases)
    expected = {citation for case in dataset["retrieval_cases"] for citation in case["expected_citations"]}
    available = {chunk.citation_id for chunk in list_incident_chunks(db, incident_id)}
    try:
        checks = structured_report_checks(report.analysis_json, expected, available)
    except (KeyError, TypeError, ValueError):
        checks = {"citation_coverage": None, "structured_report_unavailable": True}
    citation_coverage = checks["citation_coverage"]
    root_cause_accuracy = 1.0 if report.selected_root_cause == dataset["expected_root_cause"] else 0.0
    # Neither keyword matching nor the model's own flags establish independent safety/claim rates.
    trace_runs, _ = get_incident_trace(db, incident_id)
    completed = [run for run in trace_runs if run.status == "completed" and run.completed_at is not None]
    avg_latency_ms = measured_average([run.latency_ms for run in completed])
    avg_cost_usd = measured_average([run.estimated_cost_usd for run in completed if run.model_name != "unassigned"])

    failed_cases: list[dict[str, Any]] = []
    if root_cause_accuracy < 1.0:
        failed_cases.append(
            {
                "incidentId": f"INC-{incident_id:04d}",
                "timestamp": report.created_at.isoformat(),
                "reason": "Root cause mismatch",
                "confidence": f"{report.confidence_score:.0%}",
                "action": "Review retrieval weighting and hypothesis ranking",
            }
        )
    if citation_coverage is not None and citation_coverage < 1.0:
        failed_cases.append(
            {
                "incidentId": f"INC-{incident_id:04d}",
                "timestamp": report.created_at.isoformat(),
                "reason": "Citation coverage incomplete",
                "confidence": f"{citation_coverage:.0%}",
                "action": "Expand evidence bundle or strengthen report builder citation mapping",
            }
        )

    reasons = []
    if checks.get("structured_report_unavailable"):
        reasons.append("Structured report unavailable or malformed")
    if checks.get("unknown_citations"):
        reasons.append("Report references citations outside this incident")
    if checks.get("model_flagged_claims") or checks.get("model_flagged_actions"):
        reasons.append("Model flagged claims or actions; independent review required")
    for case in cases:
        if case["recall_at_10"] < 1:
            reasons.append(f"Retrieval missed expected evidence: {case['query']}")
    failed_cases.extend({"incidentId": f"INC-{incident_id:04d}", "timestamp": report.created_at.isoformat(),
        "reason": reason, "confidence": "Review required", "action": "Inspect case evidence and structured report"} for reason in reasons)

    summary = {
        "evaluation_version": 2,
        "incident_count": 1,
        "query_count": len(cases),
        "expected_root_cause": dataset["expected_root_cause"],
        "selected_root_cause": report.selected_root_cause,
        "retrieval_cases": cases,
        "report_checks": checks,
        "completed_trace_count": len(completed),
        "limitations": ["One synthetic incident is not population accuracy", "Citation presence is not semantic claim support",
            "Unsupported-claim and unsafe-action rates are not independently measured",
            "Latency is per completed agent step; cost is an estimate, not a bill"],
    }

    eval_run = EvalRun(
        dataset_name=dataset["dataset_name"],
        recall_at_5=round(aggregate["recall_at_5"], 4),
        recall_at_10=round(aggregate["recall_at_10"], 4),
        mrr=round(aggregate["mrr"], 4),
        root_cause_accuracy=round(root_cause_accuracy, 4),
        citation_coverage=round(citation_coverage, 4) if citation_coverage is not None else None,
        unsupported_claim_rate=None,
        unsafe_action_rate=None,
        avg_latency_ms=round(avg_latency_ms, 2) if avg_latency_ms is not None else None,
        avg_cost_usd=round(avg_cost_usd, 4) if avg_cost_usd is not None else None,
        summary_json=summary,
        failed_cases_json=failed_cases,
    )
    db.add(eval_run)
    db.commit()
    db.refresh(eval_run)
    return eval_run


def list_eval_runs(db: Session) -> list[EvalRun]:
    return list(db.query(EvalRun).order_by(EvalRun.created_at.desc()).all())
