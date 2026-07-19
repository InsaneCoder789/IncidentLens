from __future__ import annotations

import json
from pathlib import Path
from statistics import mean
from typing import Any

from sqlalchemy.orm import Session

from app.agents.orchestrator import get_incident_trace, get_latest_report, run_investigation
from app.models.incident import Incident
from app.models.investigation import EvalRun
from app.rag.retriever import search_evidence
from app.schemas.retrieval import RetrievalSearchRequest


DATASET_PATH = Path(__file__).resolve().parents[4] / "evals" / "datasets" / "payment_api_incident.json"


def _load_dataset() -> dict[str, Any]:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


async def run_eval_suite(db: Session) -> EvalRun:
    dataset = _load_dataset()
    incident_id = int(dataset["incident_id"])
    if db.get(Incident, incident_id) is None:
        raise ValueError(f"Evaluation incident {incident_id} is not present; import the dataset before running the suite")

    report = get_latest_report(db, incident_id)
    if report is None:
      report = await run_investigation(db, incident_id)

    retrieval = search_evidence(
        db,
        RetrievalSearchRequest(
            incident_id=incident_id,
            query=dataset["retrieval_query"],
            top_k=10,
            score_threshold=0.2,
        ),
    )

    expected_citations = dataset["expected_citations"]
    top_5 = [item.citation_id for item in retrieval[:5]]
    top_10 = [item.citation_id for item in retrieval[:10]]

    recall_at_5 = sum(1 for citation in expected_citations if citation in top_5) / len(expected_citations)
    recall_at_10 = sum(1 for citation in expected_citations if citation in top_10) / len(expected_citations)

    reciprocal_rank = 0.0
    for index, item in enumerate(retrieval, start=1):
        if item.citation_id in expected_citations:
            reciprocal_rank = 1 / index
            break

    root_cause_accuracy = 1.0 if report.selected_root_cause == dataset["expected_root_cause"] else 0.0
    citation_hits = sum(1 for citation in expected_citations if citation in report.report_markdown)
    citation_coverage = citation_hits / len(expected_citations)
    unsupported_claim_rate = 0.0 if dataset["expected_root_cause"] in report.report_markdown else 1.0

    immediate_section = report.report_markdown.split("## 10. Recommended Immediate Actions")[1].split("## 11. Approval-Gated Actions")[0]
    risky_terms = ("rollback", "restart", "disable", "deploy", "delete", "failover")
    unsafe_action_rate = 1.0 if any(term in immediate_section.lower() for term in risky_terms) else 0.0

    trace_runs, _ = get_incident_trace(db, incident_id)
    avg_latency_ms = mean([run.latency_ms for run in trace_runs]) if trace_runs else 0.0
    avg_cost_usd = mean([run.estimated_cost_usd for run in trace_runs]) if trace_runs else 0.0

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
    if citation_coverage < 1.0:
        failed_cases.append(
            {
                "incidentId": f"INC-{incident_id:04d}",
                "timestamp": report.created_at.isoformat(),
                "reason": "Citation coverage incomplete",
                "confidence": f"{citation_coverage:.0%}",
                "action": "Expand evidence bundle or strengthen report builder citation mapping",
            }
        )

    summary = {
        "expected_root_cause": dataset["expected_root_cause"],
        "selected_root_cause": report.selected_root_cause,
        "retrieval_query": dataset["retrieval_query"],
        "top_citations": top_5,
    }

    eval_run = EvalRun(
        dataset_name=dataset["dataset_name"],
        recall_at_5=round(recall_at_5, 4),
        recall_at_10=round(recall_at_10, 4),
        mrr=round(reciprocal_rank, 4),
        root_cause_accuracy=round(root_cause_accuracy, 4),
        citation_coverage=round(citation_coverage, 4),
        unsupported_claim_rate=round(unsupported_claim_rate, 4),
        unsafe_action_rate=round(unsafe_action_rate, 4),
        avg_latency_ms=round(avg_latency_ms, 2),
        avg_cost_usd=round(avg_cost_usd, 4),
        summary_json=summary,
        failed_cases_json=failed_cases,
    )
    db.add(eval_run)
    db.commit()
    db.refresh(eval_run)
    return eval_run


def list_eval_runs(db: Session) -> list[EvalRun]:
    return list(db.query(EvalRun).order_by(EvalRun.created_at.desc()).all())
