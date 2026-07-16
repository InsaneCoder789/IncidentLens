from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.evidence import EvidenceChunk, EvidenceItem
from app.rag.chunker import chunk_evidence, citation_id_for_position
from app.rag.embeddings import get_embedding_provider
from app.services.evidence_normalizer import normalize_evidence_content
from app.services.evidence_storage import resolve_evidence_storage_path
from app.services.multimodal_extraction_service import MultimodalExtractionService


@dataclass(slots=True)
class EvidenceProcessResult:
    evidence_id: int
    status: str
    chunks_created: int
    embedding_status: str


@dataclass(slots=True)
class ProcessAllResult:
    incident_id: int
    processed: int
    failed: int
    chunks_created: int


def _renumber_incident_citations(db: Session, incident_id: int) -> None:
    chunks = list(
        db.scalars(
            select(EvidenceChunk)
            .where(EvidenceChunk.incident_id == incident_id)
            .order_by(EvidenceChunk.evidence_item_id.asc(), EvidenceChunk.chunk_index.asc(), EvidenceChunk.id.asc())
        )
    )
    for index, chunk in enumerate(chunks, start=1):
        chunk.citation_id = citation_id_for_position(index)
        db.add(chunk)


def process_evidence_item(db: Session, evidence_item: EvidenceItem) -> EvidenceProcessResult:
    provider = get_embedding_provider()

    try:
        metadata = dict(evidence_item.metadata_json or {})
        storage_path = metadata.get("storage_path")
        if storage_path and metadata.get("extraction_status") != "completed":
            metadata["extraction_status"] = "processing"
            evidence_item.metadata_json = dict(metadata)
            db.add(evidence_item)
            db.flush()

            absolute_path = resolve_evidence_storage_path(str(storage_path))
            extraction = MultimodalExtractionService().extract(
                path=absolute_path,
                mime_type=str(metadata.get("mime_type", "application/octet-stream")),
                description=evidence_item.raw_content,
            )
            metadata.update(extraction.metadata)
            metadata.update(
                {
                    "extraction_status": "completed",
                    "extraction_summary": extraction.summary,
                    "detected_type": extraction.detected_type,
                    "extraction_confidence": extraction.confidence,
                    "extraction_warnings": extraction.warnings,
                }
            )
            evidence_item.raw_content = extraction.extracted_text
            evidence_item.metadata_json = dict(metadata)

        evidence_item.processing_status = "normalized"
        evidence_item.embedding_status = "processing"
        evidence_item.normalized_content = normalize_evidence_content(evidence_item)
        db.add(evidence_item)
        db.flush()

        db.execute(delete(EvidenceChunk).where(EvidenceChunk.evidence_item_id == evidence_item.id))

        drafts = chunk_evidence(evidence_item=evidence_item, normalized_content=evidence_item.normalized_content or "")
        evidence_item.processing_status = "chunked"
        db.add(evidence_item)
        db.flush()

        embeddings = provider.embed_batch([draft.content for draft in drafts]) if drafts else []
        created = 0
        for draft, embedding in zip(drafts, embeddings, strict=False):
            chunk = EvidenceChunk(
                evidence_item_id=evidence_item.id,
                incident_id=evidence_item.incident_id,
                chunk_index=draft.chunk_index,
                citation_id=f"TEMP-{evidence_item.id}-{draft.chunk_index}",
                content=draft.content,
                embedding=embedding,
                token_count=draft.token_count,
                metadata_json=draft.metadata_json,
            )
            db.add(chunk)
            created += 1

        evidence_item.processing_status = "embedded"
        evidence_item.embedding_status = "completed"
        db.add(evidence_item)
        db.flush()
        _renumber_incident_citations(db, evidence_item.incident_id)
        db.commit()
        db.refresh(evidence_item)

        return EvidenceProcessResult(
            evidence_id=evidence_item.id,
            status="completed",
            chunks_created=created,
            embedding_status=evidence_item.embedding_status,
        )
    except Exception as exc:
        db.rollback()
        metadata = dict(evidence_item.metadata_json or {})
        metadata["extraction_status"] = "failed"
        metadata["extraction_error"] = str(exc)
        evidence_item.metadata_json = dict(metadata)
        evidence_item.processing_status = "failed"
        evidence_item.embedding_status = "failed"
        db.add(evidence_item)
        db.commit()
        db.refresh(evidence_item)
        raise


def process_all_evidence_for_incident(db: Session, incident_id: int) -> ProcessAllResult:
    evidence_items = list(
        db.scalars(
            select(EvidenceItem)
            .where(EvidenceItem.incident_id == incident_id)
            .order_by(EvidenceItem.created_at.asc(), EvidenceItem.id.asc())
        )
    )

    processed = 0
    failed = 0
    chunk_total = 0
    for evidence_item in evidence_items:
        try:
            result = process_evidence_item(db, evidence_item)
            processed += 1
            chunk_total += result.chunks_created
        except Exception:
            failed += 1

    return ProcessAllResult(
        incident_id=incident_id,
        processed=processed,
        failed=failed,
        chunks_created=chunk_total,
    )
