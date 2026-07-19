from __future__ import annotations

from abc import ABC, abstractmethod
import base64
import json
from pathlib import Path

import httpx

from app.core.config import get_settings
from app.services.extractors.dashboard_classifier import DashboardScreenshotClassifier


class ImageExtractionProvider(ABC):
    @abstractmethod
    def extract(self, *, path: Path, description: str = "") -> tuple[str, str, float, list[str]]:
        raise NotImplementedError


class OpenAIImageExtractionProvider(ImageExtractionProvider):
    def extract(self, *, path: Path, description: str = "") -> tuple[str, str, float, list[str]]:
        settings = get_settings()
        if settings.llm_api_key is None:
            raise RuntimeError("LLM_API_KEY is required for image evidence extraction")
        mime = {".png": "image/png", ".webp": "image/webp"}.get(path.suffix.lower(), "image/jpeg")
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        response = httpx.post(
            f"{settings.llm_base_url.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key.get_secret_value()}"},
            json={
                "model": settings.vision_model_name,
                "messages": [{"role": "user", "content": [
                    {"type": "text", "text": f"Analyze this operational evidence. Context: {description}. Return JSON with extracted_text, summary, and confidence from 0 to 1. Do not infer details that are not visible."},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{encoded}"}},
                ]}],
                "response_format": {"type": "json_object"},
                "temperature": 0,
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = json.loads(response.json()["choices"][0]["message"]["content"])
        return str(payload["extracted_text"]), str(payload["summary"]), float(payload["confidence"]), []


class ImageEvidenceExtractor:
    def __init__(self, provider: ImageExtractionProvider | None = None) -> None:
        self.provider = provider or OpenAIImageExtractionProvider()
        self.classifier = DashboardScreenshotClassifier()

    def extract(self, *, path: Path, description: str = "") -> dict:
        text, summary, confidence, warnings = self.provider.extract(path=path, description=description)
        classification = self.classifier.classify(filename=path.name, extracted_text=text, description=description)
        lowered = f"{path.name} {description}".lower()
        detected_type = "architecture_diagram" if "architecture" in lowered or "diagram" in lowered else "sentry_screenshot" if "sentry" in lowered else "dashboard_screenshot"
        return {
            "extracted_text": text,
            "summary": summary,
            "detected_type": detected_type,
            "confidence": confidence,
            "metadata": {"provider": self.provider.__class__.__name__, "dashboard_classification": classification.model_dump()},
            "warnings": warnings,
        }
