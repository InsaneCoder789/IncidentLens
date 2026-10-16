"""Represent unmeasured evaluation metrics as NULL, not fabricated zero."""
from alembic import op
import sqlalchemy as sa

revision = "0007_nullable_eval_metrics"
down_revision = "0006_user_sessions"
branch_labels = None
depends_on = None
FIELDS = ("citation_coverage", "unsupported_claim_rate", "unsafe_action_rate", "avg_latency_ms", "avg_cost_usd")


def upgrade() -> None:
    with op.batch_alter_table("eval_runs") as batch:
        for field in FIELDS:
            batch.alter_column(field, existing_type=sa.Float(), nullable=True)


def downgrade() -> None:
    missing = " OR ".join(f"{field} IS NULL" for field in FIELDS)
    if op.get_bind().execute(sa.text(f"SELECT 1 FROM eval_runs WHERE {missing} LIMIT 1")).first():
        raise RuntimeError("Cannot downgrade unknown evaluation measurements without fabricating data")
    with op.batch_alter_table("eval_runs") as batch:
        for field in FIELDS:
            batch.alter_column(field, existing_type=sa.Float(), nullable=False)
