from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.extractors.dashboard_classifier import DashboardScreenshotClassifier
from app.services.extractors.audio_extractor import AudioEvidenceExtractor, AudioTranscriptionProvider
from app.services.extractors.image_extractor import ImageEvidenceExtractor, ImageExtractionProvider
from app.services.extractors.pdf_extractor import PdfEvidenceExtractor
from app.services.evidence_storage import resolve_evidence_storage_path
from app.services.multimodal_extraction_service import MultimodalExtractionService, infer_source_type


def test_dashboard_classifier_detects_payment_error_spike() -> None:
    result = DashboardScreenshotClassifier().classify(
        filename="grafana-payment-errors.png",
        extracted_text="payments-api 5xx rate increased after deployment",
    )

    assert result.classification == "error_spike"
    assert result.confidence >= 0.8
    assert "payment service visible" in result.signals


class TestImageProvider(ImageExtractionProvider):
    def extract(self, *, path: Path, description: str = "") -> tuple[str, str, float, list[str]]:
        return "payments-api 5xx rate increased after deployment", "Visible error-rate increase", 0.93, []


class TestAudioProvider(AudioTranscriptionProvider):
    def transcribe(self, *, path: Path, description: str = "") -> tuple[str, float, list[str]]:
        return "Operators correlated the failure with the latest deployment.", 1.0, []


def test_image_and_audio_extractors_accept_provider_transports(tmp_path: Path) -> None:
    image = ImageEvidenceExtractor(TestImageProvider()).extract(path=tmp_path / "grafana-payment-errors.png")
    audio = AudioEvidenceExtractor(TestAudioProvider()).extract(path=tmp_path / "incident.m4a")

    assert "5xx rate increased" in image["extracted_text"]
    assert image["metadata"]["dashboard_classification"]["classification"] == "error_spike"
    assert "latest deployment" in audio["extracted_text"]
    assert infer_source_type(filename="sentry-error.png", mime_type="image/png") == "sentry_screenshot"


def test_pdf_extraction_fails_safely_for_invalid_pdf(tmp_path: Path) -> None:
    path = tmp_path / "payment-runbook.pdf"
    path.write_bytes(b"not a real pdf")

    try:
        PdfEvidenceExtractor().extract(path=path)
    except RuntimeError as exc:
        assert "PDF extraction failed" in str(exc)
    else:
        raise AssertionError("Invalid PDFs must not produce placeholder evidence")


def test_storage_path_cannot_escape_evidence_directory() -> None:
    try:
        resolve_evidence_storage_path("../../.env")
    except ValueError as exc:
        assert "escapes" in str(exc)
    else:
        raise AssertionError("Expected unsafe storage path to be rejected")


def test_upload_process_search_and_report_evidence() -> None:
    with TestClient(app, headers={"Authorization": f"Bearer {os.environ['API_TOKEN']}"}) as client:
        incidents = client.get("/api/incidents").json()
        incident_id = incidents[0]["id"]

        upload = client.post(
            f"/api/incidents/{incident_id}/evidence/upload",
            files={"file": ("checkout-errors.txt", b"payments-api error rate increased after deployment", "text/plain")},
            data={"title": "Uploaded checkout error evidence", "process_immediately": "true"},
        )
        assert upload.status_code == 201, upload.text
        payload = upload.json()
        evidence_id = payload["evidence"]["id"]
        try:
            assert payload["upload_status"] == "processed"
            assert payload["evidence"]["metadata_json"]["extraction_status"] == "completed"
            assert payload["evidence"]["processing_status"] == "embedded"

            search = client.post(
                "/api/retrieval/search",
                json={
                    "incident_id": incident_id,
                    "query": "What happened to the payment error rate?",
                    "source_types": ["log"],
                    "top_k": 8,
                    "score_threshold": 0,
                },
            )
            assert search.status_code == 200, search.text
            assert any(item["title"] == "Uploaded checkout error evidence" for item in search.json()["results"])

            investigation = client.post(f"/api/incidents/{incident_id}/investigate")
            assert investigation.status_code == 200, investigation.text
            report = client.get(f"/api/incidents/{incident_id}/report").json()["report_markdown"]
            assert "Uploaded checkout error evidence" in report
        finally:
            client.delete(f"/api/evidence/{evidence_id}")
