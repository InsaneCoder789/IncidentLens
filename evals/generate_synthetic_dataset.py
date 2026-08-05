"""Generate deterministic synthetic incident cases for RAG evaluation.

The output is intentionally JSONL rather than a single JSON array so large
datasets can be streamed, sampled, and regenerated without loading them all
into memory. Synthetic cases are evaluation and development data; they do not
train the underlying language model by themselves.
"""

from __future__ import annotations

import argparse
import gzip
import json
import random
from collections import Counter
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "incidentlens.synthetic.v1"

SCENARIOS: dict[str, dict[str, Any]] = {
    "deployment_regression": {
        "services": ["payments-api", "checkout-web", "auth-gateway", "catalog-api"],
        "causes": ["Webhook validation regression", "Feature flag misconfiguration", "Schema migration incompatibility", "Connection pool exhaustion"],
        "signals": ["error rate increased immediately after the release", "the previous version remains healthy", "rollback-safe traffic is available"],
    },
    "database_issue": {
        "services": ["orders-db", "payments-db", "ledger-db", "customer-db"],
        "causes": ["Lock contention on the orders table", "Replica lag crossed the read freshness threshold", "An index was removed during maintenance", "Connection pool saturation"],
        "signals": ["database wait time rose before API latency", "read replicas reported increasing lag", "the primary remained reachable"],
    },
    "auth_failure": {
        "services": ["auth-gateway", "identity-api", "session-service", "admin-console"],
        "causes": ["Expired signing key was deployed", "OAuth audience configuration drift", "Session cookie domain regression", "Rate-limit policy blocked trusted clients"],
        "signals": ["authentication failures are concentrated on one client flow", "healthy requests use the previous token path", "no credential stuffing pattern was observed"],
    },
    "third_party_outage": {
        "services": ["payments-api", "notifications-api", "fraud-service", "shipping-api"],
        "causes": ["Payment provider outage", "Third-party timeout budget was exceeded", "Vendor API contract changed", "External DNS resolution degraded"],
        "signals": ["failures correlate with the vendor endpoint", "internal dependencies remain within baseline", "retry volume increased after the external error"],
    },
    "infra_issue": {
        "services": ["kubernetes-cluster", "edge-router", "worker-pool", "object-storage"],
        "causes": ["Node resource pressure evicted workers", "Ingress configuration dropped websocket traffic", "A queue consumer deployment stalled", "Storage quota was exhausted"],
        "signals": ["resource saturation precedes application errors", "only one availability zone is affected", "recovery follows capacity restoration"],
    },
    "performance_degradation": {
        "services": ["search-api", "recommendations-api", "checkout-web", "reporting-api"],
        "causes": ["Unbounded query expanded response time", "Cache hit rate collapsed", "A new serialization path increased CPU use", "Concurrency increased beyond the service budget"],
        "signals": ["latency rises with request size", "the slow path is isolated to one endpoint", "successful responses remain semantically correct"],
    },
    "security_suspicious": {
        "services": ["auth-gateway", "payments-api", "admin-console", "audit-service"],
        "causes": ["A service account token was exposed", "Unexpected administrative access was observed", "A dependency introduced a suspicious callback", "Audit events were delayed by a queue failure"],
        "signals": ["the activity is limited to a small set of principals", "no confirmed data exfiltration is present", "audit evidence requires preservation"],
    },
    "frontend_bug": {
        "services": ["checkout-web", "merchant-console", "admin-console", "customer-portal"],
        "causes": ["A client bundle referenced a missing field", "Form validation rejected valid addresses", "A route transition lost pending state", "A browser-specific rendering regression shipped"],
        "signals": ["the API contract remains healthy", "failures are browser or route specific", "the issue began with the frontend release"],
    },
    "unknown": {
        "services": ["payments-api", "orders-api", "platform-api", "edge-router"],
        "causes": ["Insufficient evidence to establish a root cause", "Multiple correlated failures require isolation", "The primary signal has not been reproduced", "Evidence is contradictory"],
        "signals": ["available telemetry is incomplete", "no single hypothesis explains all symptoms", "additional evidence is required before action"],
    },
}

SOURCE_TYPES = ["log", "prometheus_metric", "github_commit", "runbook", "sentry_issue", "previous_incident"]


def _split(index: int) -> str:
    remainder = index % 10
    return "test" if remainder == 0 else "validation" if remainder == 1 else "train"


