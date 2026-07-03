from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.evidence import EvidenceChunkRead, EvidenceItemCreate, EvidenceItemRead, ProcessAllEvidenceResponse
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.services.evidence_processing_service import process_all_evidence_for_incident
from app.services.evidence_service import list_evidence, create_evidence, list_incident_chunks
from app.services.incident_service import (
    create_incident,
    delete_incident,
    evidence_count_for_incident,
    get_incident,
    list_incidents,
    update_incident,
)

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.get("", response_model=list[IncidentRead])
def read_incidents(db: Session = Depends(get_db)) -> list[IncidentRead]:
    incidents = list_incidents(db)
    return [
        IncidentRead.model_validate({**incident.__dict__, "evidence_count": evidence_count_for_incident(db, incident.id)})
        for incident in incidents
    ]


@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident_route(payload: IncidentCreate, db: Session = Depends(get_db)) -> IncidentRead:
    incident = create_incident(db, payload)
    return IncidentRead.model_validate({**incident.__dict__, "evidence_count": 0})


@router.get("/{incident_id}", response_model=IncidentRead)
def read_incident(incident_id: int, db: Session = Depends(get_db)) -> IncidentRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentRead.model_validate({**incident.__dict__, "evidence_count": evidence_count_for_incident(db, incident.id)})


@router.patch("/{incident_id}", response_model=IncidentRead)
def patch_incident(incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)) -> IncidentRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    updated = update_incident(db, incident, payload)
    return IncidentRead.model_validate({**updated.__dict__, "evidence_count": evidence_count_for_incident(db, updated.id)})


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_incident(incident_id: int, db: Session = Depends(get_db)) -> None:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    delete_incident(db, incident)


@router.get("/{incident_id}/evidence", response_model=list[EvidenceItemRead])
def read_incident_evidence(incident_id: int, db: Session = Depends(get_db)) -> list[EvidenceItemRead]:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return [EvidenceItemRead.model_validate(item) for item in list_evidence(db, incident_id)]


@router.post("/{incident_id}/evidence", status_code=status.HTTP_201_CREATED)
def create_incident_evidence(incident_id: int, payload: EvidenceItemCreate, db: Session = Depends(get_db)) -> dict:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence = create_evidence(db, incident_id, payload)
    return {
        "id": evidence.id,
        "incident_id": evidence.incident_id,
        "source_type": evidence.source_type,
        "title": evidence.title,
        "raw_content": evidence.raw_content,
        "normalized_content": evidence.normalized_content,
        "metadata_json": evidence.metadata_json,
        "created_at": evidence.created_at,
        "embedding_status": evidence.embedding_status,
        "processing_status": evidence.processing_status,
    }


@router.post("/{incident_id}/evidence/process-all", response_model=ProcessAllEvidenceResponse)
def process_all_incident_evidence(incident_id: int, db: Session = Depends(get_db)) -> ProcessAllEvidenceResponse:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    result = process_all_evidence_for_incident(db, incident_id)
    return ProcessAllEvidenceResponse(**result.__dict__)


@router.get("/{incident_id}/chunks", response_model=list[EvidenceChunkRead])
def read_incident_chunks(incident_id: int, db: Session = Depends(get_db)) -> list[EvidenceChunkRead]:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return [EvidenceChunkRead.model_validate(chunk) for chunk in list_incident_chunks(db, incident_id)]
