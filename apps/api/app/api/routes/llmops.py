from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.integrations.service import list_integration_health
from app.models.investigation import EvalRun, PromptVersion
from app.schemas.llmops import LlmopsOverviewRead, PromptVersionSummary

router = APIRouter(prefix="/api/llmops", tags=["llmops"])


@router.get("/overview", response_model=LlmopsOverviewRead)
def read_llmops_overview(db: Session = Depends(get_db)) -> LlmopsOverviewRead:
    settings = get_settings()
    latest_eval = db.scalar(select(EvalRun).order_by(EvalRun.created_at.desc()))
    prompts = list(db.scalars(select(PromptVersion).order_by(PromptVersion.created_at.desc()).limit(8)))
    integrations = list_integration_health()
    healthy = sum(1 for item in integrations if item.status == "configured")

    return LlmopsOverviewRead(
        provider_configured=settings.llm_api_key is not None,
        reasoning_model_primary=settings.reasoning_model_primary,
        reasoning_model_fallback=settings.reasoning_model_fallback,
        embedding_model_name=settings.embedding_model_name,
        tracing_enabled=settings.tracing_enabled,
        cost_tracking_enabled=settings.cost_tracking_enabled,
        prompt_versioning_enabled=settings.prompt_versioning_enabled,
        generation_temperature=settings.generation_temperature,
        generation_max_tokens=settings.generation_max_tokens,
        integration_status_summary={
            "total": len(integrations),
            "healthy": healthy,
            "degraded": len(integrations) - healthy,
        },
        latest_eval_summary=(
            {
                "dataset_name": latest_eval.dataset_name,
                "root_cause_accuracy": latest_eval.root_cause_accuracy,
                "citation_coverage": latest_eval.citation_coverage,
                "avg_latency_ms": latest_eval.avg_latency_ms,
                "avg_cost_usd": latest_eval.avg_cost_usd,
            }
            if latest_eval
            else {}
        ),
        prompt_versions=[PromptVersionSummary(name=item.name, version=item.version) for item in prompts],
    )
