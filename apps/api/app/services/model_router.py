from __future__ import annotations

from dataclasses import dataclass
import json
from pathlib import Path
from typing import Any

import httpx
import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.investigation import PromptVersion
from app.services.operations_service import runtime_settings


PROMPTS_DIR = Path(__file__).resolve().parents[4] / "prompts"


@dataclass(slots=True)
class LLMResult:
    model_name: str
    prompt_version: str
    content: dict[str, Any]
    token_input: int
    token_output: int
    estimated_cost_usd: float


class ModelProviderError(RuntimeError):
    pass


class OpenAICompatibleProvider:
    def __init__(self) -> None:
        self.settings = get_settings()

    def run_structured(
        self,
        *,
        model: str,
        system_prompt: str,
        task_name: str,
        content: dict[str, Any],
        prompt_version: str,
        temperature: float,
        max_tokens: int,
    ) -> LLMResult:
        api_key = self.settings.llm_api_key
        if api_key is None:
            raise ModelProviderError("LLM_API_KEY is required to run an investigation")
        try:
            response = httpx.post(
                f"{self.settings.llm_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {api_key.get_secret_value()}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": f"{system_prompt}\nReturn one valid JSON object and no prose."},
                        {"role": "user", "content": json.dumps({"task": task_name, "input": content}, default=str)},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            message = payload["choices"][0]["message"]["content"]
            parsed = json.loads(message)
            usage = payload.get("usage", {})
            return LLMResult(
                model_name=payload.get("model", model),
                prompt_version=prompt_version,
                content=parsed,
                token_input=int(usage.get("prompt_tokens", 0)),
                token_output=int(usage.get("completion_tokens", 0)),
                estimated_cost_usd=0.0,
            )
        except (httpx.HTTPError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise ModelProviderError(f"Model provider request failed: {exc}") from exc


class ModelRouter:
    def __init__(self, provider: OpenAICompatibleProvider | None = None) -> None:
        self.provider = provider or OpenAICompatibleProvider()

    def load_prompt(self, db: Session, file_name: str) -> dict[str, Any]:
        path = PROMPTS_DIR / file_name
        payload = yaml.safe_load(path.read_text(encoding="utf-8"))
        existing = db.scalar(
            select(PromptVersion).where(PromptVersion.name == payload["name"], PromptVersion.version == payload["version"])
        )
        if existing is None:
            db.add(PromptVersion(name=payload["name"], version=payload["version"], description=payload.get("description", ""), template=payload.get("template", "")))
            db.flush()
        return payload

    def run_structured(self, *, db: Session, prompt_file: str, task_name: str, content: dict[str, Any]) -> LLMResult:
        prompt = self.load_prompt(db, prompt_file)
        configured = runtime_settings(db)
        prompt_version = f'{prompt["name"]}_{prompt["version"]}'
        models = [configured.reasoning_model_primary, configured.reasoning_model_fallback]
        last_error: Exception | None = None
        for model in dict.fromkeys(models):
            try:
                return self.provider.run_structured(
                    model=model,
                    system_prompt=prompt.get("template", ""),
                    task_name=task_name,
                    content=content,
                    prompt_version=prompt_version,
                    temperature=configured.generation_temperature,
                    max_tokens=configured.generation_max_tokens,
                )
            except ModelProviderError as exc:
                last_error = exc
        raise ModelProviderError(f"All configured model routes failed: {last_error}")


def get_model_router() -> ModelRouter:
    return ModelRouter()
