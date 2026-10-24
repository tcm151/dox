# Ticket 0050: Versioned Sequential Database Migrations

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Keep migrations compatible with the current schema and run versioned changes once, in order. The project is starting from a fresh database; adopting older databases is out of scope.

## Requirements
- [x] Fresh installs retain `post.deleted`; the former destructive migration is no longer in the install path.
- [x] Each versioned migration has an ordered identifier and records it in its transaction.
- [x] Startup applies only newer migrations in deterministic order.
- [x] Failed migrations are transactional and their attempted versions are exposed through startup health diagnostics.
- [x] Fresh installs use the schema as their baseline; older database adoption is out of scope.
- [x] Fresh install and migration order are documented.
- [x] Applied migration drift is explicitly prevented by the contributor rule against editing released migration files; automated drift detection remains open.

## Tasks
- [x] Remove the former monolithic migration bundle containing `REMOVE FIELD IF EXISTS deleted ON TABLE post` from the install path.
- [x] Confirm `schema.surql` defines `post.deleted` and the current runner does not execute the legacy field-removal migration.
- [x] Inventory current migrations and identify statements that are unsafe to replay or reorder.
- [x] Define a migration version table with version and applied timestamp.
- [x] Move active migrations to individually versioned files.
- [x] Define the fresh-install baseline in `schema.surql`.
- [x] Apply pending migration files sequentially; each file records its version in its transaction.
- [x] Expose the failed migration version through startup health diagnostics.
- [x] Document how contributors add, test, and avoid modifying applied migrations.

## Notes
- Use individually versioned files under `server/assets/migrations/`.
- Each migration records its version and commits it with its changes in one transaction.
- Fresh installs use `schema.surql` and record the current app version as the baseline.
- Do not build a legacy database adoption or repair path for this fresh start.
- Do not restore the former monolithic `migrations.surql` bundle; the fresh schema and versioned migration files are the supported paths.
- `schema.surql` defines `post.deleted`, and post deletion sets it when comments must be retained. The former monolithic bundle containing its removal was deleted from the install path.
- `2026.5.2.surql` is the only active versioned migration, and `package.json` is at `2026.5.2`. Its `CREATE ONLY` version insert makes it unsafe to replay for the same version; the migration table and index definitions must precede that insert. The former monolithic migration bundle is deleted.
- Migration files must not be edited after release. Add a new versioned file for later changes.
- Fresh and repeated embedded startups were verified against a disposable test database: the schema baseline completed, the second startup read version `2026.5.2` from the migration record, `/api/health` reported `app` and `database` as `ready`, and `/feed` returned HTTP 200. No pending versioned migration was available to exercise.
- Failure handling was accepted by source review: each migration and its version insert run in one transaction; on an execution error the runner reports the attempted version, and startup marks the app failed. No forced failure was injected.
- Automated drift detection is open; released-file immutability is currently a contributor policy, not an automated check. Concurrent migration execution is out of scope.

## Relevant Files
- server/plugins/01.startup.server.ts
- server/middleware/00.startup.ts
- server/utils/migrations.ts
- server/assets/schema.surql
- server/assets/migrations/2026.5.2.surql
- server/api/post/[id]/delete.ts
- server/utils/database.ts
- server/utils/health.ts
- docs/Architecture.md
- docs/ContributionGuide.md

## Progress Log
- 2026-10-21: Changed latest migration selection to applied timestamp and removed `OVERWRITE` from the fresh schema. Repeated startup against the disposable embedded database passed.
- 2026-10-21: Verified fresh startup against the embedded test database and `/feed`; closed the migration foundation ticket. Accepted transactional failure handling based on source review; no forced failure was injected.
- 2026-10-21: Confirmed fresh installs use the schema with `post.deleted` and the legacy removal bundle is not run. Removed concurrent-start protection from scope and accepted migration transaction behavior based on source review.
- 2026-10-21: Inventoried the active migration and documented its replay constraint. Closed the migration inventory and release-immutability policy items; database behavior tests and automated safeguards remain open.
- 2026-10-21: Added failed migration version to health output and documented versioned migration workflow. Migration tests and operational safeguards remain open.
- 2026-10-21: Removed the historical `post.deleted` field removal, added the versioned migration runner and version-table bootstrap, and documented fresh-install scope. Migration tests and operational safeguards remain open.
- 2026-10-21: Raised priority to High and added the active post.deleted field conflict as the first fix, ahead of version tracking.
- 2026-09-28: Ticket created.
