from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.service import import_integration_evidence, list_integration_health
from app.schemas.integration import IntegrationHealthRead, IntegrationImportResponse
from app.services.incident_service import get_incident

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/health", response_model=list[IntegrationHealthRead])
def read_integration_health() -> list[IntegrationHealthRead]:
    return [
        IntegrationHealthRead(
            key=item.key,
            label=item.label,
            status=item.status,
            detail=item.detail,
            source_types=item.source_types,
        )
        for item in list_integration_health()
    ]


@router.post("/{integration_key}/incidents/{incident_id}/import", response_model=IntegrationImportResponse)
def import_integration(
    integration_key: str,
    incident_id: int,
    db: Session = Depends(get_db),
) -> IntegrationImportResponse:
    incident = get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    result = import_integration_evidence(db, incident_id, integration_key)
    return IntegrationImportResponse(
        incident_id=incident_id,
        integration_key=integration_key,
        imported=result["imported"],
        updated=result["updated"],
    )
