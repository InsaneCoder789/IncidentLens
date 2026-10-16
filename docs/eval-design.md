# Evaluation Measurements And Limits

## Changed On 16 October 2026

The v2 evaluation dataset contains multiple distinct retrieval queries. Dataset
validation rejects empty target lists, duplicate queries, invalid incident IDs
and unknown fields before running retrieval. Recall and reciprocal rank use
deduplicated citation IDs rather than counting the same citation repeatedly.
MRR is the arithmetic mean of reciprocal ranks across the recorded queries.
The example is still **one synthetic incident**, not a representative production
benchmark or a general root-cause accuracy measurement.

Report checks consume persisted `analysis_json`: hypotheses, exact supporting or
contradicting evidence IDs, remediation sections and evaluator flags. Renamed or
missing Markdown headings no longer crash the suite. Missing/malformed structured
reports are a review failure, not silently accepted. Citation coverage counts
expected references that exist in the incident; unknown IDs are reported. A valid
citation is not proof that every sentence is supported.

Unsupported-claim and unsafe-action rates are now **unavailable (`null`)**. The
previous root-cause substring and action keyword heuristics did not measure those
rates. Model evaluator flags are retained as review signals, not relabelled as
independent ground truth. For example, “do not restart” is no longer marked unsafe
just because it contains “restart.” A typed action-policy evaluator and independently
reviewed claim/action labels remain necessary for genuine rates.

Latency averages only completed agent steps. Cost averages completed assigned-model
steps and is still estimated, not an invoice or per-investigation total. Missing
traces are `null`, not measured zero. The UI displays unavailable values explicitly;
history no longer plots unknown latency as zero. Fixture match percentages and
latency milliseconds have separate chart scales. These changes do not establish
ML accuracy or population-level performance.

## Schema And Historical Results

Deploy migration `0007_nullable_eval_metrics` before new writers (`alembic upgrade
head`, following the repository's database deployment procedure). It makes missing
metrics nullable. Do not run it against a live database without the usual backup
and migration review. This maintenance pass does not migrate any user database.
Downgrade refuses to replace missing values with fabricated numbers.

Historical rows remain unchanged. API responses mask the old heuristic metrics
and single-query MRR unless the row identifies v2 methodology; old zero values are
not retroactively certified. Retrieval cases, structured failures, methodology
version, query count and limitations are retained in each new run's summary.

## Verification

`apps/api/tests/test_eval_metrics.py` contains positive and deliberately failing
cases: actual mean rank, duplicate chunks, empty/duplicate datasets, malformed
structured output, negated action wording, unknown citations, absent telemetry,
legacy masking and a missed retrieval target. Run the API suite against a disposable
database; its test fixture recreates tables and must never target user data.

The isolated API suite passed all 23 tests on 16 October 2026, including eight evaluation/migration regressions. Web type-check acceptance remains pending. The existing environment's
first commands were blocked in filesystem reads of dependency files (pytest plugin
metadata and Next.js declarations), not observed test assertion failures. Browser
rendering, migration execution on disposable PostgreSQL and representative annotated
incident/claim/action datasets remain separate verification gates.

The suite can invoke the configured model/embedding providers when a report does
not yet exist. It is not automatically free or deterministic outside test fixtures.
The accepted test run mocked those transports and used a disposable SQLite database;
it did not call paid models or migrate user data. Run commands use the configured
Python environment; API entry points are `/api/evals/run` and `/api/evals/history`.
