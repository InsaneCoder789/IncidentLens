from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.evals.runner import list_eval_runs, run_eval_suite
from app.schemas.evals import EvalRunRead, EvalRunTriggerResponse

router = APIRouter(prefix="/api/evals", tags=["evals"])


@router.get("/history", response_model=list[EvalRunRead])
def read_eval_history(db: Session = Depends(get_db)) -> list[EvalRunRead]:
    runs = list_eval_runs(db)
    return [
        EvalRunRead(
            id=run.id,
            dataset_name=run.dataset_name,
            recall_at_5=run.recall_at_5,
            recall_at_10=run.recall_at_10,
            mrr=run.mrr,
            root_cause_accuracy=run.root_cause_accuracy,
            citation_coverage=run.citation_coverage,
            unsupported_claim_rate=run.unsupported_claim_rate,
            unsafe_action_rate=run.unsafe_action_rate,
            avg_latency_ms=run.avg_latency_ms,
            avg_cost_usd=run.avg_cost_usd,
            summary_json=run.summary_json,
            failed_cases_json=run.failed_cases_json,
            created_at=run.created_at,
        )
        for run in runs
    ]


@router.post("/run", response_model=EvalRunTriggerResponse)
async def trigger_eval_run(db: Session = Depends(get_db)) -> EvalRunTriggerResponse:
    run = await run_eval_suite(db)
    return EvalRunTriggerResponse(
        status="completed",
        run=EvalRunRead(
            id=run.id,
            dataset_name=run.dataset_name,
            recall_at_5=run.recall_at_5,
            recall_at_10=run.recall_at_10,
            mrr=run.mrr,
            root_cause_accuracy=run.root_cause_accuracy,
            citation_coverage=run.citation_coverage,
            unsupported_claim_rate=run.unsupported_claim_rate,
            unsafe_action_rate=run.unsafe_action_rate,
            avg_latency_ms=run.avg_latency_ms,
            avg_cost_usd=run.avg_cost_usd,
            summary_json=run.summary_json,
            failed_cases_json=run.failed_cases_json,
            created_at=run.created_at,
        ),
    )
