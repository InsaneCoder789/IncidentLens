import asyncio
import re
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.agents.orchestrator import get_incident_trace, get_latest_report, run_investigation
from app.db.session import get_db
from app.core.config import get_settings
from app.core.security import ServicePrincipal, require_api_token
from app.schemas.evidence import (
    EVIDENCE_SOURCE_TYPES,
    EvidenceChunkRead,
    EvidenceItemCreate,
    EvidenceItemRead,
    EvidenceProcessResponse,
    EvidenceUploadResponse,
    ProcessAllEvidenceResponse,
)
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.schemas.investigation import AgentRunRead, IncidentReportRead, IncidentTraceRead, InvestigationStartResponse, ToolCallRead
from app.services.evidence_processing_service import process_all_evidence_for_incident, process_evidence_item
from app.services.evidence_service import list_evidence, create_evidence, list_incident_chunks
from app.services.evidence_storage import evidence_storage_root
from app.services.multimodal_extraction_service import MultimodalExtractionService, infer_source_type
from app.services.incident_service import (
    create_incident,
    delete_incident,
    evidence_count_for_incident,
    get_incident,
    list_incidents,
    update_incident,
)
from app.services.operations_service import record_audit_event, record_incident_event

router = APIRouter(prefix="/api/incidents", tags=["incidents"])
settings = get_settings()


def _safe_filename(filename: str) -> str:
    base = Path(filename).name
    sanitized = re.sub(r"[^A-Za-z0-9._-]+", "-", base).strip(".-")
    return sanitized or "evidence"


@router.get("", response_model=list[IncidentRead])
def read_incidents(db: Session = Depends(get_db)) -> list[IncidentRead]:
    incidents = list_incidents(db)
    return [
        IncidentRead.model_validate({**incident.__dict__, "evidence_count": evidence_count_for_incident(db, incident.id)})
        for incident in incidents
    ]


