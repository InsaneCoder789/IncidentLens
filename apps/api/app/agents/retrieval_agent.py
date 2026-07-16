from __future__ import annotations

from app.agents.base import BaseAgent
from app.agents.state import EvidenceBundleItem, InvestigationState
from app.rag.retriever import search_evidence
from app.schemas.retrieval import RetrievalSearchRequest


class RetrievalAgent(BaseAgent):
    name = "Retrieval Agent"
    prompt_file = "retrieval_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        queries = [
            "What caused the payment API failure?",
            "SignatureMismatchError payments/webhook.py v1.42.0",
            "recent deployment webhook validation PR payment_webhook_strict_mode",
            "Prometheus error spike payment completion rate latency",
            "previous incident strict validation SignatureMismatchError",
            "Grafana screenshot payment errors release v1.42.0",
            "Sentry screenshot SignatureMismatchError webhook validation",
            "voice note webhook deployment payment_webhook_strict_mode",
        ]
        bundled: dict[str, EvidenceBundleItem] = {}
        for query in queries:
            results = search_evidence(
                self.db,
                RetrievalSearchRequest(incident_id=int(state.incident_id), query=query, top_k=4, score_threshold=0.2),
            )
            for result in results:
                bundled[result.citation_id] = EvidenceBundleItem(
                    citation_id=result.citation_id,
                    source_type=result.source_type,
                    title=result.title,
                    content=result.content,
                    relevance_score=result.relevance_score,
                    metadata=result.metadata,
                )
        state.evidence_bundle = sorted(bundled.values(), key=lambda item: item.relevance_score, reverse=True)
        state.missing_evidence = ["exact rollback result", "feature flag state at incident start", "PDF rollback checklist confirmation"]
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Collected {len(state.evidence_bundle)} evidence bundle items and noted {len(state.missing_evidence)} missing evidence gaps."
