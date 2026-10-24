# Ticket 0050: Versioned Sequential Database Migrations

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Keep migrations compatible with the fresh schema and supported database upgrades, and run versioned changes in order. Importing databases older than the previous supported schema remains out of scope.

## Requirements
- [x] Fresh installs retain `post.deleted`; the former destructive migration is no longer in the install path.
- [x] Each versioned migration has an ordered identifier and records it in its transaction.
- [x] Startup applies only newer migrations in deterministic order.
- [x] Failed migrations are transactional and their attempted versions are exposed through startup health diagnostics.
- [x] Fresh installs use the schema as their baseline; the consolidated release migration upgrades the previous supported schema directly.
- [x] Fresh install and migration order are documented.
- [x] Recent migrations can be safely replayed, and refreshing their version marker lets startup apply only the later suffix; automated drift detection remains open.

## Tasks
- [x] Remove the former monolithic migration bundle containing `REMOVE FIELD IF EXISTS deleted ON TABLE post` from the install path.
- [x] Confirm `schema.surql` defines `post.deleted` and the current runner does not execute the legacy field-removal migration.
- [x] Inventory current migrations and identify statements that are unsafe to replay or reorder.
- [x] Define a migration version table with version and applied timestamp.
- [x] Move active migrations to individually versioned files.
- [x] Define the fresh-install baseline in `schema.surql`.
- [x] Apply pending migration files sequentially; each file records its version in its transaction.
- [x] Expose the failed migration version through startup health diagnostics.
- [x] Document how contributors add, test, replay, and revise recent migrations.

## Notes
- Use versioned files under `server/assets/migrations/`, grouping related database changes that ship together into one release migration.
- Each migration records its version and commits it with its changes in one transaction.
- Fresh installs use `schema.surql` and record the current app version as the baseline.
- The `2026.6.0` migration is validated against the previous supported schema, including a database without migration metadata. Importing databases older than that schema remains out of scope.
- Do not restore the former monolithic `migrations.surql` bundle; the fresh schema and versioned migration files are the supported paths.
- `schema.surql` defines `post.deleted`, and post deletion sets it when comments must be retained. The former monolithic bundle containing its removal was deleted from the install path.
- Migration version markers use an upsert with a fresh timestamp. Replaying a recent migration moves the current version back so startup applies only the later suffix.
- Unreleased migration changes may be consolidated into the current release migration. Once deployed, leave a migration unchanged and add later changes under the next release version.
- The `2026.6.0` release consolidated the previously pending `2026.5.2`–`2026.5.4` migration work into one migration.
- Fresh and repeated embedded startups were verified against a disposable test database: the schema baseline completed, the second startup read version `2026.5.2` from the migration record, `/api/health` reported `app` and `database` as `ready`, and `/feed` returned HTTP 200. No pending versioned migration was available to exercise.
- Failure handling was accepted by source review: each migration and its version insert run in one transaction; on an execution error the runner reports the attempted version, and startup marks the app failed. No forced failure was injected.
- Automated drift detection is open; no release-immutability check is enforced. Concurrent migration execution is out of scope.

## Relevant Files
- server/plugins/01.startup.server.ts
- server/middleware/00.startup.ts
- server/utils/migrations.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.0.surql
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
