from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.evaluation_agent import EvaluationAgent
from app.agents.intake_agent import IntakeAgent
from app.agents.remediation_agent import RemediationAgent
from app.agents.report_builder import build_report_markdown
from app.agents.retrieval_agent import RetrievalAgent
from app.agents.root_cause_agent import RootCauseAgent
from app.agents.state import InvestigationState
from app.agents.tool_execution_agent import ToolExecutionAgent
from app.models.incident import Incident
from app.models.investigation import AgentRun, IncidentReport, ToolCall
from app.services.model_router import get_model_router
from app.services.evidence_processing_service import process_all_evidence_for_incident
from app.services.evidence_service import list_incident_chunks


async def run_investigation(db: Session, incident_id: int) -> IncidentReport:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise ValueError("Incident not found")

    if not list_incident_chunks(db, incident_id):
        process_all_evidence_for_incident(db, incident_id)

    router = get_model_router()
    state = InvestigationState(
        incident_id=str(incident.id),
        title=incident.title,
        description=incident.description,
        severity=incident.severity,
        status=incident.status,
        affected_service=incident.affected_service,
        incident_type=incident.incident_type,
    )

    agents = [
        IntakeAgent(db, router),
        RetrievalAgent(db, router),
        ToolExecutionAgent(db, router),
        RootCauseAgent(db, router),
        RemediationAgent(db, router),
        EvaluationAgent(db, router),
    ]
    for agent in agents:
        state = await agent.run(state)

    state.report_markdown = build_report_markdown(state)
    confidence = max((item.confidence for item in state.hypotheses if item.title == state.selected_root_cause), default=0.0)
    incident.latest_confidence_score = confidence
    report = IncidentReport(
        incident_id=incident.id,
        report_markdown=state.report_markdown,
        selected_root_cause=state.selected_root_cause or "Insufficient evidence",
        confidence_score=confidence,
        evaluation_score=state.evaluation.quality_score if state.evaluation else 0.0,
    )
    db.add(report)
    db.add(incident)
    db.commit()
    db.refresh(report)
    return report


def get_latest_report(db: Session, incident_id: int) -> IncidentReport | None:
    return db.scalar(
        select(IncidentReport)
        .where(IncidentReport.incident_id == incident_id)
        .order_by(IncidentReport.created_at.desc())
    )


def get_incident_trace(db: Session, incident_id: int) -> tuple[list[AgentRun], list[ToolCall]]:
    agent_runs = list(
        db.scalars(select(AgentRun).where(AgentRun.incident_id == incident_id).order_by(AgentRun.started_at.asc()))
    )
    tool_calls = list(
        db.scalars(
            select(ToolCall)
            .join(AgentRun, AgentRun.id == ToolCall.agent_run_id)
            .where(AgentRun.incident_id == incident_id)
            .order_by(ToolCall.created_at.asc())
        )
    )
    return agent_runs, tool_calls
