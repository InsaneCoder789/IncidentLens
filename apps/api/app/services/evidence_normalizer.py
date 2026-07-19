from __future__ import annotations

import json
import re

from app.models.evidence import EvidenceItem


def normalize_evidence_content(evidence_item: EvidenceItem) -> str:
    content = evidence_item.raw_content.strip()

    metadata_lines = []
    for key, value in sorted((evidence_item.metadata_json or {}).items()):
        rendered = json.dumps(value, ensure_ascii=True) if isinstance(value, (dict, list)) else str(value)
        metadata_lines.append(f"{key}: {rendered}")

    sections = [evidence_item.title.strip(), content]
    if metadata_lines:
        sections.append("Metadata:\n" + "\n".join(metadata_lines))

    normalized = "\n\n".join(section for section in sections if section)
    normalized = re.sub(r"[ \t]+", " ", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()
