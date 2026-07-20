from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, SessionRead, SignupRequest, UserRead
from app.services.auth_service import (
    create_session,
    create_user,
    find_user_by_email,
    get_active_session,
    revoke_session,
    verify_password,
)


router = APIRouter(prefix="/api/auth", tags=["authentication"])


def _session_token(x_incidentlens_session: str | None = Header(default=None)) -> str:
    if not x_incidentlens_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session token required")
    return x_incidentlens_session


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if find_user_by_email(db, payload.email) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email")
    try:
        user = create_user(db, **payload.model_dump())
        token, session = create_session(db, user)
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account already exists for this email") from exc
    return AuthResponse(session_token=token, expires_at=session.expires_at, user=UserRead.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = find_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect")
    token, session = create_session(db, user)
    db.commit()
    return AuthResponse(session_token=token, expires_at=session.expires_at, user=UserRead.model_validate(user))


@router.get("/session", response_model=SessionRead)
def read_session(token: str = Depends(_session_token), db: Session = Depends(get_db)) -> SessionRead:
    session = get_active_session(db, token)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is invalid or expired")
    return SessionRead(expires_at=session.expires_at, user=UserRead.model_validate(session.user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(token: str = Depends(_session_token), db: Session = Depends(get_db)) -> None:
    revoke_session(db, token)
    db.commit()
