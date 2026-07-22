from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.evidence import EvidenceItem
from app.models.incident import Incident


@dataclass(slots=True)
class IntegrationEvidenceRecord:
    source_type: str
    title: str
    content: str
    metadata_json: dict[str, Any]


@dataclass(slots=True)
class IntegrationHealthStatus:
    key: str
    label: str
    status: str
    detail: str
    source_types: list[str]


def _configuration() -> dict[str, tuple[str, bool, list[str]]]:
    settings = get_settings()
    return {
        "github": ("GitHub", bool(settings.github_repository), ["github_commit"]),
        "sentry": ("Sentry", bool(settings.sentry_auth_token and settings.sentry_organization and settings.sentry_project), ["sentry_issue"]),
        "prometheus": ("Prometheus", bool(settings.prometheus_url), ["prometheus_metric"]),
        "statuspage": ("Statuspage", bool(settings.statuspage_url), ["statuspage"]),
        "runbook": ("Runbook Search", Path(settings.runbook_directory).is_dir(), ["runbook"]),
    }


def list_integration_health() -> list[IntegrationHealthStatus]:
    settings = get_settings()
    return [
        IntegrationHealthStatus(
            key=key,
            label=label,
            status="configured" if configured else "configuration_required",
            detail=(
                "Repository configured; a token is optional for public repositories."
                if key == "github" and configured and not settings.github_token
                else "Credentials and endpoint are configured."
                if configured
                else "Configure this integration in the server environment."
            ),
            source_types=source_types,
        )
        for key, (label, configured, source_types) in _configuration().items()
    ]


def _github_records(incident: Incident) -> list[IntegrationEvidenceRecord]:
    settings = get_settings()
    if not settings.github_repository:
        raise RuntimeError("GITHUB_REPOSITORY is required")
    response = httpx.get(
        f"https://api.github.com/repos/{settings.github_repository}/commits",
        headers={"Accept": "application/vnd.github+json", **({"Authorization": f"Bearer {settings.github_token.get_secret_value()}"} if settings.github_token else {})},
        params={"per_page": 30},
        timeout=30,
    )
    response.raise_for_status()
    return [IntegrationEvidenceRecord(
        source_type="github_commit",
        title=f"Commit {item['sha'][:8]}: {item['commit']['message'].splitlines()[0]}",
        content=item["commit"]["message"],
        metadata_json={"sha": item["sha"], "url": item["html_url"], "author_date": item["commit"]["author"]["date"], "service": incident.affected_service},
    ) for item in response.json()]


def _sentry_records(incident: Incident) -> list[IntegrationEvidenceRecord]:
    settings = get_settings()
    if not settings.sentry_auth_token or not settings.sentry_organization or not settings.sentry_project:
        raise RuntimeError("Sentry credentials and project configuration are required")
    response = httpx.get(
        f"https://sentry.io/api/0/projects/{settings.sentry_organization}/{settings.sentry_project}/issues/",
        headers={"Authorization": f"Bearer {settings.sentry_auth_token.get_secret_value()}"},
        params={"query": f"is:unresolved {incident.affected_service}", "limit": 50},
        timeout=30,
    )
    response.raise_for_status()
    return [IntegrationEvidenceRecord(
        source_type="sentry_issue",
        title=item.get("title", "Sentry issue"),
        content=f"{item.get('culprit', '')}\n{item.get('metadata', {}).get('value', '')}".strip(),
        metadata_json={"issue_id": item.get("id"), "short_id": item.get("shortId"), "count": item.get("count"), "first_seen": item.get("firstSeen"), "last_seen": item.get("lastSeen"), "url": item.get("permalink"), "service": incident.affected_service},
    ) for item in response.json()]


