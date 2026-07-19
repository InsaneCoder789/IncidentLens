"""structured reports

Revision ID: 0004_structured_reports
Revises: 0003_operational_control_plane
Create Date: 2026-07-20
"""

from alembic import op
import sqlalchemy as sa


revision = "0004_structured_reports"
down_revision = "0003_operational_control_plane"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incident_reports", sa.Column("analysis_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")))
    op.alter_column("incident_reports", "analysis_json", server_default=None)


def downgrade() -> None:
    op.drop_column("incident_reports", "analysis_json")
