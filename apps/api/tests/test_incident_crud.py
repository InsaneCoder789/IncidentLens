import os

from fastapi.testclient import TestClient

from app.main import app


AUTH = {"Authorization": f"Bearer {os.environ['API_TOKEN']}"}


def test_incident_create_update_and_delete_round_trip() -> None:
    with TestClient(app, headers=AUTH) as client:
        created = client.post(
            "/api/incidents",
            json={
                "title": "Checkout latency above objective",
                "description": "Checkout requests require evidence-driven investigation.",
                "severity": "high",
                "status": "investigating",
                "affected_service": "checkout-api",
                "incident_type": "performance_degradation",
                "owner": "checkout-oncall",
            },
        )
        assert created.status_code == 201
        incident_id = created.json()["id"]
        assert created.json()["evidence_count"] == 0

        updated = client.patch(
            f"/api/incidents/{incident_id}",
            json={"status": "mitigated", "owner": "platform-oncall"},
        )
        assert updated.status_code == 200
        assert updated.json()["status"] == "mitigated"
        assert updated.json()["owner"] == "platform-oncall"

        deleted = client.delete(f"/api/incidents/{incident_id}")
        assert deleted.status_code == 204
        assert client.get(f"/api/incidents/{incident_id}").status_code == 404