def _prometheus_records(incident: Incident) -> list[IntegrationEvidenceRecord]:
    settings = get_settings()
    if not settings.prometheus_url:
        raise RuntimeError("PROMETHEUS_URL is required")
    query = f'sum(rate(http_requests_total{{service="{incident.affected_service}",status=~"5.."}}[5m]))'
    response = httpx.get(f"{settings.prometheus_url.rstrip('/')}/api/v1/query", params={"query": query}, timeout=30)
    response.raise_for_status()
    result = response.json().get("data", {}).get("result", [])
    return [IntegrationEvidenceRecord(source_type="prometheus_metric", title=f"5xx rate for {incident.affected_service}", content=str(item.get("value", [])), metadata_json={"query": query, "metric": item.get("metric", {}), "service": incident.affected_service}) for item in result]


def _statuspage_records(incident: Incident) -> list[IntegrationEvidenceRecord]:
    settings = get_settings()
    if not settings.statuspage_url:
        raise RuntimeError("STATUSPAGE_URL is required")
    response = httpx.get(settings.statuspage_url, timeout=30)
    response.raise_for_status()
    payload = response.json()
    return [IntegrationEvidenceRecord(source_type="statuspage", title="External service status", content=str(payload.get("status", payload)), metadata_json={"source_url": settings.statuspage_url, "service": incident.affected_service})]


def _runbook_records(incident: Incident) -> list[IntegrationEvidenceRecord]:
    root = Path(get_settings().runbook_directory).resolve()
    if not root.is_dir():
        raise RuntimeError("RUNBOOK_DIRECTORY does not exist")
    records = []
    for path in [*root.rglob("*.md"), *root.rglob("*.txt")]:
        content = path.read_text(encoding="utf-8", errors="replace").strip()
        if content:
            records.append(IntegrationEvidenceRecord(source_type="runbook", title=path.stem.replace("-", " ").title(), content=content, metadata_json={"path": str(path.relative_to(root)), "service": incident.affected_service}))
    return records


_LOADERS: dict[str, Callable[[Incident], list[IntegrationEvidenceRecord]]] = {
    "github": _github_records,
    "sentry": _sentry_records,
    "prometheus": _prometheus_records,
    "statuspage": _statuspage_records,
    "runbook": _runbook_records,
}


def import_integration_evidence(db: Session, incident_id: int, integration_key: str | None = None) -> dict[str, int]:
    incident = db.get(Incident, incident_id)
    if incident is None:
        raise ValueError("Incident not found")
    keys = [integration_key] if integration_key else list(_LOADERS)
    imported = updated = 0
    for key in keys:
        loader = _LOADERS.get(key)
        if loader is None:
            raise ValueError(f"Unknown integration: {key}")
        for record in loader(incident):
            existing = db.scalar(select(EvidenceItem).where(EvidenceItem.incident_id == incident_id, EvidenceItem.source_type == record.source_type, EvidenceItem.title == record.title))
            if existing is None:
                db.add(EvidenceItem(incident_id=incident_id, source_type=record.source_type, title=record.title, raw_content=record.content, normalized_content=record.content, metadata_json=record.metadata_json, embedding_status="pending", processing_status="uploaded"))
                imported += 1
            else:
                existing.raw_content = record.content
                existing.normalized_content = record.content
                existing.metadata_json = record.metadata_json
                db.add(existing)
                updated += 1
    db.commit()
    return {"imported": imported, "updated": updated}


_TOOL_SOURCE_TYPES = {
    "search_github_changes": ["github_pr", "github_commit"],
    "fetch_sentry_issue": ["sentry_issue"],
    "query_prometheus_snapshot": ["prometheus_metric"],
    "check_statuspage": ["statuspage"],
    "search_runbooks": ["runbook"],
    "search_previous_incidents": ["previous_incident"],
}


def run_tool_adapter(db: Session, incident_id: int, tool_name: str) -> list[dict[str, Any]]:
    source_types = _TOOL_SOURCE_TYPES.get(tool_name, [])
    items = list(db.scalars(select(EvidenceItem).where(EvidenceItem.incident_id == incident_id, EvidenceItem.source_type.in_(source_types))))
    return [{"title": item.title, "source_type": item.source_type, "metadata": item.metadata_json, "snippet": item.normalized_content or item.raw_content} for item in items]
