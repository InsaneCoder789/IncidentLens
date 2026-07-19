from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.models.types import Base


class EvidenceItem(Base):
    __tablename__ = "evidence_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    source_type: Mapped[str] = mapped_column(
        Enum(
            "log",
            "runbook",
            "postmortem",
            "github_pr",
            "github_commit",
            "sentry_issue",
            "prometheus_metric",
            "statuspage",
            "screenshot",
            "dashboard_screenshot",
            "sentry_screenshot",
            "architecture_diagram",
            "pdf_runbook",
            "pdf_postmortem",
            "slack_note",
            "voice_note",
            "previous_incident",
            name="evidence_source_type",
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)
    embedding_status: Mapped[str] = mapped_column(
        Enum("pending", "processing", "completed", "failed", name="embedding_status"),
        nullable=False,
        default="pending",
    )
    processing_status: Mapped[str] = mapped_column(
        Enum("uploaded", "normalized", "chunked", "embedded", "failed", name="processing_status"),
        nullable=False,
        default="uploaded",
    )

    incident = relationship("Incident", back_populates="evidence_items")
    chunks = relationship("EvidenceChunk", back_populates="evidence_item", cascade="all, delete-orphan")


class EvidenceChunk(Base):
    __tablename__ = "evidence_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    evidence_item_id: Mapped[int] = mapped_column(ForeignKey("evidence_items.id", ondelete="CASCADE"), nullable=False)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    citation_id: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(384).with_variant(JSON(), "sqlite"), nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False)

    evidence_item = relationship("EvidenceItem", back_populates="chunks")
