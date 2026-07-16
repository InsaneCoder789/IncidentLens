from __future__ import annotations

from sqlalchemy import Engine, text


MULTIMODAL_SOURCE_TYPES = (
    "dashboard_screenshot",
    "sentry_screenshot",
    "architecture_diagram",
    "pdf_runbook",
    "pdf_postmortem",
)


def ensure_multimodal_source_types(engine: Engine) -> None:
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as connection:
        for source_type in MULTIMODAL_SOURCE_TYPES:
            connection.execute(
                text(f"ALTER TYPE evidence_source_type ADD VALUE IF NOT EXISTS '{source_type}'")
            )
