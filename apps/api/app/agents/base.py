from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, UTC
from time import perf_counter

from sqlalchemy.orm import Session

from app.agents.state import InvestigationState
from app.models.investigation import AgentRun, ModelRun
from app.services.model_router import LLMResult, ModelRouter


class BaseAgent(ABC):
    name: str
    prompt_file: str

    def __init__(self, db: Session, router: ModelRouter) -> None:
        self.db = db
        self.router = router
        self._model_result: LLMResult | None = None

    def generate(self, content: dict) -> dict:
        self._model_result = self.router.run_structured(
            db=self.db,
            prompt_file=self.prompt_file,
            task_name=self.name,
            content=content,
        )
        return self._model_result.content

    async def run(self, state: InvestigationState) -> InvestigationState:
        started = datetime.now(UTC)
        agent_run = AgentRun(
            incident_id=int(state.incident_id),
            agent_name=self.name,
            status="running",
            input_summary=self.input_summary(state),
            output_summary="",
            model_name="unassigned",
            prompt_version="pending",
            started_at=started,
        )
        self.db.add(agent_run)
        self.db.flush()
        state.active_agent_run_id = agent_run.id

        begin = perf_counter()
        try:
            result = await self.execute(state)
            duration = int((perf_counter() - begin) * 1000)
            output_summary = self.output_summary(result)
            prompt = self.router.load_prompt(self.db, self.prompt_file)
            prompt_version = f'{prompt["name"]}_{prompt["version"]}'
            model_result = self._model_result or self.router.run_structured(
                db=self.db,
                prompt_file=self.prompt_file,
                task_name=self.name,
                content={"incident": result.model_dump(exclude={"report_markdown", "active_agent_run_id"}), "output_summary": output_summary},
            )

            agent_run.status = "completed"
            agent_run.output_summary = output_summary
            agent_run.model_name = model_result.model_name
            agent_run.prompt_version = prompt_version
            agent_run.latency_ms = duration
            agent_run.token_input = model_result.token_input
            agent_run.token_output = model_result.token_output
            agent_run.estimated_cost_usd = model_result.estimated_cost_usd
            agent_run.completed_at = datetime.now(UTC)
            self.db.add(
                ModelRun(
                    agent_run_id=agent_run.id,
                    model_name=model_result.model_name,
                    prompt_version=prompt_version,
                    token_input=model_result.token_input,
                    token_output=model_result.token_output,
                    estimated_cost_usd=model_result.estimated_cost_usd,
                )
            )
            self.db.add(agent_run)
            self.db.flush()
            return result
        except Exception as exc:
            agent_run.status = "failed"
            agent_run.error_message = str(exc)
            agent_run.completed_at = datetime.now(UTC)
            self.db.add(agent_run)
            self.db.flush()
            raise

    @abstractmethod
    async def execute(self, state: InvestigationState) -> InvestigationState:
        raise NotImplementedError

    def input_summary(self, state: InvestigationState) -> str:
        return f"{state.title} with {len(state.evidence_bundle)} evidence bundle items."

    def output_summary(self, state: InvestigationState) -> str:
        return f"{self.name} updated the investigation state."
