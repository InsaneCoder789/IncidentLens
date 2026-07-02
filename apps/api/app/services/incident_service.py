from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceItem
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate


def list_incidents(db: Session) -> list[Incident]:
    return list(db.scalars(select(Incident).order_by(Incident.created_at.desc())))


def get_incident(db: Session, incident_id: int) -> Incident | None:
    return db.get(Incident, incident_id)


def create_incident(db: Session, payload: IncidentCreate) -> Incident:
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def update_incident(db: Session, incident: Incident, payload: IncidentUpdate) -> Incident:
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(incident, key, value)
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


def delete_incident(db: Session, incident: Incident) -> None:
    db.delete(incident)
    db.commit()


def evidence_count_for_incident(db: Session, incident_id: int) -> int:
    stmt = select(func.count(EvidenceItem.id)).where(EvidenceItem.incident_id == incident_id)
    return int(db.scalar(stmt) or 0)

