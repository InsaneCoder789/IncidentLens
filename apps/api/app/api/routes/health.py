from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session
import redis

from app.core.config import get_settings
from app.db.session import get_db
from app.integrations.service import list_integration_health
from app.services.blob_storage import blob_storage_enabled

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health/live")
def liveness() -> dict:
    return {"status": "ok"}


@router.get("/health")
@router.get("/health/ready")
def health(response: Response, db: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    db_status = "ok"
    redis_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "degraded"
    try:
        redis.Redis.from_url(settings.redis_url).ping()
    except Exception:
        redis_status = "degraded"
    if db_status != "ok" or redis_status != "ok":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return {
        "status": "ok" if db_status == "ok" and redis_status == "ok" else "degraded",
        "environment": settings.environment,
        "database": db_status,
        "redis": redis_status,
        "llm_provider": "configured" if settings.llm_api_key is not None else "not_configured",
        "job_runner": "configured" if settings.cron_secret is not None else "not_configured",
        "evidence_storage": "vercel_blob" if blob_storage_enabled() else "local_filesystem",
        "integrations": {item.key: item.status for item in list_integration_health()},
    }
