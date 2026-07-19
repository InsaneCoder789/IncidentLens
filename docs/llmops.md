# LLMOps

IncidentLens routes structured agent requests through an OpenAI-compatible provider boundary. Provider credentials remain server-side and missing configuration fails closed.

## Routing

- primary and fallback models are persisted in runtime settings
- prompts are loaded from versioned YAML and recorded with every model run
- provider usage, latency, model name, prompt version, and estimated cost are persisted
- malformed JSON or provider errors fail the agent run instead of producing substitute output

## Governance

- production mutations remain represented as approval requests
- runtime setting changes create immutable audit events
- evaluation thresholds and monthly cost limits are persisted in the control plane
- model, integration, and evidence credentials are supplied only through the server environment

## Durable Execution

Investigations, evidence processing, and evaluations can run as Redis-backed jobs. The database job ledger records idempotency keys, attempts, progress, cancellation, errors, and final results.
