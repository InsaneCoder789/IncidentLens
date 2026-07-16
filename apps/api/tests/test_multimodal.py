from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.extractors.dashboard_classifier import DashboardScreenshotClassifier
from app.services.extractors.pdf_extractor import PDF_FALLBACK_TEXT, PdfEvidenceExtractor
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


def test_mock_image_and_audio_extraction_are_incident_specific(tmp_path: Path) -> None:
    service = MultimodalExtractionService()
    image = service.extract(path=tmp_path / "grafana-payment-errors.png", mime_type="image/png")
    audio = service.extract(path=tmp_path / "payment-war-room.m4a", mime_type="audio/mp4")

    assert "roughly 18%" in image.extracted_text
    assert image.metadata["dashboard_classification"]["classification"] == "error_spike"
    assert "payment_webhook_strict_mode" in audio.extracted_text
    assert infer_source_type(filename="sentry-error.png", mime_type="image/png") == "sentry_screenshot"


def test_pdf_extraction_fails_safely_for_invalid_pdf(tmp_path: Path) -> None:
    path = tmp_path / "payment-runbook.pdf"
    path.write_bytes(b"not a real pdf")

    result = PdfEvidenceExtractor().extract(path=path)

    assert result["extracted_text"] == PDF_FALLBACK_TEXT
    assert result["warnings"]
    assert result["confidence"] == 0.5


def test_storage_path_cannot_escape_evidence_directory() -> None:
    try:
        resolve_evidence_storage_path("../../.env")
    except ValueError as exc:
        assert "escapes" in str(exc)
    else:
        raise AssertionError("Expected unsafe storage path to be rejected")


def test_upload_process_search_and_report_multimodal_evidence() -> None:
    with TestClient(app) as client:
        incidents = client.get("/api/incidents").json()
        incident_id = incidents[0]["id"]

        upload = client.post(
            f"/api/incidents/{incident_id}/evidence/upload",
            files={"file": ("grafana-checkout-errors.png", b"mock-image-bytes", "image/png")},
            data={"title": "Uploaded Grafana checkout error spike", "process_immediately": "true"},
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
                    "query": "What did the Grafana screenshot show about payment errors?",
                    "source_types": ["dashboard_screenshot"],
                    "top_k": 8,
                    "score_threshold": 0,
                },
            )
            assert search.status_code == 200, search.text
            assert any(item["title"] == "Uploaded Grafana checkout error spike" for item in search.json()["results"])

            investigation = client.post(f"/api/incidents/{incident_id}/investigate")
            assert investigation.status_code == 200, investigation.text
            report = client.get(f"/api/incidents/{incident_id}/report").json()["report_markdown"]
            assert "### Multimodal Evidence" in report
            assert "dashboard_screenshot" in report
        finally:
            client.delete(f"/api/evidence/{evidence_id}")
