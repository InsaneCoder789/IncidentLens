from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.evidence import EvidenceItem
from app.schemas.evidence import EvidenceItemCreate
from app.services.evidence_service import delete_evidence

router = APIRouter(prefix="/api", tags=["evidence"])


@router.delete("/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_evidence(evidence_id: int, db: Session = Depends(get_db)) -> None:
    evidence = db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    delete_evidence(db, evidence)


@router.post("/evidence/{evidence_id}/process")
def process_evidence(evidence_id: int, db: Session = Depends(get_db)) -> dict:
    evidence = db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    evidence.processing_status = "normalized"
    evidence.embedding_status = "pending"
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return {"status": "queued", "evidence_id": evidence_id}

