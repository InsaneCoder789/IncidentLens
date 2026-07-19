# IncidentLens Operations Runbook

## Release

1. Build immutable API, worker, and web images from the same commit.
2. Apply `alembic upgrade head` before starting API traffic.
3. Verify `/api/health/live` and `/api/health/ready`.
4. Start workers and confirm Redis queue consumption.
5. Run the browser smoke test against the release candidate.

## Rollback

1. Stop new deployments and preserve the failed release logs.
2. Roll the API, worker, and web images back to the previous shared version.
3. Use `alembic downgrade` only when the migration is explicitly documented as reversible and no new-version data has been written.
4. Confirm readiness, queue depth, and one read-only incident workflow.

## Database Recovery

- Take encrypted PostgreSQL backups before every schema migration.
- Restore into an isolated database first and run `alembic current` plus API smoke tests.
- Never test restoration against the production database.

## Queue Recovery

- Jobs remain authoritative in the `jobs` table.
- A queued job missing from Redis can be republished by ID after verifying its status and idempotency key.
- Do not replay completed or cancelled jobs.

## Provider Failure

- Provider failures remain visible and never return generated fallback data.
- Check the persisted job error, request ID, provider status, and credential scope.
- Retry only after correcting the underlying configuration or transient provider condition.
