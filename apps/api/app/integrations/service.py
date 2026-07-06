from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceItem


@dataclass(slots=True)
class IntegrationEvidenceRecord:
    source_type: str
    title: str
    raw_content: str
    normalized_content: str
    metadata_json: dict[str, Any]


@dataclass(slots=True)
class IntegrationHealthStatus:
    key: str
    label: str
    status: str
    detail: str
    source_types: list[str]


_INTEGRATION_FIXTURES: dict[str, dict[str, Any]] = {
    "github": {
        "label": "GitHub",
        "status": "healthy",
        "detail": "Mock pull request and deployment metadata available.",
        "source_types": ["github_pr", "github_commit"],
        "records": [
            IntegrationEvidenceRecord(
                source_type="github_pr",
                title="PR #482 changed webhook validation",
                raw_content=(
                    "PR #482 title: Enforce strict webhook signature validation.\n"
                    "Merged 17 minutes before incident start.\n"
                    "Changed file: payments/webhook.py\n"
                    "Release: v1.42.0\n"
                    "Notes: introduced strict validation path and normalized digest comparison for webhook payloads."
                ),
                normalized_content=(
                    "PR #482 introduced strict webhook signature validation in payments/webhook.py, "
                    "merged 17 minutes before the incident, and shipped in release v1.42.0."
                ),
                metadata_json={"pr_number": 482, "release": "v1.42.0", "service": "payments-api", "file": "payments/webhook.py"},
            )
        ],
    },
    "sentry": {
        "label": "Sentry",
        "status": "healthy",
        "detail": "SignatureMismatchError trace bundle ready for import.",
        "source_types": ["sentry_issue"],
        "records": [
            IntegrationEvidenceRecord(
                source_type="sentry_issue",
                title="SignatureMismatchError in payments/webhook.py",
                raw_content=(
                    "Sentry issue: SignatureMismatchError affecting paid users after release v1.42.0.\n"
                    "Service: payments-api\n"
                    "File: payments/webhook.py\n"
                    "First seen timestamp: 2026-07-02T06:17:12Z\n"
                    "Affected users: 1240\n"
                    "Stack trace snippet:\n"
                    '  File "payments/webhook.py", line 184, in verify_signature\n'
                    "    raise SignatureMismatchError('digest mismatch for normalized payload')"
                ),
                normalized_content=(
                    "Sentry reported SignatureMismatchError after release v1.42.0 in payments/webhook.py. "
                    "The error first appeared at 2026-07-02T06:17:12Z and impacted 1240 paid users. "
                    "Stack trace points to verify_signature in the strict validation path."
                ),
                metadata_json={
                    "release": "v1.42.0",
                    "file": "payments/webhook.py",
                    "first_seen_timestamp": "2026-07-02T06:17:12Z",
                    "affected_users": 1240,
                    "service": "payments-api",
                },
            )
        ],
    },
    "prometheus": {
        "label": "Prometheus",
        "status": "healthy",
        "detail": "Latency and error-rate snapshot available for payments-api.",
        "source_types": ["prometheus_metric"],
        "records": [
            IntegrationEvidenceRecord(
                source_type="prometheus_metric",
                title="Payment service error rate spike",
                raw_content=(
                    "Prometheus metric report for payments-api.\n"
                    "Deployment timestamp: 2026-07-02T06:10:55Z\n"
                    "Error rate increased from 0.2% to 18.4%.\n"
                    "P95 latency increased from 240ms to 1800ms.\n"
                    "Payment completion rate dropped 37% within 10 minutes of deployment."
                ),
                normalized_content=(
                    "Prometheus showed error rate increasing from 0.2% to 18.4%, P95 latency rising from 240ms to 1800ms, "
                    "and payment completion dropping immediately after deployment."
                ),
                metadata_json={
                    "error_rate_before": 0.2,
                    "error_rate_after": 18.4,
                    "p95_before_ms": 240,
                    "p95_after_ms": 1800,
                    "deployment_timestamp": "2026-07-02T06:10:55Z",
                    "service": "payments-api",
                },
            )
        ],
    },
    "statuspage": {
        "label": "Statuspage",
        "status": "healthy",
        "detail": "Provider availability timeline reports operational status.",
        "source_types": ["statuspage"],
        "records": [
            IntegrationEvidenceRecord(
                source_type="statuspage",
                title="Payment provider status operational",
                raw_content=(
                    "Payment provider operational during incident window.\n"
                    "No active third-party outage.\n"
                    "This reduces the likelihood of external provider failure."
                ),
                normalized_content=(
                    "Statuspage reported the payment provider as operational with no active third-party outage, "
                    "reducing the likelihood of an external dependency issue."
                ),
                metadata_json={"status": "operational", "provider": "Acme Payments", "service": "payments-api"},
            )
        ],
    },
    "runbook": {
        "label": "Runbook Search",
        "status": "healthy",
        "detail": "Operational guidance and mitigation notes are indexed.",
        "source_types": ["runbook", "previous_incident"],
        "records": [
            IntegrationEvidenceRecord(
                source_type="runbook",
                title="Payment webhook failure runbook",
                raw_content=(
                    "Payment webhook failure runbook.\n"
                    "Signature mismatch section: inspect SignatureMismatchError and digest normalization changes.\n"
                    "Feature flag: payment_webhook_strict_mode\n"
                    "Recommended mitigation: disable strict mode or rollback the release."
                ),
                normalized_content=(
                    "Runbook recommends disabling payment_webhook_strict_mode first or rolling back the release "
                    "if SignatureMismatchError appears after deploy."
                ),
                metadata_json={"feature_flag": "payment_webhook_strict_mode", "service": "payments-api"},
            ),
            IntegrationEvidenceRecord(
                source_type="previous_incident",
                title="INC-104 similar signature mismatch regression",
                raw_content=(
                    "INC-104 involved similar SignatureMismatchError after enabling strict validation.\n"
                    "Root cause: strict validation regression.\n"
                    "Resolution: disabled strict validation flag and patched payload canonicalization."
                ),
                normalized_content=(
                    "Previous incident INC-104 points to a strict validation regression resolved "
                    "by disabling the strict validation flag."
                ),
                metadata_json={"incident_key": "INC-104", "service": "payments-api"},
            ),
        ],
    },
}

