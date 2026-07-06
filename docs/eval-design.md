# Eval Design

IncidentLens AI includes a deterministic local evaluation harness so the project can be demonstrated without paid APIs.

## Goals

- score retrieval quality on the seeded payment incident
- verify root cause selection
- measure citation grounding
- detect unsafe action leakage
- capture latency and cost trends for mock-mode runs

## Current Dataset

The repository currently ships with:

- `evals/datasets/payment_api_incident.json`

This dataset evaluates the seeded incident against:

- expected retrieval query
- expected root cause
- expected citation IDs

## Current Metrics

The backend runner computes and stores:

- Recall@5
- Recall@10
- MRR
- root cause accuracy
- citation coverage
- unsupported claim rate
- unsafe action rate
- average agent latency
- average estimated cost

## Execution Paths

CLI:

```bash
./.venv/bin/python evals/run_eval.py
```

API:

- `POST /api/evals/run`
- `GET /api/evals/history`

Frontend:

- `/evals`

## Storage Model

Eval runs are persisted in the `eval_runs` table with:

- dataset name
- metric values
- summary payload
- failed cases payload
- timestamp

## Current Methodology Notes

- retrieval uses the same backend retrieval pipeline as the incident workflow
- the eval runner triggers investigation if no persisted report exists yet
- metrics are deterministic in mock mode, which keeps portfolio demos reproducible
- failed cases remain structured JSON so they can be rendered in the dashboard and extended later

## Future Expansion

- multiple incident datasets
- regression baselines by prompt version
- retrieval precision and NDCG
- hallucination audits over larger report sections
- provider-vs-mock comparison runs
