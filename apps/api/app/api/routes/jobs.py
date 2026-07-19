from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import ServicePrincipal, require_api_token
from app.db.session import get_db
from app.jobs.service import QueueUnavailable, cancel_job, enqueue_job
from app.models.jobs import Job
from app.schemas.jobs import JobRead
from app.services.incident_service import get_incident


router = APIRouter(prefix="/api", tags=["jobs"])


def _key(value: str | None, kind: str, incident_id: int | None) -> str:
    return value or f"{kind}:{incident_id or 'global'}:{uuid4()}"


@router.post("/incidents/{incident_id}/investigation-jobs", response_model=JobRead, status_code=status.HTTP_202_ACCEPTED)
def create_investigation_job(incident_id: int, idempotency_key: str | None = Header(default=None), db: Session = Depends(get_db), principal: ServicePrincipal = Depends(require_api_token)) -> JobRead:
    if get_incident(db, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        return JobRead.model_validate(enqueue_job(db, kind="investigation", incident_id=incident_id, requested_by=principal.subject, idempotency_key=_key(idempotency_key, "investigation", incident_id)))
    except QueueUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/incidents/{incident_id}/evidence-jobs", response_model=JobRead, status_code=status.HTTP_202_ACCEPTED)
def create_evidence_job(incident_id: int, idempotency_key: str | None = Header(default=None), db: Session = Depends(get_db), principal: ServicePrincipal = Depends(require_api_token)) -> JobRead:
    if get_incident(db, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    try:
        return JobRead.model_validate(enqueue_job(db, kind="evidence_processing", incident_id=incident_id, requested_by=principal.subject, idempotency_key=_key(idempotency_key, "evidence", incident_id)))
    except QueueUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/evaluation-jobs", response_model=JobRead, status_code=status.HTTP_202_ACCEPTED)
def create_evaluation_job(idempotency_key: str | None = Header(default=None), db: Session = Depends(get_db), principal: ServicePrincipal = Depends(require_api_token)) -> JobRead:
    try:
        return JobRead.model_validate(enqueue_job(db, kind="evaluation", requested_by=principal.subject, idempotency_key=_key(idempotency_key, "evaluation", None)))
    except QueueUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/jobs/{job_id}", response_model=JobRead)
def read_job(job_id: str, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobRead.model_validate(job)


@router.post("/jobs/{job_id}/cancel", response_model=JobRead)
def request_job_cancellation(job_id: str, db: Session = Depends(get_db)) -> JobRead:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        return JobRead.model_validate(cancel_job(db, job))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
