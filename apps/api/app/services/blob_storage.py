from __future__ import annotations

from pathlib import Path
from urllib.parse import quote

import httpx

from app.core.config import get_settings


BLOB_API_URL = "https://blob.vercel-storage.com"


class BlobStorageError(RuntimeError):
    pass


def blob_storage_enabled() -> bool:
    return get_settings().blob_read_write_token is not None


def _headers(*, content_type: str | None = None) -> dict[str, str]:
    token = get_settings().blob_read_write_token
    if token is None:
        raise BlobStorageError("BLOB_READ_WRITE_TOKEN is not configured")
    headers = {"Authorization": f"Bearer {token.get_secret_value()}", "x-api-version": "7"}
    if content_type:
        headers["x-content-type"] = content_type
    return headers


def upload_file(path: Path, *, pathname: str, content_type: str) -> dict:
    url = f"{BLOB_API_URL}/{quote(pathname, safe='/')}"
    try:
        response = httpx.put(
            url,
            content=path.read_bytes(),
            headers={**_headers(content_type=content_type), "x-vercel-blob-access": "private", "x-add-random-suffix": "0"},
            timeout=120,
        )
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise BlobStorageError("Evidence could not be uploaded to durable storage") from exc


def download_file(url: str) -> bytes:
    try:
        response = httpx.get(url, headers=_headers(), timeout=120)
        response.raise_for_status()
        return response.content
    except httpx.HTTPError as exc:
        raise BlobStorageError("Evidence could not be read from durable storage") from exc


def delete_file(url: str) -> None:
    try:
        response = httpx.post(
            f"{BLOB_API_URL}/delete",
            json={"urls": [url]},
            headers={**_headers(), "content-type": "application/json"},
            timeout=30,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise BlobStorageError("Evidence could not be removed from durable storage") from exc
