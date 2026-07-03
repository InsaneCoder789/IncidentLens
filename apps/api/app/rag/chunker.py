from __future__ import annotations

from dataclasses import dataclass

from app.models.evidence import EvidenceItem


@dataclass(slots=True)
class ChunkDraft:
    chunk_index: int
    content: str
    token_count: int
    metadata_json: dict


def _estimate_tokens(text: str) -> int:
    return max(1, round(len(text) / 4))


def chunk_evidence(
    *,
    evidence_item: EvidenceItem,
    normalized_content: str,
    chunk_size: int = 900,
    overlap: int = 120,
) -> list[ChunkDraft]:
    text = normalized_content.strip()
    if not text:
        return []

    drafts: list[ChunkDraft] = []
    start = 0
    index = 0
    metadata = {
        **(evidence_item.metadata_json or {}),
        "incident_id": evidence_item.incident_id,
        "evidence_item_id": evidence_item.id,
        "source_type": evidence_item.source_type,
        "title": evidence_item.title,
    }

    while start < len(text):
        end = min(len(text), start + chunk_size)
        if end < len(text):
            paragraph_break = text.rfind("\n\n", start, end)
            sentence_break = text.rfind(". ", start, end)
            best_break = max(paragraph_break, sentence_break)
            if best_break > start + 250:
                end = best_break + (0 if best_break == paragraph_break else 1)

        chunk_text = text[start:end].strip()
        if chunk_text:
            drafts.append(
                ChunkDraft(
                    chunk_index=index,
                    content=chunk_text,
                    token_count=_estimate_tokens(chunk_text),
                    metadata_json=metadata,
                )
            )
            index += 1

        if end >= len(text):
            break
        start = max(0, end - overlap)

    return drafts


def citation_id_for_position(position: int) -> str:
    return f"EVID-{position:03d}"

