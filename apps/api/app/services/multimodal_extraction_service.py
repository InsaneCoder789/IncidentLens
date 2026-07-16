from __future__ import annotations

from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from app.services.extractors import AudioEvidenceExtractor, ImageEvidenceExtractor, PdfEvidenceExtractor


class ExtractionResult(BaseModel):
    extracted_text: str
    summary: str
    detected_type: str
    confidence: float
    metadata: dict[str, Any]
    warnings: list[str] = Field(default_factory=list)


class MultimodalExtractionService:
    image_extensions = {".png", ".jpg", ".jpeg", ".webp"}
    document_extensions = {".pdf", ".md", ".txt"}
    audio_extensions = {".mp3", ".wav", ".m4a"}

    def __init__(self) -> None:
        self.image_extractor = ImageEvidenceExtractor()
        self.pdf_extractor = PdfEvidenceExtractor()
        self.audio_extractor = AudioEvidenceExtractor()

    def extract(self, *, path: Path, mime_type: str, description: str = "") -> ExtractionResult:
        extension = path.suffix.lower()
        if extension in self.image_extensions or mime_type.startswith("image/"):
            payload = self.image_extractor.extract(path=path, description=description)
        elif extension == ".pdf" or mime_type == "application/pdf":
            payload = self.pdf_extractor.extract(path=path, description=description)
        elif extension in self.audio_extensions or mime_type.startswith("audio/"):
            payload = self.audio_extractor.extract(path=path, description=description)
        elif extension in {".md", ".txt"} or mime_type.startswith("text/"):
            payload = self._extract_text(path=path, description=description)
        else:
            raise ValueError(f"Unsupported evidence file type: {extension or mime_type}")
        return ExtractionResult.model_validate(payload)

    @staticmethod
    def _extract_text(*, path: Path, description: str = "") -> dict:
        warnings: list[str] = []
        try:
            extracted_text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            extracted_text = path.read_text(encoding="utf-8", errors="replace")
            warnings.append("Invalid UTF-8 bytes were replaced during text extraction.")
        extracted_text = extracted_text.strip() or description.strip()
        return {
            "extracted_text": extracted_text,
            "summary": "Text evidence loaded into the normalization pipeline.",
            "detected_type": "text_document",
            "confidence": 1.0,
            "metadata": {"character_count": len(extracted_text)},
            "warnings": warnings,
        }


def infer_source_type(*, filename: str, mime_type: str, requested_source_type: str | None = None) -> str:
    if requested_source_type:
        return requested_source_type
    lowered = filename.lower()
    extension = Path(filename).suffix.lower()
    if extension in {".mp3", ".wav", ".m4a"} or mime_type.startswith("audio/"):
        return "voice_note"
    if extension == ".pdf" or mime_type == "application/pdf":
        return "pdf_postmortem" if "postmortem" in lowered else "pdf_runbook"
    if extension in {".png", ".jpg", ".jpeg", ".webp"} or mime_type.startswith("image/"):
        if "sentry" in lowered:
            return "sentry_screenshot"
        if any(token in lowered for token in ("grafana", "prometheus", "dashboard")):
            return "dashboard_screenshot"
        if any(token in lowered for token in ("architecture", "diagram")):
            return "architecture_diagram"
        return "screenshot"
    if extension == ".md":
        return "runbook"
    return "log"
