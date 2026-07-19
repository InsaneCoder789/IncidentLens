from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import ServicePrincipal, require_api_token
from app.db.session import get_db
from app.models.incident import Incident
from app.models.operations import ApprovalRequest, IncidentEvent
from app.schemas.incident import IncidentRead
from app.schemas.operations import (
    ApprovalCreate,
    ApprovalDecision,
    ApprovalRead,
    DashboardMetric,
    DashboardRead,
    IncidentEventRead,
    RuntimeSettingsRead,
    RuntimeSettingsUpdate,
)
from app.services.incident_service import evidence_count_for_incident, get_incident, list_incidents
from app.services.operations_service import (
    active_incident_count,
    pending_approval_count,
    record_audit_event,
    record_incident_event,
    runtime_settings,
    update_runtime_settings,
)


router = APIRouter(prefix="/api", tags=["operations"])


@router.get("/dashboard", response_model=DashboardRead)
def read_dashboard(db: Session = Depends(get_db)) -> DashboardRead:
    incidents = list_incidents(db)
    incident_reads = [
        IncidentRead.model_validate({**incident.__dict__, "evidence_count": evidence_count_for_incident(db, incident.id)})
        for incident in incidents
    ]
    recent_events = list(db.scalars(select(IncidentEvent).order_by(IncidentEvent.created_at.desc()).limit(8)))
    active = active_incident_count(db)
    critical = sum(1 for item in incidents if item.severity == "critical" and item.status not in {"resolved", "postmortem_ready"})
    approvals = pending_approval_count(db)
    confidence_values = [item.latest_confidence_score for item in incidents if item.latest_confidence_score is not None]
    average_confidence = sum(confidence_values) / len(confidence_values) if confidence_values else 0.0
    return DashboardRead(
        incidents=incident_reads,
        metrics=[
            DashboardMetric(label="Active incidents", value=str(active), detail="Open operational investigations", tone="danger" if critical else "warning"),
            DashboardMetric(label="Critical", value=str(critical), detail="SEV-1 incidents requiring attention", tone="danger" if critical else "success"),
            DashboardMetric(label="Pending approvals", value=str(approvals), detail="Human decisions waiting", tone="warning" if approvals else "success"),
            DashboardMetric(label="Mean confidence", value=f"{average_confidence * 100:.0f}%", detail="Across investigated incidents", tone="accent"),
        ],
        recent_events=[IncidentEventRead.model_validate(item) for item in recent_events],
        pending_approvals=approvals,
    )


@router.get("/incidents/{incident_id}/events", response_model=list[IncidentEventRead])
def read_incident_events(incident_id: int, db: Session = Depends(get_db)) -> list[IncidentEventRead]:
    if get_incident(db, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    events = db.scalars(
        select(IncidentEvent).where(IncidentEvent.incident_id == incident_id).order_by(IncidentEvent.created_at.asc())
    )
    return [IncidentEventRead.model_validate(item) for item in events]


@router.get("/incidents/{incident_id}/approvals", response_model=list[ApprovalRead])
def read_approvals(incident_id: int, db: Session = Depends(get_db)) -> list[ApprovalRead]:
    if get_incident(db, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    rows = db.scalars(
        select(ApprovalRequest).where(ApprovalRequest.incident_id == incident_id).order_by(ApprovalRequest.created_at.desc())
    )
    return [ApprovalRead.model_validate(item) for item in rows]


@router.post("/incidents/{incident_id}/approvals", response_model=ApprovalRead, status_code=status.HTTP_201_CREATED)
def request_approval(
    incident_id: int,
    payload: ApprovalCreate,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> ApprovalRead:
    if get_incident(db, incident_id) is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    duplicate = db.scalar(
        select(ApprovalRequest).where(
            ApprovalRequest.incident_id == incident_id,
            ApprovalRequest.action == payload.action.strip(),
            ApprovalRequest.status == "pending",
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="A pending approval already exists for this action")
    approval = ApprovalRequest(
        incident_id=incident_id,
        action=payload.action.strip(),
        rationale=payload.rationale.strip(),
        requested_by=principal.subject,
    )
    db.add(approval)
    db.flush()
    record_incident_event(
        db,
        incident_id=incident_id,
        event_type="approval_requested",
        title="Approval requested",
        description=approval.action,
        actor=principal.subject,
        metadata={"approval_id": approval.id},
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action="approval.requested",
        resource_type="approval_request",
        resource_id=approval.id,
        incident_id=incident_id,
    )
    db.commit()
    db.refresh(approval)
    return ApprovalRead.model_validate(approval)


@router.patch("/approvals/{approval_id}", response_model=ApprovalRead)
def decide_approval(
    approval_id: str,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> ApprovalRead:
    approval = db.get(ApprovalRequest, approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval request not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Approval is already {approval.status}")
    if approval.version != payload.expected_version:
        raise HTTPException(status_code=409, detail="Approval changed; refresh before deciding")
    approval.status = payload.decision
    approval.reviewed_by = principal.subject
    approval.decision_note = payload.decision_note.strip()
    approval.reviewed_at = datetime.now(UTC)
    approval.version += 1
    db.add(approval)
    record_incident_event(
        db,
        incident_id=approval.incident_id,
        event_type=f"approval_{payload.decision}",
        title=f"Approval {payload.decision}",
        description=approval.action,
        actor=principal.subject,
        metadata={"approval_id": approval.id, "decision_note": approval.decision_note},
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action=f"approval.{payload.decision}",
        resource_type="approval_request",
        resource_id=approval.id,
        incident_id=approval.incident_id,
    )
    db.commit()
    db.refresh(approval)
    return ApprovalRead.model_validate(approval)


@router.get("/settings", response_model=RuntimeSettingsRead)
def read_runtime_settings(db: Session = Depends(get_db)) -> RuntimeSettingsRead:
    return runtime_settings(db)


@router.patch("/settings", response_model=RuntimeSettingsRead)
def patch_runtime_settings(
    payload: RuntimeSettingsUpdate,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> RuntimeSettingsRead:
    return update_runtime_settings(db, payload, principal.subject)
