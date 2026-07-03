from __future__ import annotations

from time import perf_counter

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.agents.state import InvestigationState
from app.models.evidence import EvidenceItem
from app.models.investigation import ToolCall


class ToolExecutionAgent(BaseAgent):
    name = "Tool Execution Agent"
    prompt_file = "retrieval_agent_v1.yaml"

    async def execute(self, state: InvestigationState) -> InvestigationState:
        tools = {
            "search_github_changes": ["github_pr", "github_commit"],
            "fetch_sentry_issue": ["sentry_issue"],
            "query_prometheus_snapshot": ["prometheus_metric"],
            "check_statuspage": ["statuspage"],
            "search_runbooks": ["runbook"],
            "search_previous_incidents": ["previous_incident"],
        }
        outputs: dict[str, list[dict]] = {}
        for tool_name, source_types in tools.items():
            start = perf_counter()
            items = list(
                self.db.scalars(
                    select(EvidenceItem).where(
                        EvidenceItem.incident_id == int(state.incident_id),
                        EvidenceItem.source_type.in_(source_types),
                    )
                )
            )
            payload = [
                {"title": item.title, "source_type": item.source_type, "metadata": item.metadata_json, "snippet": item.normalized_content or item.raw_content}
                for item in items
            ]
            outputs[tool_name] = payload
            self.db.add(
                ToolCall(
                    agent_run_id=state.active_agent_run_id or "",
                    tool_name=tool_name,
                    status="completed",
                    input_json={"incident_id": state.incident_id, "source_types": source_types},
                    output_json={"results": payload},
                    latency_ms=int((perf_counter() - start) * 1000),
                )
            )
        state.tool_outputs = outputs
        return state

    def output_summary(self, state: InvestigationState) -> str:
        return f"Executed {len(state.tool_outputs)} safe mock tools and persisted their outputs."
