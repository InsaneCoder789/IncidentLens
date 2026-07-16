from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class AudioTranscriptionProvider(ABC):
    @abstractmethod
    def transcribe(self, *, path: Path, description: str = "") -> tuple[str, float, list[str]]:
        raise NotImplementedError


class MockAudioTranscriptionProvider(AudioTranscriptionProvider):
    def transcribe(self, *, path: Path, description: str = "") -> tuple[str, float, list[str]]:
        haystack = f"{path.name} {description}".lower()
        if any(token in haystack for token in ("payment", "webhook", "war-room", "war_room", "incident")):
            return (
                "The payment failures started after the webhook validation deployment. "
                "The team should check payment_webhook_strict_mode and compare the webhook success rate "
                "before and after v1.42.0.",
                0.87,
                [],
            )
        transcript = description.strip() or (
            "Voice note uploaded successfully. Mock transcription could not infer incident-specific speech "
            "from the filename."
        )
        return transcript, 0.55, ["Mock ASR uses filename and optional description signals."]


class AudioEvidenceExtractor:
    def __init__(self, provider: AudioTranscriptionProvider | None = None) -> None:
        self.provider = provider or MockAudioTranscriptionProvider()

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
