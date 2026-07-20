import os

os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///./incidentlens-test.db")
os.environ.setdefault("API_TOKEN", "incidentlens-test-token-not-for-production")

import pytest

from app.db.session import engine
from app.models import evidence as _evidence_models  # noqa: F401,E402
from app.models import auth as _auth_models  # noqa: F401,E402
from app.models import incident as _incident_models  # noqa: F401,E402
from app.models import investigation as _investigation_models  # noqa: F401,E402
from app.models import operations as _operations_models  # noqa: F401,E402
from app.models import jobs as _job_models  # noqa: F401,E402
from app.models.incident import Incident
from app.models.types import Base
from app.db.session import SessionLocal
from app.services.model_router import LLMResult, ModelRouter
from app.rag.embeddings import EmbeddingProvider


@pytest.fixture(autouse=True)
def fake_model_transport(monkeypatch):
    def run_structured(self, *, db, prompt_file, task_name, content):
        prompt = self.load_prompt(db, prompt_file)
        outputs = {
            "Intake Agent": {
                "incident_type": "deployment_regression",
                "severity": "high",
                "affected_service": "payments-api",
                "investigation_plan": ["Review deployment and error evidence"],
                "required_tools": ["retriever"],
            },
            "Root Cause Agent": {
                "hypotheses": [
                    {"title": "Deployment regression", "confidence": 0.8, "supporting_evidence": [], "contradicting_evidence": [], "reasoning_summary": "Evidence aligns with a recent change."},
                    {"title": "External dependency failure", "confidence": 0.2, "supporting_evidence": [], "contradicting_evidence": [], "reasoning_summary": "No supporting dependency evidence is present."},
                ],
                "selected_root_cause": "Deployment regression",
                "missing_evidence": ["Deployment diff"],
            },
            "Remediation Agent": {
                "immediate_actions": ["Confirm current error rate"],
                "approval_gated_actions": ["Rollback the current release"],
                "rollback_or_hotfix_plan": ["Prepare a rollback"],
                "verification_checklist": ["Error rate returns to baseline"],
                "customer_facing_update": "We are investigating service degradation.",
                "follow_up_tickets": ["Add regression coverage"],
            },
            "Evaluation Agent": {
                "quality_score": 0.8,
                "citation_coverage": 0.8,
                "unsupported_claims": [],
                "unsafe_recommendations": [],
                "missing_evidence": ["Deployment diff"],
                "notes": "The report preserves approval gates.",
            },
        }
        return LLMResult(
            model_name="test-provider",
            prompt_version=f'{prompt["name"]}_{prompt["version"]}',
            content=outputs.get(task_name, {"status": "completed"}),
            token_input=10,
            token_output=5,
            estimated_cost_usd=0.0,
        )

    def embedding_init(self, model_name, dimension=384):
        self.model_name = model_name
        self.dimension = dimension
        self._model = object()

    monkeypatch.setattr(ModelRouter, "run_structured", run_structured)
    monkeypatch.setattr(EmbeddingProvider, "__init__", embedding_init)
    monkeypatch.setattr(
        EmbeddingProvider,
        "embed_batch",
        lambda self, texts: [[1.0, *([0.0] * (self.dimension - 1))] for _ in texts],
    )
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.add(Incident(
        title="Test payment service degradation",
        description="Integration-test incident used to verify authenticated evidence and investigation workflows.",
        severity="high",
        status="investigating",
        affected_service="payments-api",
        incident_type="deployment_regression",
        owner="test-operator",
    ))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
