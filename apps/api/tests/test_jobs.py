from app.db.session import SessionLocal
from app.jobs.service import cancel_job, enqueue_job
from app.jobs.worker import execute_job
from app.models.incident import Incident
from app.models.jobs import Job


def test_jobs_are_idempotent_and_cancellable() -> None:
    db = SessionLocal()
    try:
        incident_id = db.query(Incident.id).scalar()
        first = enqueue_job(db, kind="evidence_processing", incident_id=incident_id, requested_by="test", idempotency_key="evidence:test", publish=False)
        duplicate = enqueue_job(db, kind="evidence_processing", incident_id=incident_id, requested_by="test", idempotency_key="evidence:test", publish=False)
        assert first.id == duplicate.id
        cancelled = cancel_job(db, first)
        assert cancelled.status == "cancelled"
    finally:
        db.close()


def test_worker_persists_completed_job_result() -> None:
    db = SessionLocal()
    try:
        incident_id = db.query(Incident.id).scalar()
        job = enqueue_job(db, kind="evidence_processing", incident_id=incident_id, requested_by="test", idempotency_key="evidence:execute", publish=False)
        job_id = job.id
    finally:
        db.close()

    execute_job(job_id)

    db = SessionLocal()
    try:
        completed = db.get(Job, job_id)
        assert completed is not None
        assert completed.status == "completed"
        assert completed.progress == 100
        assert "processed" in completed.result_json
    finally:
        db.close()
