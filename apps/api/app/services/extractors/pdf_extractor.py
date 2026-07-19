from __future__ import annotations

from pathlib import Path


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
            raise RuntimeError(f"PDF extraction failed: {exc.__class__.__name__}") from exc

        if not extracted_text:
            extracted_text = description.strip()
        if not extracted_text:
            raise RuntimeError("PDF contains no extractable text; configure OCR or provide a description")

        lowered = f"{path.name} {extracted_text}".lower()
        detected_type = "pdf_postmortem" if "postmortem" in lowered else "pdf_runbook"
        return {
            "extracted_text": extracted_text,
            "summary": f"Extracted searchable text from {page_count or 'an unknown number of'} PDF pages.",
            "detected_type": detected_type,
            "confidence": 0.9 if page_count else 0.7,
            "metadata": {"page_count": page_count, "text_extraction_available": bool(page_count)},
            "warnings": warnings,
        }
