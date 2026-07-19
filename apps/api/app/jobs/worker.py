from __future__ import annotations

import asyncio
from datetime import UTC, datetime

import redis

from app.agents.orchestrator import run_investigation
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.evals.runner import run_eval_suite
from app.models.jobs import Job
from app.services.evidence_processing_service import process_all_evidence_for_incident


def execute_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.get(Job, job_id)
        if job is None or job.status in {"completed", "cancelled"}:
            return
        if job.status == "cancellation_requested":
            job.status = "cancelled"
            job.completed_at = datetime.now(UTC)
            db.commit()
            return
        job.status = "running"
        job.progress = 5
        job.attempts += 1
        job.started_at = datetime.now(UTC)
        job.error_message = None
        db.commit()

        if job.kind == "investigation" and job.incident_id is not None:
            report = asyncio.run(run_investigation(db, job.incident_id))
            result = {
                "report_id": report.id,
                "selected_root_cause": report.selected_root_cause,
                "confidence_score": report.confidence_score,
                "quality_score": report.evaluation_score,
            }
        elif job.kind == "evidence_processing" and job.incident_id is not None:
            processed = process_all_evidence_for_incident(db, job.incident_id)
            result = {"processed": processed.processed, "failed": processed.failed, "chunks_created": processed.chunks_created}
        elif job.kind == "evaluation":
            evaluation = asyncio.run(run_eval_suite(db))
            result = {
                "eval_run_id": evaluation.id,
                "root_cause_accuracy": evaluation.root_cause_accuracy,
                "citation_coverage": evaluation.citation_coverage,
            }
        else:
            raise ValueError(f"Unsupported job kind: {job.kind}")

        db.refresh(job)
        if job.status == "cancellation_requested":
            job.status = "cancelled"
            job.result_json = {}
        else:
            job.status = "completed"
            job.progress = 100
            job.result_json = result
        job.completed_at = datetime.now(UTC)
        db.commit()
    except Exception as exc:
        db.rollback()
        job = db.get(Job, job_id)
        if job is not None:
            job.error_message = str(exc)
            if job.attempts < job.max_attempts:
                job.status = "queued"
                db.commit()
                settings = get_settings()
                redis.Redis.from_url(settings.redis_url, decode_responses=True).lpush(settings.job_queue_name, job.id)
            else:
                job.status = "failed"
                job.completed_at = datetime.now(UTC)
                db.commit()
    finally:
        db.close()


def run_worker() -> None:
    settings = get_settings()
    queue = redis.Redis.from_url(settings.redis_url, decode_responses=True)
    while True:
        item = queue.brpop(settings.job_queue_name, timeout=5)
        if item:
            execute_job(item[1])


if __name__ == "__main__":
    run_worker()
