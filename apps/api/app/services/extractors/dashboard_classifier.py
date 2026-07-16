from __future__ import annotations

from pydantic import BaseModel, Field


class DashboardClassification(BaseModel):
    classification: str
    confidence: float
    signals: list[str] = Field(default_factory=list)


class DashboardScreenshotClassifier:
    classifications = {
        "healthy",
        "degraded",
        "outage",
        "latency_spike",
        "error_spike",
        "resource_saturation",
        "unknown",
    }

    def classify(self, *, filename: str, extracted_text: str = "", description: str = "") -> DashboardClassification:
        haystack = f"{filename} {extracted_text} {description}".lower()
        rules = [
            ("outage", ("outage", "down", "unavailable"), 0.88),
            ("error_spike", ("error", "5xx", "sentry", "signaturemismatch"), 0.86),
            ("latency_spike", ("latency", "p95", "p99", "slow"), 0.83),
            ("resource_saturation", ("cpu", "memory", "saturation", "disk"), 0.81),
            ("degraded", ("degraded", "warning", "partial"), 0.76),
            ("healthy", ("healthy", "normal", "operational"), 0.74),
        ]
        for classification, keywords, confidence in rules:
            matched = [keyword for keyword in keywords if keyword in haystack]
            if matched:
                signals = [f"{keyword} indicator detected" for keyword in matched[:3]]
                if "payment" in haystack:
                    signals.append("payment service visible")
                if "red" in haystack or classification in {"outage", "error_spike"}:
                    signals.append("critical chart region inferred")
                return DashboardClassification(
                    classification=classification,
                    confidence=confidence,
                    signals=signals,
                )
        return DashboardClassification(
            classification="unknown",
            confidence=0.35,
            signals=["no deterministic dashboard pattern matched"],
        )
