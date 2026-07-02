from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceChunk, EvidenceItem
from app.schemas.evidence import EvidenceItemCreate


def list_evidence(db: Session, incident_id: int) -> list[EvidenceItem]:
    return list(db.scalars(select(EvidenceItem).where(EvidenceItem.incident_id == incident_id).order_by(EvidenceItem.created_at.desc())))


def create_evidence(db: Session, incident_id: int, payload: EvidenceItemCreate) -> EvidenceItem:
    evidence = EvidenceItem(incident_id=incident_id, **payload.model_dump())
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


def delete_evidence(db: Session, evidence: EvidenceItem) -> None:
    db.delete(evidence)
    db.commit()


def list_chunks(db: Session, evidence_item_id: int) -> list[EvidenceChunk]:
    return list(db.scalars(select(EvidenceChunk).where(EvidenceChunk.evidence_item_id == evidence_item_id).order_by(EvidenceChunk.chunk_index.asc())))

