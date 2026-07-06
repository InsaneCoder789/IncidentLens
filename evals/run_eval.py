from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.evals.runner import run_eval_suite  # noqa: E402


async def main() -> None:
    db = SessionLocal()
    try:
        run = await run_eval_suite(db)
        print(
            json.dumps(
                {
                    "id": run.id,
                    "dataset_name": run.dataset_name,
                    "recall_at_5": run.recall_at_5,
                    "recall_at_10": run.recall_at_10,
                    "mrr": run.mrr,
                    "root_cause_accuracy": run.root_cause_accuracy,
                    "citation_coverage": run.citation_coverage,
                    "unsupported_claim_rate": run.unsupported_claim_rate,
                    "unsafe_action_rate": run.unsafe_action_rate,
                    "avg_latency_ms": run.avg_latency_ms,
                    "avg_cost_usd": run.avg_cost_usd,
                    "failed_cases": run.failed_cases_json,
                },
                indent=2,
            )
        )
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
