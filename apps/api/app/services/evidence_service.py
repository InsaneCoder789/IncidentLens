from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceChunk, EvidenceItem
from app.schemas.evidence import EvidenceItemCreate
from app.services.evidence_storage import remove_persisted_evidence, resolve_evidence_storage_path


def list_evidence(db: Session, incident_id: int) -> list[EvidenceItem]:
    return list(db.scalars(select(EvidenceItem).where(EvidenceItem.incident_id == incident_id).order_by(EvidenceItem.created_at.desc())))


def create_evidence(db: Session, incident_id: int, payload: EvidenceItemCreate) -> EvidenceItem:
    evidence = EvidenceItem(incident_id=incident_id, **payload.model_dump())
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence


def delete_evidence(db: Session, evidence: EvidenceItem) -> None:
    storage_path = (evidence.metadata_json or {}).get("storage_path")
    db.delete(evidence)
    db.commit()
    if (evidence.metadata_json or {}).get("storage_url"):
        try:
            remove_persisted_evidence(evidence.metadata_json or {})
        except Exception:
            pass
    elif storage_path:
        try:
            resolve_evidence_storage_path(str(storage_path)).unlink(missing_ok=True)
        except ValueError:
            pass


def list_chunks(db: Session, evidence_item_id: int) -> list[EvidenceChunk]:
    return list(db.scalars(select(EvidenceChunk).where(EvidenceChunk.evidence_item_id == evidence_item_id).order_by(EvidenceChunk.chunk_index.asc())))


def list_incident_chunks(db: Session, incident_id: int) -> list[EvidenceChunk]:
    return list(
        db.scalars(
            select(EvidenceChunk)
            .where(EvidenceChunk.incident_id == incident_id)
            .order_by(EvidenceChunk.evidence_item_id.asc(), EvidenceChunk.chunk_index.asc())
        )
    )


def clear_chunks_for_evidence(db: Session, evidence_item_id: int) -> None:
    db.execute(delete(EvidenceChunk).where(EvidenceChunk.evidence_item_id == evidence_item_id))
