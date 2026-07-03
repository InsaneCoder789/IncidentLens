from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.evidence import router as evidence_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.retrieval import router as retrieval_router
from app.core.logging import configure_logging
from app.db.session import engine
from app.models import investigation as _investigation_models  # noqa: F401
from app.models import incident as _incident_models  # noqa: F401
from app.models import evidence as _evidence_models  # noqa: F401
from app.models.types import Base
from app.seed.demo import seed_demo

configure_logging()

app = FastAPI(title="IncidentLens AI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(incidents_router)
app.include_router(evidence_router)
app.include_router(retrieval_router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_demo()


@app.get("/")
def root() -> dict:
    return {"name": "IncidentLens AI API", "status": "running"}
