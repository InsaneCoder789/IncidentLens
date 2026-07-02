from fastapi import Header, HTTPException


def require_demo_token(x_demo_token: str | None = Header(default=None)) -> None:
    if x_demo_token is None:
        return
    if x_demo_token != "incidentlens-demo":
        raise HTTPException(status_code=401, detail="Invalid demo token")

