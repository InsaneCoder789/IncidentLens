from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.evidence import EvidenceItemCreate
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.services.evidence_service import list_evidence, create_evidence
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


@router.get("/{incident_id}/evidence")
def read_incident_evidence(incident_id: int, db: Session = Depends(get_db)) -> list[dict]:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return [
        {
            "id": item.id,
            "incident_id": item.incident_id,
            "source_type": item.source_type,
            "title": item.title,
            "raw_content": item.raw_content,
            "normalized_content": item.normalized_content,
            "metadata_json": item.metadata_json,
            "created_at": item.created_at,
            "embedding_status": item.embedding_status,
            "processing_status": item.processing_status,
        }
        for item in list_evidence(db, incident_id)
    ]


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
