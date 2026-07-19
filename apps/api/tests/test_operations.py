from fastapi.testclient import TestClient

from app.main import app


AUTH = {"Authorization": "Bearer incidentlens-test-token-not-for-production"}


def test_dashboard_uses_persisted_incidents() -> None:
    with TestClient(app, headers=AUTH) as client:
        response = client.get("/api/dashboard")
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["incidents"]
    assert {metric["label"] for metric in payload["metrics"]} == {
        "Active incidents",
        "Critical",
        "Pending approvals",
        "Mean confidence",
    }


def test_approval_lifecycle_is_persisted_and_versioned() -> None:
    with TestClient(app, headers=AUTH) as client:
        incident_id = client.get("/api/incidents").json()[0]["id"]
        created = client.post(
            f"/api/incidents/{incident_id}/approvals",
            json={"action": "Rollback the currently deployed release", "rationale": "Error rate remains above the safety threshold"},
        )
        assert created.status_code == 201, created.text
        approval = created.json()
        decision = client.patch(
            f"/api/approvals/{approval['id']}",
            json={"decision": "approved", "decision_note": "Release manager approved", "expected_version": 1},
        )
        assert decision.status_code == 200, decision.text
        assert decision.json()["status"] == "approved"
        stale = client.patch(
            f"/api/approvals/{approval['id']}",
            json={"decision": "rejected", "decision_note": "stale", "expected_version": 1},
        )
        assert stale.status_code == 409


def test_runtime_settings_are_persisted() -> None:
    with TestClient(app, headers=AUTH) as client:
        updated = client.patch(
            "/api/settings",
            json={"generation_temperature": 0.35, "monthly_cost_limit_usd": 750},
        )
        assert updated.status_code == 200, updated.text
        current = client.get("/api/settings")
    assert current.status_code == 200
    assert current.json()["generation_temperature"] == 0.35
    assert current.json()["monthly_cost_limit_usd"] == 750
