from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.types import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(Enum("low", "medium", "high", "critical", name="severity_level"), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("open", "investigating", "mitigated", "resolved", "postmortem_ready", name="incident_status"),
        nullable=False,
        default="open",
    )
    affected_service: Mapped[str] = mapped_column(String(255), nullable=False)
    incident_type: Mapped[str] = mapped_column(
        Enum(
            "deployment_regression",
            "database_issue",
            "auth_failure",
            "third_party_outage",
            "infra_issue",
            "performance_degradation",
            "security_suspicious",
            "frontend_bug",
            "unknown",
            name="incident_type",
        ),
        nullable=False,
        default="unknown",
    )
    latest_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    owner: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    evidence_items = relationship("EvidenceItem", back_populates="incident", cascade="all, delete-orphan")
    reports = relationship("IncidentReport", back_populates="incident", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="incident", cascade="all, delete-orphan")
