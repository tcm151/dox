# Ticket 0024: Backup And Restore Runbook

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Document practical backup/restore steps so operators can recover service and data safely.

## Requirements
- [x] Runbook exists for embedded mode backup and restore.
- [x] Runbook includes verification steps after restore.
- [x] Failure scenarios and rollback guidance are included.
- [x] Installer creates a permission-restricted, checksummed archive of only the configured embedded database directory and refuses remote mode.
- [x] Restore a database-only archive into an isolated WSL deployment copy and verify app/database readiness.

## Tasks
- [x] Write backup/restore procedure for embedded SurrealDB profile.
- [x] Add remote mode section with caveats and prerequisites.
- [x] Add and test the installer backup command against an isolated WSL deployment copy.
- [x] Restore and verify the backup in an isolated WSL deployment copy; production testing is out of scope.

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
- 2026-10-25: Narrowed installer backups to the configured RocksDB directory only; media and `.env` are excluded. WSL verification remains isolated from the persistent fixture and VPS.
- 2026-10-25: Added the installer `backup` command. In WSL it created a permission-restricted archive and checksum from an isolated restored database; checksum matched, archive contents were verified, and remote mode refused with guidance.
- 2026-10-25: Validated the packaged Linux restore in Ubuntu 24.04 WSL using an isolated copy of the embedded database and a separate test environment. Health reported app/database ready, the listener was loopback-only, and the root route returned HTTP 200 after redirecting to `/feed`.
- 2026-10-25: Renamed the runbook to `docs/Backups.md`. Completion uses isolated WSL validation; production deployment testing is intentionally out of scope.
- 2026-10-25: Drafted the embedded and remote backup/restore runbook and linked it from deployment docs; Linux-host testing was initially considered and later excluded from scope.
- 2026-04-13: Ticket created.