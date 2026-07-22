import hmac

from fastapi import APIRouter, Header, HTTPException

from app.core.config import get_settings
from app.jobs.worker import run_next_job


router = APIRouter(prefix="/api/cron", tags=["cron"])


@router.get("/worker")
def drain_worker(authorization: str | None = Header(default=None)) -> dict[str, str]:
    secret = get_settings().cron_secret
    expected = f"Bearer {secret.get_secret_value()}" if secret else ""
    if not secret or not authorization or not hmac.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Cron authorization required")

    job_id = run_next_job()
    return {"status": "processed", "job_id": job_id} if job_id else {"status": "idle"}
