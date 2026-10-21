# Ticket 0050: Versioned Sequential Database Migrations

## Status
- State: Planned
- Priority: High
- Next: Correct the historical migration that removes the active post.deleted field.

## Goal
Correct migrations that conflict with the current schema, then add version tracking so each migration runs once, in order. Previously upgraded databases should not change because an old migration was edited or replayed.

## Requirements
- [ ] Startup preserves the current `post.deleted` field and soft deletion works after fresh and repeated startup.
- [ ] Each migration has a stable ordered identifier and is recorded after successful application.
- [ ] Startup runs only unapplied migrations in deterministic sequence.
- [ ] Failed migrations are not marked complete and produce actionable startup health output.
- [ ] Existing installations can adopt the migration ledger without replaying destructive historical migrations.
- [ ] Fresh databases and upgrades follow a documented schema and migration order.
- [ ] Applied migration drift is detected or explicitly prevented.

## Tasks
- [ ] Correct `REMOVE FIELD IF EXISTS deleted ON TABLE post` in the historical comment-deletion migration and check existing installations for affected records.
- [ ] Test that `post.deleted` remains defined and writable after fresh, upgrade, and repeated startup, including deletion of a post with comments.
- [ ] Inventory current migrations and identify statements that are unsafe to replay or reorder.
- [ ] Define a migration ledger containing version, identifier, applied timestamp, and optional checksum.
- [ ] Decide whether migrations remain in one structured source or move into individually numbered files.
- [ ] Define the baseline version and bootstrap procedure for databases created before the ledger exists.
- [ ] Execute pending migrations sequentially with appropriate transaction, failure, and retry behavior.
- [ ] Prevent concurrent application when multiple app processes start against the same database.
- [ ] Expose the current and failed migration versions through startup logs and health diagnostics.
- [ ] Document how contributors add, test, and avoid modifying applied migrations.

## Notes
- The complete migration file runs on every startup after the schema file. It currently removes `post.deleted` even though the schema defines it and the post delete handler sets it.
- Fixing that field conflict does not need to wait for the migration ledger. Review affected data before deciding whether a repair migration is needed.
- Editing an older migration can affect databases that previously passed that point, while sequential dependencies are not explicitly recorded.
- Preserve the current straightforward SurrealQL approach; add tracking and execution discipline around it rather than replacing it without need.

## Relevant Files
- server/plugins/01.migrations.server.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/api/post/[id]/delete.ts
- server/utils/database.ts
- server/utils/health.ts
- docs/Architecture.md

## Progress Log
- 2026-10-21: Raised priority to High and added the active post.deleted field conflict as the first fix, ahead of migration-ledger work.
- 2026-09-28: Ticket created.
