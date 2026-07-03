from __future__ import annotations

import math
import re
from collections.abc import Iterable

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceChunk, EvidenceItem
from app.rag.embeddings import EmbeddingProvider, get_embedding_provider
from app.schemas.retrieval import RetrievalResultRead, RetrievalSearchRequest


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right, strict=False))
    left_norm = math.sqrt(sum(a * a for a in left)) or 1.0
    right_norm = math.sqrt(sum(b * b for b in right)) or 1.0
    return dot / (left_norm * right_norm)


def _keyword_score(query: str, content: str, title: str) -> float:
    tokens = [token for token in re.split(r"[^a-zA-Z0-9_.#-]+", query.lower()) if token]
    if not tokens:
        return 0.0
    haystack = f"{title} {content}".lower()
    matches = sum(1 for token in tokens if token in haystack)
    return matches / len(tokens)


def _metadata_matches(metadata: dict | None, filters: dict[str, str | int | float | bool] | None) -> bool:
    if not filters:
        return True
    metadata = metadata or {}
    for key, expected in filters.items():
        if str(metadata.get(key)) != str(expected):
            return False
    return True


def _base_query(request: RetrievalSearchRequest) -> Select[tuple[EvidenceChunk, EvidenceItem]]:
    stmt = (
        select(EvidenceChunk, EvidenceItem)
        .join(EvidenceItem, EvidenceItem.id == EvidenceChunk.evidence_item_id)
        .where(EvidenceChunk.incident_id == request.incident_id)
    )
    if request.source_types:
        stmt = stmt.where(EvidenceItem.source_type.in_(request.source_types))
    return stmt


def _result_from_row(chunk: EvidenceChunk, evidence_item: EvidenceItem, score: float) -> RetrievalResultRead:
    return RetrievalResultRead(
        citation_id=chunk.citation_id,
        source_type=evidence_item.source_type,
        title=evidence_item.title,
        content=chunk.content,
        relevance_score=round(score, 4),
        metadata=chunk.metadata_json,
    )


def _postgres_semantic_search(
    db: Session,
    provider: EmbeddingProvider,
    request: RetrievalSearchRequest,
) -> list[RetrievalResultRead]:
    if db.bind is None or db.bind.dialect.name != "postgresql":
        return []

    query_embedding = provider.embed_text(request.query)
    distance = EvidenceChunk.embedding.cosine_distance(query_embedding)  # type: ignore[attr-defined]
    stmt = (
        select(EvidenceChunk, EvidenceItem, (1 - distance).label("relevance_score"))
        .join(EvidenceItem, EvidenceItem.id == EvidenceChunk.evidence_item_id)
        .where(EvidenceChunk.incident_id == request.incident_id)
        .order_by(distance.asc())
        .limit(request.top_k)
    )
    if request.source_types:
        stmt = stmt.where(EvidenceItem.source_type.in_(request.source_types))

    results: list[RetrievalResultRead] = []
    for chunk, evidence_item, score in db.execute(stmt).all():
        if not _metadata_matches(chunk.metadata_json, request.metadata_filters):
            continue
        numeric_score = float(score)
        if numeric_score < request.score_threshold:
            continue
        results.append(_result_from_row(chunk, evidence_item, numeric_score))
    return results


def _python_semantic_search(
    rows: Iterable[tuple[EvidenceChunk, EvidenceItem]],
    provider: EmbeddingProvider,
    request: RetrievalSearchRequest,
) -> list[RetrievalResultRead]:
    query_embedding = provider.embed_text(request.query)
    scored: list[RetrievalResultRead] = []
    for chunk, evidence_item in rows:
        if not chunk.embedding or not _metadata_matches(chunk.metadata_json, request.metadata_filters):
            continue
        score = _cosine_similarity(query_embedding, list(chunk.embedding))
        if score >= request.score_threshold:
            scored.append(_result_from_row(chunk, evidence_item, score))
    return sorted(scored, key=lambda item: item.relevance_score, reverse=True)


def search_evidence(db: Session, request: RetrievalSearchRequest) -> list[RetrievalResultRead]:
    provider = get_embedding_provider()

    postgres_results = _postgres_semantic_search(db, provider, request)
    if len(postgres_results) >= request.top_k:
        return postgres_results[: request.top_k]

    rows = list(db.execute(_base_query(request)).all())
    semantic_results = postgres_results or _python_semantic_search(rows, provider, request)
    if len(semantic_results) >= request.top_k:
        return semantic_results[: request.top_k]

    seen_ids = {result.citation_id for result in semantic_results}
    keyword_results: list[RetrievalResultRead] = []
    for chunk, evidence_item in rows:
        if chunk.citation_id in seen_ids or not _metadata_matches(chunk.metadata_json, request.metadata_filters):
            continue
        score = _keyword_score(request.query, chunk.content, evidence_item.title)
        if score <= 0:
            continue
        keyword_results.append(_result_from_row(chunk, evidence_item, max(score, request.score_threshold)))

    combined = semantic_results + sorted(keyword_results, key=lambda item: item.relevance_score, reverse=True)
    filtered = [result for result in combined if result.relevance_score >= request.score_threshold]
    return filtered[: request.top_k]