@router.post("", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident_route(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> IncidentRead:
    incident = create_incident(db, payload)
    record_incident_event(
        db,
        incident_id=incident.id,
        event_type="incident_created",
        title="Incident created",
        description=incident.description,
        actor=principal.subject,
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action="incident.created",
        resource_type="incident",
        resource_id=str(incident.id),
        incident_id=incident.id,
    )
    db.commit()
    return IncidentRead.model_validate({**incident.__dict__, "evidence_count": 0})


@router.get("/{incident_id}", response_model=IncidentRead)
def read_incident(incident_id: int, db: Session = Depends(get_db)) -> IncidentRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return IncidentRead.model_validate({**incident.__dict__, "evidence_count": evidence_count_for_incident(db, incident.id)})


@router.patch("/{incident_id}", response_model=IncidentRead)
def patch_incident(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> IncidentRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    updated = update_incident(db, incident, payload)
    changes = payload.model_dump(exclude_unset=True)
    record_incident_event(
        db,
        incident_id=incident_id,
        event_type="incident_updated",
        title="Incident updated",
        description=", ".join(sorted(changes)) or "Incident metadata updated",
        actor=principal.subject,
        metadata={"changes": changes},
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action="incident.updated",
        resource_type="incident",
        resource_id=str(incident_id),
        incident_id=incident_id,
        details={"changes": changes},
    )
    db.commit()
    return IncidentRead.model_validate({**updated.__dict__, "evidence_count": evidence_count_for_incident(db, updated.id)})


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> None:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    record_audit_event(
        db,
        actor=principal.subject,
        action="incident.deleted",
        resource_type="incident",
        resource_id=str(incident_id),
        details={"title": incident.title},
    )
    db.commit()
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


@router.post(
    "/{incident_id}/evidence/upload",
    response_model=EvidenceUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_incident_evidence(
    incident_id: int,
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    description: str = Form(default=""),
    source_type: str | None = Form(default=None),
    process_immediately: bool = Form(default=True),
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> EvidenceUploadResponse:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    filename = _safe_filename(file.filename or "evidence")
    extension = Path(filename).suffix.lower()
    allowed_extensions = (
        MultimodalExtractionService.image_extensions
        | MultimodalExtractionService.document_extensions
        | MultimodalExtractionService.audio_extensions
    )
    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Accepted extensions: {', '.join(sorted(allowed_extensions))}",
        )

    inferred_source_type = infer_source_type(
        filename=filename,
        mime_type=file.content_type or "application/octet-stream",
        requested_source_type=source_type,
    )
    if inferred_source_type not in EVIDENCE_SOURCE_TYPES:
        raise HTTPException(status_code=422, detail=f"Unsupported evidence source type: {inferred_source_type}")

    relative_dir = Path(settings.evidence_storage_dir) / str(incident_id)
    absolute_dir = evidence_storage_root() / str(incident_id)
    absolute_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}-{filename}"
    relative_path = relative_dir / stored_filename
    absolute_path = absolute_dir / stored_filename

    size = 0
    try:
        with absolute_path.open("wb") as destination:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_evidence_upload_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the {settings.max_evidence_upload_bytes // (1024 * 1024)} MB upload limit.",
                    )
                destination.write(chunk)
    except Exception:
        absolute_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    evidence = create_evidence(
        db,
        incident_id,
        EvidenceItemCreate(
            source_type=inferred_source_type,
            title=title or Path(filename).stem.replace("-", " ").replace("_", " ").strip().title(),
            raw_content=description,
            metadata_json={
                "filename": filename,
                "mime_type": file.content_type or "application/octet-stream",
                "file_size_bytes": size,
                "storage_path": relative_path.as_posix(),
                "extraction_status": "pending",
                "upload_mode": "local_development_storage",
            },
        ),
    )

    processing = None
    upload_status = "uploaded"
    if process_immediately:
        result = process_evidence_item(db, evidence)
        processing = EvidenceProcessResponse(
            evidence_id=result.evidence_id,
            status=result.status,
            chunks_created=result.chunks_created,
            embedding_status=result.embedding_status,
        )
        upload_status = "processed"

    db.refresh(evidence)
    record_incident_event(
        db,
        incident_id=incident_id,
        event_type="evidence_uploaded",
        title="Evidence uploaded",
        description=evidence.title,
        actor=principal.subject,
        metadata={"evidence_id": evidence.id, "source_type": evidence.source_type},
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action="evidence.uploaded",
        resource_type="evidence",
        resource_id=str(evidence.id),
        incident_id=incident_id,
    )
    db.commit()
    return EvidenceUploadResponse(
        evidence=EvidenceItemRead.model_validate(evidence),
        processing=processing,
        upload_status=upload_status,
    )


@router.post("/{incident_id}/evidence/process-all", response_model=ProcessAllEvidenceResponse)
def process_all_incident_evidence(incident_id: int, db: Session = Depends(get_db)) -> ProcessAllEvidenceResponse:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    result = process_all_evidence_for_incident(db, incident_id)
    return ProcessAllEvidenceResponse(
        incident_id=result.incident_id,
        processed=result.processed,
        failed=result.failed,
        chunks_created=result.chunks_created,
    )


@router.get("/{incident_id}/chunks", response_model=list[EvidenceChunkRead])
def read_incident_chunks(incident_id: int, db: Session = Depends(get_db)) -> list[EvidenceChunkRead]:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return [EvidenceChunkRead.model_validate(chunk) for chunk in list_incident_chunks(db, incident_id)]


@router.post("/{incident_id}/investigate", response_model=InvestigationStartResponse)
def investigate_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    principal: ServicePrincipal = Depends(require_api_token),
) -> InvestigationStartResponse:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    report = asyncio.run(run_investigation(db, incident_id))
    record_incident_event(
        db,
        incident_id=incident_id,
        event_type="investigation_completed",
        title="Investigation completed",
        description=report.selected_root_cause,
        actor=principal.subject,
        metadata={"report_id": report.id, "confidence": report.confidence_score},
    )
    record_audit_event(
        db,
        actor=principal.subject,
        action="investigation.completed",
        resource_type="incident_report",
        resource_id=report.id,
        incident_id=incident_id,
    )
    db.commit()
    return InvestigationStartResponse(
        incident_id=str(incident_id),
        status="completed",
        report_id=report.id,
        selected_root_cause=report.selected_root_cause,
        confidence_score=report.confidence_score,
        quality_score=report.evaluation_score,
    )


@router.get("/{incident_id}/report", response_model=IncidentReportRead)
def read_incident_report(incident_id: int, db: Session = Depends(get_db)) -> IncidentReportRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    report = get_latest_report(db, incident_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return IncidentReportRead(
        incident_id=str(incident_id),
        report_id=report.id,
        report_markdown=report.report_markdown,
        selected_root_cause=report.selected_root_cause,
        confidence_score=report.confidence_score,
        evaluation_score=report.evaluation_score,
        analysis_json=report.analysis_json,
        created_at=report.created_at,
    )


@router.get("/{incident_id}/trace", response_model=IncidentTraceRead)
def read_incident_trace(incident_id: int, db: Session = Depends(get_db)) -> IncidentTraceRead:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    agent_runs, tool_calls = get_incident_trace(db, incident_id)
    return IncidentTraceRead(
        incident_id=str(incident_id),
        agent_runs=[
            AgentRunRead(
                id=item.id,
                agent_name=item.agent_name,
                status=item.status,
                input_summary=item.input_summary,
                output_summary=item.output_summary,
                model_name=item.model_name,
                prompt_version=item.prompt_version,
                latency_ms=item.latency_ms,
                token_input=item.token_input,
                token_output=item.token_output,
                estimated_cost_usd=item.estimated_cost_usd,
                started_at=item.started_at,
                completed_at=item.completed_at,
                error_message=item.error_message,
            )
            for item in agent_runs
        ],
        tool_calls=[
            ToolCallRead(
                id=item.id,
                agent_run_id=item.agent_run_id,
                tool_name=item.tool_name,
                status=item.status,
                input_json=item.input_json,
                output_json=item.output_json,
                latency_ms=item.latency_ms,
                created_at=item.created_at,
                error_message=item.error_message,
            )
            for item in tool_calls
        ],
    )
