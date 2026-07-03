from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class MockLLMResult:
    model_name: str
    prompt_version: str
    content: dict[str, Any]
    token_input: int
    token_output: int
    estimated_cost_usd: float = 0.0


class MockLLM:
    model_name = "mock-llm"

    def run_structured(self, *, task_name: str, prompt_version: str, content: dict[str, Any]) -> MockLLMResult:
        token_input = max(64, len(str(content)) // 3)
        token_output = max(48, len(str(content)) // 5)
        return MockLLMResult(
            model_name=self.model_name,
            prompt_version=prompt_version,
            content=content,
            token_input=token_input,
            token_output=token_output,
            estimated_cost_usd=0.0,
        )