_TOOL_TO_INTEGRATION = {
    "search_github_changes": "github",
    "fetch_sentry_issue": "sentry",
    "query_prometheus_snapshot": "prometheus",
    "check_statuspage": "statuspage",
    "search_runbooks": "runbook",
    "search_previous_incidents": "runbook",
}


def list_integration_health() -> list[IntegrationHealthStatus]:
    return [
        IntegrationHealthStatus(
            key=key,
            label=value["label"],
            status=value["status"],
            detail=value["detail"],
            source_types=value["source_types"],
        )
        for key, value in _INTEGRATION_FIXTURES.items()
    ]


def import_integration_evidence(db: Session, incident_id: int, integration_key: str | None = None) -> dict[str, int]:
    keys = [integration_key] if integration_key else list(_INTEGRATION_FIXTURES.keys())
    imported = 0
    updated = 0

    for key in keys:
        fixture = _INTEGRATION_FIXTURES.get(key)
        if fixture is None:
            continue
        for record in fixture["records"]:
            existing = db.scalar(
                select(EvidenceItem).where(
                    EvidenceItem.incident_id == incident_id,
                    EvidenceItem.source_type == record.source_type,
                    EvidenceItem.title == record.title,
                )
            )
            if existing is None:
                db.add(
                    EvidenceItem(
                        incident_id=incident_id,
                        source_type=record.source_type,
                        title=record.title,
                        raw_content=record.raw_content,
                        normalized_content=record.normalized_content,
                        metadata_json=record.metadata_json,
                        embedding_status="pending",
                        processing_status="uploaded",
                    )
                )
                imported += 1
                continue

            existing.raw_content = record.raw_content
            existing.normalized_content = record.normalized_content
            existing.metadata_json = record.metadata_json
            updated += 1
            db.add(existing)

    db.commit()
    return {"imported": imported, "updated": updated}


def run_tool_adapter(db: Session, incident_id: int, tool_name: str) -> list[dict[str, Any]]:
    integration_key = _TOOL_TO_INTEGRATION.get(tool_name)
    if integration_key is None:
        return []

    fixture = _INTEGRATION_FIXTURES[integration_key]
    source_types = fixture["source_types"]
    items = list(
        db.scalars(
            select(EvidenceItem).where(
                EvidenceItem.incident_id == incident_id,
                EvidenceItem.source_type.in_(source_types),
            )
        )
    )
    return [
        {
            "title": item.title,
            "source_type": item.source_type,
            "metadata": item.metadata_json,
            "snippet": item.normalized_content or item.raw_content,
        }
        for item in items
    ]
