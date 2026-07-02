from app.db.session import SessionLocal, engine
from app.models.types import Base
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
                    raw_content="SignatureMismatchError affecting paid users. release v1.42.0. file: payments/webhook.py. first seen 17 minutes after deploy.",
                    normalized_content="Sentry reported SignatureMismatchError after release v1.42.0. Stack trace points to payments/webhook.py and affected users experienced webhook validation failures.",
                    metadata_json={"release": "v1.42.0", "file": "payments/webhook.py", "first_seen_minutes": 17},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="github_pr",
                    title="PR #482 changed webhook validation",
                    raw_content="PR #482: Enforce strict webhook signature validation. Merged 17 minutes before incident. Changed payments/webhook.py and linked to release v1.42.0.",
                    normalized_content="PR #482 introduced strict webhook signature validation in payments/webhook.py and was merged shortly before the incident.",
                    metadata_json={"pr_number": 482, "release": "v1.42.0"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="prometheus_metric",
                    title="Payment service error rate spike",
                    raw_content="Error rate increased from 0.2% to 18.4%. p95 latency increased from 240ms to 1800ms. Payment completion rate dropped around deployment time.",
                    normalized_content="Prometheus showed a sharp spike in 5xx errors and latency after deployment.",
                    metadata_json={"error_rate_before": 0.2, "error_rate_after": 18.4},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="runbook",
                    title="Payment webhook failure runbook",
                    raw_content="Common causes: signature mismatch, upstream retry storm, strict validation regression. Recommended mitigation: disable payment_webhook_strict_mode or rollback release.",
                    normalized_content="Runbook recommends disabling the strict mode flag or rolling back release if signature mismatch appears after deploy.",
                    metadata_json={"feature_flag": "payment_webhook_strict_mode"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="previous_incident",
                    title="INC-104 similar signature mismatch regression",
                    raw_content="INC-104 similar SignatureMismatchError caused by strict validation regression. Resolved by disabling strict validation flag.",
                    normalized_content="Previous incident INC-104 points to a strict validation regression with the same remediation path.",
                    metadata_json={"incident_key": "INC-104"},
                    embedding_status="pending",
                    processing_status="uploaded",
                ),
                EvidenceItem(
                    incident_id=incident.id,
                    source_type="statuspage",
                    title="Payment provider status operational",
                    raw_content="Payment provider status operational. No third-party outage detected.",
                    normalized_content="Statuspage did not report a provider outage, lowering the likelihood of an external dependency issue.",
                    metadata_json={"status": "operational"},
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
