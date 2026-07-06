# LLMOps

IncidentLens AI is designed to stay usable in deterministic mock mode while still exposing the operational surfaces expected from a production-style AI system.

## Current LLMOps Surfaces

- prompt registry in `prompts/`
- model configuration in `config/models.yaml`
- deterministic mock model routing in `apps/api/app/services/model_router.py`
- mock provider implementation in `apps/api/app/services/mock_llm.py`
- per-agent latency tracking
- per-agent token input and output tracking
- estimated cost tracking
- persisted model runs
- trace viewer in `/incidents/[id]/trace`
- eval history in `/evals`

## Mock Mode

Mock mode is the default local runtime story.

Why:

- no paid API dependency
- deterministic demo behavior
- reproducible eval outputs
- easier portfolio walkthroughs

The router still preserves a clear abstraction boundary for future provider additions.

## Prompt Registry

Current prompt files include:

- `prompts/intake_agent_v1.yaml`
- `prompts/retrieval_agent_v1.yaml`
- `prompts/root_cause_agent_v1.yaml`
- `prompts/remediation_agent_v1.yaml`
- `prompts/evaluator_agent_v1.yaml`

Prompt metadata is loaded and persisted into the database through the model router.

## Metrics Tracked

Each agent run currently records:

- agent name
- prompt version
- model name
- status
- latency
- token input
- token output
- estimated cost
- error message when relevant

## Current Tradeoffs

- embeddings fall back to deterministic vectors when `sentence-transformers` is unavailable
- Redis is optional for local demo flows and may remain degraded without blocking the app
- the mock model does not attempt hidden reasoning simulation; it only preserves structured outputs and observability scaffolding

## Next LLMOps Steps

- add explicit fallback provider chains beyond mock mode
- store richer model-run details per provider attempt
- add prompt-version comparison views in the dashboard
- persist evaluator findings by report section
- capture p50/p95 trend views over historical eval runs
