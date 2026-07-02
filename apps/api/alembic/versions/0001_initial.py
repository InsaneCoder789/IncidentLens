"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-07-02
"""

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity", sa.Enum("low", "medium", "high", "critical", name="severity_level"), nullable=False),
        sa.Column("status", sa.Enum("open", "investigating", "mitigated", "resolved", "postmortem_ready", name="incident_status"), nullable=False),
        sa.Column("affected_service", sa.String(length=255), nullable=False),
        sa.Column("incident_type", sa.Enum("deployment_regression", "database_issue", "auth_failure", "third_party_outage", "infra_issue", "performance_degradation", "security_suspicious", "frontend_bug", "unknown", name="incident_type"), nullable=False),
        sa.Column("latest_confidence_score", sa.Float(), nullable=True),
        sa.Column("owner", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "evidence_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("incident_id", sa.Integer(), sa.ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_type", sa.Enum("log", "runbook", "postmortem", "github_pr", "github_commit", "sentry_issue", "prometheus_metric", "statuspage", "screenshot", "slack_note", "voice_note", "previous_incident", name="evidence_source_type"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("normalized_content", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("embedding_status", sa.Enum("pending", "processing", "completed", "failed", name="embedding_status"), nullable=False),
        sa.Column("processing_status", sa.Enum("uploaded", "normalized", "chunked", "embedded", "failed", name="processing_status"), nullable=False),
    )
    op.create_table(
        "evidence_chunks",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("evidence_item_id", sa.Integer(), sa.ForeignKey("evidence_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("incident_id", sa.Integer(), sa.ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("citation_id", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("evidence_chunks")
    op.drop_table("evidence_items")
    op.drop_table("incidents")

