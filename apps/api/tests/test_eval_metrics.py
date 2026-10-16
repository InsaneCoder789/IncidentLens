from datetime import UTC, datetime
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.evals.metrics import EvaluationDataset, average_retrieval, measured_average, retrieval_metrics, structured_report_checks
from app.evals import runner
from app.schemas.evals import EvalRunRead


def dataset():
    return {"dataset_name": "synthetic_fixture", "incident_id": 1, "expected_root_cause": "Expected cause",
            "retrieval_cases": [{"query": "first question", "expected_citations": ["EVID-1"]},
                                {"query": "second question", "expected_citations": ["EVID-2"]}]}


def analysis():
    return {"hypotheses": [{"title": "Expected cause", "confidence": 0.8, "supporting_evidence": ["EVID-1", "EVID-2"], "reasoning_summary": "Review references"}],
            "remediation_plan": {"immediate_actions": ["Do not restart the service"], "approval_gated_actions": ["Restart only after approval"],
                                 "rollback_or_hotfix_plan": [], "verification_checklist": [], "customer_facing_update": "Investigating", "follow_up_tickets": []},
            "evaluation": {"quality_score": 0.8, "citation_coverage": 1, "unsupported_claims": [], "unsafe_recommendations": [],
                           "missing_evidence": [], "notes": "Model assessment, not independent labels"}}


def test_multi_query_mrr_is_an_actual_mean():
    result = average_retrieval([retrieval_metrics(["wrong", "EVID-1"], ["EVID-1"]), retrieval_metrics(["EVID-2"], ["EVID-2"])])
    assert result["mrr"] == 0.75
    assert result["recall_at_5"] == 1
    with pytest.raises(ValueError):
        average_retrieval([retrieval_metrics([], ["EVID-1"])])


def test_repeated_chunks_do_not_inflate_citation_recall_or_rank():
    result = retrieval_metrics(["wrong", "wrong", "EVID-1", "EVID-1"], ["EVID-1", "EVID-2"])
    assert result["reciprocal_rank"] == 0.5
    assert result["recall_at_10"] == 0.5
    with pytest.raises(ValueError):
        retrieval_metrics([], [])


def test_datasets_reject_empty_targets_duplicate_queries_and_invalid_incidents():
    for change in [{"incident_id": True}, {"incident_id": 0}, {"retrieval_cases": []},
                   {"retrieval_cases": [{"query": "one", "expected_citations": []}, {"query": "two", "expected_citations": ["x"]}]},
                   {"retrieval_cases": [dataset()["retrieval_cases"][0]] * 2}]:
        with pytest.raises(ValidationError):
            EvaluationDataset.model_validate({**dataset(), **change})


def test_report_checks_use_structured_references_and_do_not_classify_negated_words_as_unsafe():
    result = structured_report_checks(analysis(), {"EVID-1", "EVID-2"}, {"EVID-1"})
    assert result["citation_coverage"] == 0.5
    assert result["unknown_citations"] == ["EVID-2"]
    assert result["immediate_action_count"] == result["approval_gated_action_count"] == 1
    assert result["model_flagged_actions"] == []
    with pytest.raises((KeyError, ValueError)):
        structured_report_checks({}, {"EVID-1"}, {"EVID-1"})


def test_missing_measurements_are_unavailable_but_real_zero_is_retained():
    assert measured_average([]) is None
    assert measured_average([None, float("nan"), float("inf"), -1, True]) is None
    assert measured_average([0, 10, None]) == 5


def test_runner_handles_renamed_headings_missing_traces_and_records_failed_queries(monkeypatch):
    report = SimpleNamespace(selected_root_cause="Expected cause", report_markdown="Changed headings; no brittle split contract",
                             analysis_json=analysis(), created_at=datetime.now(UTC), confidence_score=0.8)
    monkeypatch.setattr(runner, "_load_dataset", dataset)
    monkeypatch.setattr(runner, "get_latest_report", lambda *_: report)
    monkeypatch.setattr(runner, "search_evidence", lambda _db, query: [SimpleNamespace(citation_id="EVID-1")] if query.query == "first question" else [])
    monkeypatch.setattr(runner, "list_incident_chunks", lambda *_: [SimpleNamespace(citation_id="EVID-1"), SimpleNamespace(citation_id="EVID-2")])
    monkeypatch.setattr(runner, "get_incident_trace", lambda *_: ([], []))
    db = SimpleNamespace(get=lambda *_: object(), add=lambda _: None, commit=lambda: None, refresh=lambda _: None)
    import asyncio
    result = asyncio.run(runner.run_eval_suite(db))
    assert result.mrr == 0.5
    assert result.avg_latency_ms is None and result.avg_cost_usd is None
    assert result.unsupported_claim_rate is None and result.unsafe_action_rate is None
    assert result.summary_json["query_count"] == 2
    assert any("missed expected evidence" in case["reason"] for case in result.failed_cases_json)


def test_legacy_api_metrics_are_not_relabelled_as_measured_v2_results():
    values = {"id": "legacy", "dataset_name": "old", "recall_at_5": 1, "recall_at_10": 1, "mrr": 1,
              "root_cause_accuracy": 1, "citation_coverage": 1, "unsupported_claim_rate": 0, "unsafe_action_rate": 0,
              "avg_latency_ms": 0, "avg_cost_usd": 0, "summary_json": {}, "created_at": datetime.now(UTC)}
    result = EvalRunRead(**values)
    assert result.mrr is None and result.avg_latency_ms is None and result.unsupported_claim_rate is None
    measured = EvalRunRead(**{**values, "summary_json": {"evaluation_version": 2}})
    assert measured.avg_latency_ms == 0


def test_nullable_metric_migration_preserves_values_and_refuses_fabricated_downgrade():
    import importlib.util
    from pathlib import Path
    import sqlalchemy as sa
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    path = Path(__file__).parents[1] / "alembic" / "versions" / "0007_nullable_eval_metrics.py"
    spec = importlib.util.spec_from_file_location("nullable_eval_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = sa.create_engine("sqlite://")
    try:
        with engine.begin() as connection:
            metadata = sa.MetaData()
            table = sa.Table("eval_runs", metadata, sa.Column("id", sa.Integer, primary_key=True),
                             *(sa.Column(field, sa.Float, nullable=False) for field in migration.FIELDS))
            metadata.create_all(connection)
            connection.execute(table.insert().values(id=1, **{field: 0.5 for field in migration.FIELDS}))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                assert all(column["nullable"] for column in sa.inspect(connection).get_columns("eval_runs") if column["name"] in migration.FIELDS)
                assert connection.execute(sa.text("SELECT avg_latency_ms FROM eval_runs")).scalar_one() == 0.5
                connection.execute(sa.text("UPDATE eval_runs SET avg_latency_ms=NULL"))
                with pytest.raises(RuntimeError, match="fabricating"):
                    migration.downgrade()
                assert connection.execute(sa.text("SELECT avg_latency_ms FROM eval_runs")).scalar_one() is None
    finally:
        engine.dispose()
