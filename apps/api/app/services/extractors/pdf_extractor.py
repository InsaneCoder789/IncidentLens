from __future__ import annotations

from pathlib import Path


PDF_FALLBACK_TEXT = (
    "PDF uploaded but text extraction is unavailable in this environment. "
    "Add extracted text manually or enable PDF extraction dependency."
)


class PdfEvidenceExtractor:
    def extract(self, *, path: Path, description: str = "") -> dict:
        warnings: list[str] = []
        page_count = 0
        extracted_text = ""
        try:
            from pypdf import PdfReader

            reader = PdfReader(str(path))
            page_count = len(reader.pages)
            extracted_text = "\n\n".join((page.extract_text() or "").strip() for page in reader.pages).strip()
            if not extracted_text:
                warnings.append("The PDF contains no extractable text and may require OCR.")
        except Exception as exc:
            warnings.append(f"PDF extraction fallback used: {exc.__class__.__name__}")

        if not extracted_text:
            extracted_text = description.strip() or PDF_FALLBACK_TEXT

        lowered = f"{path.name} {extracted_text}".lower()
        detected_type = "pdf_postmortem" if "postmortem" in lowered else "pdf_runbook"
        return {
            "extracted_text": extracted_text,
            "summary": f"Extracted searchable text from {page_count or 'an unknown number of'} PDF pages.",
            "detected_type": detected_type,
            "confidence": 0.9 if page_count and extracted_text != PDF_FALLBACK_TEXT else 0.5,
            "metadata": {"page_count": page_count, "text_extraction_available": extracted_text != PDF_FALLBACK_TEXT},
            "warnings": warnings,
        }
