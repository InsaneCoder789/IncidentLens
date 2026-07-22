from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile

from app.core.config import get_settings
from app.services.blob_storage import blob_storage_enabled, delete_file, download_file, upload_file


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


@contextmanager
def materialize_evidence_file(metadata: dict) -> Iterator[Path]:
    storage_url = metadata.get("storage_url")
    if not storage_url:
        yield resolve_evidence_storage_path(str(metadata["storage_path"]))
        return

    suffix = Path(str(metadata.get("filename", "evidence"))).suffix
    with NamedTemporaryFile(prefix="incidentlens-evidence-", suffix=suffix) as temporary:
        temporary.write(download_file(str(storage_url)))
        temporary.flush()
        yield Path(temporary.name)


def persist_evidence_file(path: Path, *, pathname: str, content_type: str) -> dict | None:
    if not blob_storage_enabled():
        return None
    return upload_file(path, pathname=pathname, content_type=content_type)


def remove_persisted_evidence(metadata: dict) -> None:
    if metadata.get("storage_url"):
        delete_file(str(metadata["storage_url"]))
