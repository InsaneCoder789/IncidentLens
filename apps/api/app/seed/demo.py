from app.db.session import SessionLocal, engine
from app.models.types import Base
from app.models import investigation as _investigation_models  # noqa: F401
from app.models.incident import Incident
from app.models.evidence import EvidenceItem


def seed_demo() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        incident = db.query(Incident).filter(Incident.title == "Payment API failures after webhook deployment").one_or_none()
        if incident is None:
            incident = Incident(
                title="Payment API failures after webhook deployment",
                description="Payment success rate dropped after the latest webhook validation deployment. Sentry is reporting SignatureMismatchError and Prometheus shows a sharp increase in 5xx errors.",
                severity="high",
                status="investigating",
                affected_service="payments-api",
                incident_type="deployment_regression",
                latest_confidence_score=0.86,
                owner="payments-oncall",
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)

        if not incident.evidence_items:
            demo_evidence = [
                EvidenceItem(
                    incident_id=incident.id,
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
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
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
                        "PR #482 introduced strict webhook signature validation in payments/webhook.py, merged 17 minutes before the incident, "
                        "and shipped in release v1.42.0."
                    ),
                    metadata_json={"pr_number": 482, "release": "v1.42.0", "service": "payments-api", "file": "payments/webhook.py"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
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
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="runbook",
                    title="Payment webhook failure runbook",
                    raw_content=(
                        "Payment webhook failure runbook.\n"
                        "Signature mismatch section: inspect SignatureMismatchError and digest normalization changes.\n"
                        "Feature flag: payment_webhook_strict_mode\n"
                        "Recommended mitigation: disable strict mode or rollback the release."
                    ),
                    normalized_content=(
                        "Runbook recommends disabling payment_webhook_strict_mode first or rolling back the release if SignatureMismatchError appears after deploy."
                    ),
                    metadata_json={"feature_flag": "payment_webhook_strict_mode", "service": "payments-api"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="previous_incident",
                    title="INC-104 similar signature mismatch regression",
                    raw_content=(
                        "INC-104 involved similar SignatureMismatchError after enabling strict validation.\n"
                        "Root cause: strict validation regression.\n"
                        "Resolution: disabled strict validation flag and patched payload canonicalization."
                    ),
                    normalized_content=(
                        "Previous incident INC-104 points to a strict validation regression resolved by disabling the strict validation flag."
                    ),
                    metadata_json={"incident_key": "INC-104", "service": "payments-api"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="statuspage",
                    title="Payment provider status operational",
                    raw_content=(
                        "Payment provider operational during incident window.\n"
                        "No active third-party outage.\n"
                        "This reduces the likelihood of external provider failure."
                    ),
                    normalized_content=(
                        "Statuspage reported the payment provider as operational with no active third-party outage, reducing the likelihood of an external dependency issue."
                    ),
                    metadata_json={"status": "operational", "provider": "Acme Payments", "service": "payments-api"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
            ]
            db.add_all(demo_evidence)
            db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo()
