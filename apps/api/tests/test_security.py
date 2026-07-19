from fastapi.testclient import TestClient

from app.main import app


def test_protected_routes_require_bearer_token() -> None:
    with TestClient(app) as client:
        response = client.get("/api/incidents")
    assert response.status_code == 401
    assert response.json()["detail"] == "Bearer token required"


def test_protected_routes_reject_invalid_bearer_token() -> None:
    with TestClient(app) as client:
        response = client.get("/api/incidents", headers={"Authorization": "Bearer incorrect"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid bearer token"


def test_health_endpoint_remains_available_for_orchestrators() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health/live")
    assert response.status_code == 200
