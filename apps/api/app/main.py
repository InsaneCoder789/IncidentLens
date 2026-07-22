from contextlib import asynccontextmanager
import logging
from time import perf_counter
from uuid import uuid4

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.api.routes.evidence import router as evidence_router
from app.api.routes.cron import router as cron_router
from app.api.routes.auth import router as auth_router
from app.api.routes.evals import router as evals_router
from app.api.routes.health import router as health_router
from app.api.routes.incidents import router as incidents_router
from app.api.routes.integrations import router as integrations_router
from app.api.routes.llmops import router as llmops_router
from app.api.routes.operations import router as operations_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.retrieval import router as retrieval_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.security import require_api_token

configure_logging()
logger = logging.getLogger("incidentlens.requests")


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


class OperationalHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id") or str(uuid4())
        started_at = perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request_failed",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round((perf_counter() - started_at) * 1000, 2),
                },
            )
            raise
        response.headers["x-request-id"] = request_id
        response.headers["x-content-type-options"] = "nosniff"
        response.headers["x-frame-options"] = "DENY"
        response.headers["referrer-policy"] = "no-referrer"
        response.headers["permissions-policy"] = "camera=(), microphone=(), geolocation=()"
        logger.info(
            "request_completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round((perf_counter() - started_at) * 1000, 2),
            },
        )
        return response


app.add_middleware(OperationalHeadersMiddleware)

app.include_router(health_router)
app.include_router(cron_router)
protected = [Depends(require_api_token)]
app.include_router(incidents_router, dependencies=protected)
app.include_router(auth_router, dependencies=protected)
app.include_router(evidence_router, dependencies=protected)
app.include_router(evals_router, dependencies=protected)
app.include_router(integrations_router, dependencies=protected)
app.include_router(llmops_router, dependencies=protected)
app.include_router(retrieval_router, dependencies=protected)
app.include_router(operations_router, dependencies=protected)
app.include_router(jobs_router, dependencies=protected)


@app.get("/")
def root() -> dict:
    return {"name": "IncidentLens AI API", "status": "running"}