def _case(index: int, rng: random.Random) -> dict[str, Any]:
    incident_type = rng.choice(sorted(SCENARIOS))
    scenario = SCENARIOS[incident_type]
    service = rng.choice(scenario["services"])
    root_cause = rng.choice(scenario["causes"])
    severity = rng.choices(["low", "medium", "high", "critical"], weights=[12, 38, 38, 12], k=1)[0]
    signal = rng.choice(scenario["signals"])
    release = f"2026.{rng.randint(1, 12)}.{rng.randint(1, 28)}-{rng.randint(100, 999)}"
    query = rng.choice([
        f"What caused the {service} incident?",
        f"Why did {service} start failing after release {release}?",
        f"Which evidence explains the {service} degradation?",
    ])

    evidence = [
        {
            "citation_id": "EVID-001",
            "source_type": "log",
            "title": f"{service} error log around release {release}",
            "content": f"At 14:03 UTC, {service} began returning elevated errors. The change started after release {release}. Signal: {signal}. The leading explanation is {root_cause}.",
            "metadata": {"service": service, "release": release, "reliability": "high"},
        },
        {
            "citation_id": "EVID-002",
            "source_type": "prometheus_metric",
            "title": f"{service} operational metrics",
            "content": f"The five-minute error or latency series for {service} moved outside its baseline before the alert. The timing is consistent with {root_cause}, while unrelated services stayed within normal range.",
            "metadata": {"service": service, "window": "5m", "reliability": "high"},
        },
        {
            "citation_id": "EVID-003",
            "source_type": "github_commit",
            "title": f"Release {release} change summary",
            "content": f"Release {release} changed the {service} request path. Review notes mention a possible interaction with {root_cause}. No equivalent change appears in the prior healthy release.",
            "metadata": {"service": service, "release": release, "reliability": "medium"},
        },
        {
            "citation_id": "EVID-004",
            "source_type": "runbook",
            "title": f"{service} diagnostic runbook",
            "content": f"The runbook recommends checking dependency health, recent releases, and saturation before any rollback. It does not confirm that {root_cause} is present in this incident.",
            "metadata": {"service": service, "reliability": "medium"},
        },
        {
            "citation_id": "EVID-005",
            "source_type": rng.choice(["sentry_issue", "previous_incident"]),
            "title": f"Related signal for {service}",
            "content": f"A historical signal resembles part of the current symptom, but it predates release {release} and does not prove {root_cause}. Treat it as a competing lead only.",
            "metadata": {"service": service, "reliability": "low"},
        },
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "case_id": f"SYN-{index:06d}",
        "split": _split(index),
        "scenario_family": incident_type,
        "incident": {
            "title": f"{service} {incident_type.replace('_', ' ')} scenario {index:06d}",
            "description": f"Synthetic {severity}-severity incident affecting {service}. Operators observed that {signal}.",
            "severity": severity,
            "status": "resolved" if index % 7 == 0 else "investigating",
            "affected_service": service,
            "incident_type": incident_type,
        },
        "retrieval_query": query,
        "evidence": evidence,
        "expected_root_cause": root_cause,
        "expected_citations": ["EVID-001", "EVID-002", "EVID-003"],
        "expected_missing_evidence": ["Confirm the change with an independent deployment or dependency trace."],
        "expected_tools": ["search_github_changes", "query_prometheus_snapshot", "search_runbooks"],
        "safety_labels": {"requires_human_approval": True, "allowed_immediate_actions": ["collect evidence", "notify owner", "increase observation"]},
    }


def generate(count: int, output: Path, seed: int) -> dict[str, Any]:
    output.parent.mkdir(parents=True, exist_ok=True)
    scenario_counts: Counter[str] = Counter()
    split_counts: Counter[str] = Counter()
    rng = random.Random(seed)
    with gzip.open(output, "wt", encoding="utf-8", newline="\n") as stream:
        for index in range(1, count + 1):
            record = _case(index, rng)
            stream.write(json.dumps(record, separators=(",", ":"), sort_keys=True) + "\n")
            scenario_counts[record["scenario_family"]] += 1
            split_counts[record["split"]] += 1

    manifest = {
        "schema_version": SCHEMA_VERSION,
        "seed": seed,
        "record_count": count,
        "format": "jsonl.gz",
        "output": str(output),
        "splits": dict(split_counts),
        "scenario_families": dict(scenario_counts),
        "usage": "Synthetic evaluation and development data; not a substitute for real production incidents.",
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=100_000)
    parser.add_argument("--seed", type=int, default=20260806)
    parser.add_argument("--output", type=Path, default=Path("evals/generated/incident_cases.jsonl.gz"))
    args = parser.parse_args()
    if args.count < 1:
        parser.error("--count must be positive")
    print(json.dumps(generate(args.count, args.output, args.seed), indent=2))


if __name__ == "__main__":
    main()
