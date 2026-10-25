# Ticket 0024: Backup And Restore Runbook

## Status
- State: In Progress
- Priority: High
- Next: Test the backup and restore procedure on the live Linux VPS using an isolated target.

## Goal
Document practical backup/restore steps so operators can recover service and data safely.

## Requirements
- [x] Runbook exists for embedded mode backup and restore.
- [x] Runbook includes verification steps after restore.
- [x] Failure scenarios and rollback guidance are included.

## Tasks
- [x] Write backup/restore procedure for embedded SurrealDB profile.
- [x] Add remote mode section with caveats and prerequisites.
- [ ] Validate the backup and restore procedure on a live Linux deployment using an isolated target.

## Notes
- The embedded procedure assumes the packaged quickstart layout; deployments with custom paths must adapt the archive commands.
- Remote import may partially apply before an error; use a clean restore target or a verified pre-restore backup.

## Relevant Files
- docs/Backups.md
- docs/Quickstart.md
- docs/SurrealDB.md
- docs/ContributionGuide.md
- docs/.env.example
- server/plugins/01.migrations.server.ts

## Progress Log
- 2026-10-25: Renamed the runbook to `docs/Backups.md`; live Linux deployment validation using an isolated target remains.
- 2026-10-25: Drafted the embedded and remote backup/restore runbook, linked it from deployment docs, and deferred completion until an isolated Linux VPS dry run.
- 2026-04-13: Ticket created.
