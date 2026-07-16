from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from app.services.extractors.dashboard_classifier import DashboardScreenshotClassifier


class ImageExtractionProvider(ABC):
    @abstractmethod
    def extract(self, *, path: Path, description: str = "") -> tuple[str, str, float, list[str]]:
        raise NotImplementedError


class MockImageExtractionProvider(ImageExtractionProvider):
    def extract(self, *, path: Path, description: str = "") -> tuple[str, str, float, list[str]]:
        haystack = f"{path.name} {description}".lower()
        if "architecture" in haystack or "diagram" in haystack:
            text = (
                "Architecture diagram appears to show the payments-api receiving webhook traffic, "
                "validating signatures, and forwarding accepted events to payment processing. "
                "The strict validation gate is a likely investigation checkpoint."
            )
            return text, "Architecture diagram converted into searchable service-flow evidence.", 0.8, []
        if "sentry" in haystack or "signature" in haystack:
            text = (
                "Sentry screenshot shows SignatureMismatchError in payments/webhook.py for release v1.42.0, "
                "matching the payment webhook validation failure path."
            )
            return text, "Sentry error screenshot linked to the webhook validation regression.", 0.91, []
        if any(token in haystack for token in ("grafana", "prometheus", "payment", "latency", "error")):
            text = (
                "Grafana dashboard shows payments-api error rate rising sharply after release v1.42.0. "
                "The 5xx panel indicates an increase from baseline to roughly 18%. "
                "p95 latency also rises during the same time window."
            )
            return text, "Dashboard indicates a payment-service error and latency spike after deployment.", 0.88, []
        text = (
            "Image evidence was ingested successfully. No incident-specific visual pattern was identified "
            "from the filename or supplied description."
        )
        return text, "Image captured as searchable evidence with limited deterministic interpretation.", 0.55, [
            "Mock extraction uses filename and description signals; visual pixels were not analyzed."
        ]


class ImageEvidenceExtractor:
    def __init__(self, provider: ImageExtractionProvider | None = None) -> None:
        self.provider = provider or MockImageExtractionProvider()
        self.classifier = DashboardScreenshotClassifier()

    def extract(self, *, path: Path, description: str = "") -> dict:
        text, summary, confidence, warnings = self.provider.extract(path=path, description=description)
        classification = self.classifier.classify(
            filename=path.name,
            extracted_text=text,
            description=description,
        )
        lowered = f"{path.name} {description}".lower()
        detected_type = (
            "architecture_diagram"
            if "architecture" in lowered or "diagram" in lowered
            else "sentry_screenshot"
            if "sentry" in lowered
            else "dashboard_screenshot"
        )
        return {
            "extracted_text": text,
            "summary": summary,
            "detected_type": detected_type,
            "confidence": confidence,
            "metadata": {
                "provider": self.provider.__class__.__name__,
                "dashboard_classification": classification.model_dump(),
            },
            "warnings": warnings,
        }
