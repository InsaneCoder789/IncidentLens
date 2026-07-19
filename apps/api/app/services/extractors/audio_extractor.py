from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

import httpx

from app.core.config import get_settings


class AudioTranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, *, path: Path, description: str = "") -> tuple[str, float, list[str]]:
        raise NotImplementedError


class OpenAIAudioTranscriptionProvider(AudioTranscriptionProvider):
    def transcribe(self, *, path: Path, description: str = "") -> tuple[str, float, list[str]]:
        settings = get_settings()
        if settings.llm_api_key is None:
            raise RuntimeError("LLM_API_KEY is required for audio transcription")
        with path.open("rb") as stream:
            response = httpx.post(
                f"{settings.llm_base_url.rstrip('/')}/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.llm_api_key.get_secret_value()}"},
                files={"file": (path.name, stream)},
                data={"model": settings.transcription_model_name, "response_format": "json", "prompt": description},
                timeout=120,
            )
        response.raise_for_status()
        transcript = str(response.json()["text"]).strip()
        if not transcript:
            raise RuntimeError("Audio provider returned an empty transcript")
        return transcript, 1.0, []


class AudioEvidenceExtractor:
    def __init__(self, provider: AudioTranscriptionProvider | None = None) -> None:
        self.provider = provider or OpenAIAudioTranscriptionProvider()

    def extract(self, *, path: Path, description: str = "") -> dict:
        transcript, confidence, warnings = self.provider.transcribe(path=path, description=description)
        return {
            "extracted_text": f"Transcribed voice note:\n{transcript}",
            "summary": "Incident voice note transcribed into searchable evidence.",
            "detected_type": "voice_note",
            "confidence": confidence,
            "metadata": {"provider": self.provider.__class__.__name__, "transcript": transcript},
            "warnings": warnings,
        }
