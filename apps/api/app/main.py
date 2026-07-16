from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.evidence import router as evidence_router
from app.api.routes.evals import router as evals_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.integrations import router as integrations_router
from app.api.routes.llmops import router as llmops_router
from app.api.routes.retrieval import router as retrieval_router
from app.core.logging import configure_logging
from app.db.session import engine
from app.db.schema_compat import ensure_multimodal_source_types
from app.models import investigation as _investigation_models  # noqa: F401
from app.models import incident as _incident_models  # noqa: F401
from app.models import evidence as _evidence_models  # noqa: F401
from app.models.types import Base
from app.seed.demo import seed_demo

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_multimodal_source_types(engine)
    Base.metadata.create_all(bind=engine)
    seed_demo()
    yield

app = FastAPI(title="IncidentLens AI API", version="0.1.0", lifespan=lifespan)
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
app.include_router(evals_router)
app.include_router(integrations_router)
app.include_router(llmops_router)
app.include_router(retrieval_router)


@app.get("/")
def root() -> dict:
    return {"name": "IncidentLens AI API", "status": "running"}
