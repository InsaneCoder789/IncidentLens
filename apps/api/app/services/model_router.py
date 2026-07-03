from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.investigation import PromptVersion
from app.services.mock_llm import MockLLM, MockLLMResult


PROMPTS_DIR = Path(__file__).resolve().parents[4] / "prompts"


class ModelRouter:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.mock_llm = MockLLM()

    def load_prompt(self, db: Session, file_name: str) -> dict[str, Any]:
        path = PROMPTS_DIR / file_name
        payload = yaml.safe_load(path.read_text(encoding="utf-8"))
        existing = db.scalar(
            select(PromptVersion).where(
                PromptVersion.name == payload["name"],
                PromptVersion.version == payload["version"],
            )
        )
        if existing is None:
            db.add(
                PromptVersion(
                    name=payload["name"],
                    version=payload["version"],
                    description=payload.get("description", ""),
                    template=payload.get("template", ""),
                )
            )
            db.flush()
        return payload

    def run_structured(self, *, db: Session, prompt_file: str, task_name: str, content: dict[str, Any]) -> MockLLMResult:
        prompt = self.load_prompt(db, prompt_file)
        return self.mock_llm.run_structured(
            task_name=task_name,
            prompt_version=f'{prompt["name"]}_{prompt["version"]}',
            content=content,
        )


def get_model_router() -> ModelRouter:
    return ModelRouter()
