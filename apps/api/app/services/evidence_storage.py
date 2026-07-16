from __future__ import annotations

from pathlib import Path

from app.core.config import get_settings


API_ROOT = Path(__file__).resolve().parents[2]


def evidence_storage_root() -> Path:
    configured = Path(get_settings().evidence_storage_dir)
    if configured.is_absolute():
        return configured.resolve()
    return (API_ROOT / configured).resolve()


def resolve_evidence_storage_path(storage_path: str) -> Path:
    candidate = Path(storage_path)
    if candidate.is_absolute():
        raise ValueError("Evidence storage paths must be relative")
    resolved = (API_ROOT / candidate).resolve()
    root = evidence_storage_root()
    if resolved != root and root not in resolved.parents:
        raise ValueError("Evidence storage path escapes the configured storage directory")
    return resolved
