import os

from fastapi.testclient import TestClient

from app.main import app


AUTH = {"Authorization": f"Bearer {os.environ['API_TOKEN']}"}


def test_signup_login_session_and_logout() -> None:
    with TestClient(app, headers=AUTH) as client:
        signup = client.post(
            "/api/auth/signup",
            json={
                "full_name": "Riya Operator",
                "email": "riya@example.com",
                "password": "safe-test-password",
                "team_name": "Payments Operations",
            },
        )
        assert signup.status_code == 201, signup.text
        token = signup.json()["session_token"]

        session = client.get("/api/auth/session", headers={**AUTH, "X-IncidentLens-Session": token})
        assert session.status_code == 200
        assert session.json()["user"]["team_name"] == "Payments Operations"

        login = client.post(
            "/api/auth/login",
            json={"email": "riya@example.com", "password": "safe-test-password"},
        )
        assert login.status_code == 200

        logout = client.post("/api/auth/logout", headers={**AUTH, "X-IncidentLens-Session": token})
        assert logout.status_code == 204
        assert client.get("/api/auth/session", headers={**AUTH, "X-IncidentLens-Session": token}).status_code == 401
