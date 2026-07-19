from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.incident import Incident
from app.models.operations import ApprovalRequest, AuditEvent, IncidentEvent, RuntimeSetting
from app.schemas.operations import RuntimeSettingsRead, RuntimeSettingsUpdate


def record_incident_event(
    db: Session,
    *,
    incident_id: int,
    event_type: str,
    title: str,
    description: str,
    actor: str,
    metadata: dict | None = None,
) -> IncidentEvent:
    event = IncidentEvent(
        incident_id=incident_id,
        event_type=event_type,
        title=title,
        description=description,
        actor=actor,
        metadata_json=metadata or {},
    )
    db.add(event)
    return event


def record_audit_event(
    db: Session,
    *,
    actor: str,
    action: str,
    resource_type: str,
    resource_id: str,
    incident_id: int | None = None,
    details: dict | None = None,
) -> AuditEvent:
    event = AuditEvent(
        incident_id=incident_id,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details_json=details or {},
    )
    db.add(event)
    return event


def runtime_settings(db: Session) -> RuntimeSettingsRead:
    settings = get_settings()
    values = {
        "reasoning_model_primary": settings.reasoning_model_primary,
        "reasoning_model_fallback": settings.reasoning_model_fallback,
        "embedding_model_name": settings.embedding_model_name,
        "tracing_enabled": settings.tracing_enabled,
        "cost_tracking_enabled": settings.cost_tracking_enabled,
        "prompt_versioning_enabled": settings.prompt_versioning_enabled,
        "generation_temperature": settings.generation_temperature,
        "generation_max_tokens": settings.generation_max_tokens,
        "monthly_cost_limit_usd": 500.0,
        "eval_root_cause_threshold": 0.85,
        "eval_citation_threshold": 0.9,
    }
    for row in db.scalars(select(RuntimeSetting)):
        if row.key in values and "value" in row.value_json:
            values[row.key] = row.value_json["value"]
    return RuntimeSettingsRead.model_validate(values)


def update_runtime_settings(db: Session, payload: RuntimeSettingsUpdate, actor: str) -> RuntimeSettingsRead:
    for key, value in payload.model_dump(exclude_unset=True).items():
        row = db.get(RuntimeSetting, key)
        if row is None:
            row = RuntimeSetting(key=key, value_json={"value": value}, updated_by=actor)
        else:
            row.value_json = {"value": value}
            row.updated_by = actor
            row.updated_at = datetime.now(UTC)
        db.add(row)
        record_audit_event(
            db,
            actor=actor,
            action="runtime_setting.updated",
            resource_type="runtime_setting",
            resource_id=key,
            details={"value": value},
        )
    db.commit()
    return runtime_settings(db)


def pending_approval_count(db: Session) -> int:
    return int(db.scalar(select(func.count(ApprovalRequest.id)).where(ApprovalRequest.status == "pending")) or 0)


def active_incident_count(db: Session) -> int:
    return int(db.scalar(select(func.count(Incident.id)).where(Incident.status.not_in(("resolved", "postmortem_ready")))) or 0)
