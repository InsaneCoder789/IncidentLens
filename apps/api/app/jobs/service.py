from __future__ import annotations

from datetime import UTC, datetime

import redis
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.jobs import Job


class QueueUnavailable(RuntimeError):
    pass


def enqueue_job(
    db: Session,
    *,
    kind: str,
    requested_by: str,
    idempotency_key: str,
    incident_id: int | None = None,
    payload: dict | None = None,
    publish: bool = True,
) -> Job:
    existing = db.scalar(select(Job).where(Job.idempotency_key == idempotency_key))
    if existing is not None:
        return existing
    settings = get_settings()
    job = Job(kind=kind, incident_id=incident_id, payload_json=payload or {}, idempotency_key=idempotency_key, max_attempts=settings.job_max_attempts, requested_by=requested_by)
    db.add(job)
    db.commit()
    db.refresh(job)
    if publish:
        try:
            redis.Redis.from_url(settings.redis_url, decode_responses=True).lpush(settings.job_queue_name, job.id)
        except redis.RedisError as exc:
            job.status = "failed"
            job.error_message = "Job queue is unavailable"
            job.completed_at = datetime.now(UTC)
            db.add(job)
            db.commit()
            raise QueueUnavailable("Job queue is unavailable") from exc
    return job


def cancel_job(db: Session, job: Job) -> Job:
    if job.status not in {"queued", "running"}:
        raise ValueError(f"Job cannot be cancelled from {job.status}")
    job.status = "cancellation_requested" if job.status == "running" else "cancelled"
    if job.status == "cancelled":
        job.completed_at = datetime.now(UTC)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
