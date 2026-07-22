from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.evidence import EvidenceItem
from app.schemas.evidence import EvidenceProcessResponse
from app.services.evidence_processing_service import process_evidence_item
from app.services.evidence_service import delete_evidence
from app.services.evidence_storage import resolve_evidence_storage_path
from app.services.blob_storage import BlobStorageError, download_file

router = APIRouter(prefix="/api", tags=["evidence"])


@router.delete("/evidence/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_evidence(evidence_id: int, db: Session = Depends(get_db)) -> None:
    evidence = db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    delete_evidence(db, evidence)


@router.post("/evidence/{evidence_id}/process", response_model=EvidenceProcessResponse)
def process_evidence(evidence_id: int, db: Session = Depends(get_db)) -> EvidenceProcessResponse:
    evidence = db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    result = process_evidence_item(db, evidence)
    return EvidenceProcessResponse(
        evidence_id=result.evidence_id,
        status=result.status,
        chunks_created=result.chunks_created,
        embedding_status=result.embedding_status,
    )


@router.get("/evidence/{evidence_id}/file")
def read_evidence_file(evidence_id: int, db: Session = Depends(get_db)) -> FileResponse:
    evidence = db.get(EvidenceItem, evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    metadata = evidence.metadata_json or {}
    storage_url = metadata.get("storage_url")
    if storage_url:
        try:
            return Response(
                content=download_file(str(storage_url)),
                media_type=str(metadata.get("mime_type", "application/octet-stream")),
                headers={"Content-Disposition": f'attachment; filename="{metadata.get("filename", "evidence")}"', "Cache-Control": "private, no-store"},
            )
        except BlobStorageError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc
    storage_path = metadata.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="Evidence has no uploaded file")
    try:
        absolute_path = resolve_evidence_storage_path(str(storage_path))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not absolute_path.is_file():
        raise HTTPException(status_code=404, detail="Stored evidence file not found")
    return FileResponse(
        absolute_path,
        media_type=str(metadata.get("mime_type", "application/octet-stream")),
        filename=str(metadata.get("filename", absolute_path.name)),
    )
