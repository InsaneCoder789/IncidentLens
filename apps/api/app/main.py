from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.evidence import router as evidence_router
from app.api.routes.evals import router as evals_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.integrations import router as integrations_router
from app.api.routes.llmops import router as llmops_router
from app.api.routes.operations import router as operations_router
from app.api.routes.retrieval import router as retrieval_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.security import require_api_token

configure_logging()


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield

settings = get_settings()
app = FastAPI(title="IncidentLens AI API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
protected = [Depends(require_api_token)]
app.include_router(incidents_router, dependencies=protected)
app.include_router(evidence_router, dependencies=protected)
app.include_router(evals_router, dependencies=protected)
app.include_router(integrations_router, dependencies=protected)
app.include_router(llmops_router, dependencies=protected)
app.include_router(retrieval_router, dependencies=protected)
app.include_router(operations_router, dependencies=protected)


@app.get("/")
def root() -> dict:
    return {"name": "IncidentLens AI API", "status": "running"}
