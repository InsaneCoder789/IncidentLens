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
            f"{state.title} {state.affected_service or ''}",
            state.description,
            f"recent changes and deployments for {state.affected_service or state.title}",
            f"errors latency saturation and availability for {state.affected_service or state.title}",
            f"runbooks and previous incidents related to {state.incident_type or 'unknown incident'}",
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
        state.missing_evidence = []
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Collected {len(state.evidence_bundle)} evidence bundle items and noted {len(state.missing_evidence)} missing evidence gaps."
