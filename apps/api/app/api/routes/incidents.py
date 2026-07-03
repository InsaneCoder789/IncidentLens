import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agents.orchestrator import get_incident_trace, get_latest_report, run_investigation
from app.db.session import get_db
from app.schemas.evidence import EvidenceChunkRead, EvidenceItemCreate, EvidenceItemRead, ProcessAllEvidenceResponse
from app.schemas.incident import IncidentCreate, IncidentRead, IncidentUpdate
from app.schemas.investigation import AgentRunRead, IncidentReportRead, IncidentTraceRead, InvestigationStartResponse, ToolCallRead
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
def investigate_incident(incident_id: int, db: Session = Depends(get_db)) -> InvestigationStartResponse:
    incident = get_incident(db, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    report = asyncio.run(run_investigation(db, incident_id))
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
