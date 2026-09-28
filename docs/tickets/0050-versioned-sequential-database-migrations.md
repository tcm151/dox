# Ticket 0050: Versioned Sequential Database Migrations

## Status
- State: Todo
- Priority: Medium
- Next action: Design the applied-migration ledger and baseline strategy for existing installations.

## Goal
Replace repeated execution of the full migration history with durable version tracking so each database migration runs once, in order, without later edits changing the behavior of already-upgraded instances.

## Done Looks Like
- [ ] Each migration has a stable ordered identifier and is recorded after successful application.
- [ ] Startup runs only unapplied migrations in deterministic sequence.
- [ ] Failed migrations are not marked complete and produce actionable startup health output.
- [ ] Existing installations can adopt the migration ledger without replaying destructive historical migrations.
- [ ] Fresh databases and upgrades follow a documented schema and migration order.
- [ ] Applied migration drift is detected or explicitly prevented.

## Tasks
- [ ] Inventory current migrations and identify statements that are unsafe to replay or reorder.
- [ ] Define a migration ledger containing version, identifier, applied timestamp, and optional checksum.
- [ ] Decide whether migrations remain in one structured source or move into individually numbered files.
- [ ] Define the baseline version and bootstrap procedure for databases created before the ledger exists.
- [ ] Execute pending migrations sequentially with appropriate transaction, failure, and retry behavior.
- [ ] Prevent concurrent application when multiple app processes start against the same database.
- [ ] Expose the current and failed migration versions through startup logs and health diagnostics.
- [ ] Document how contributors add, test, and avoid modifying applied migrations.

## Notes
- The current migrations are generally written to be idempotent, but the complete file runs on every startup after the schema file.
- Editing an older migration can affect databases that previously passed that point, while sequential dependencies are not explicitly recorded.
- Preserve the current straightforward SurrealQL approach; add tracking and execution discipline around it rather than replacing it without need.

## Relevant Files
- server/plugins/01.migrations.server.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/utils/database.ts
- server/utils/health.ts
- docs/Architecture.md

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.