# Ticket 0148: Verify Remote SurrealDB Backup And Restore

## Status
- State: Planned
- Priority: Medium
- Next: Prepare an isolated remote SurrealDB instance with representative ClassicForum data and record the app and database versions.

## Goal
Verify that an operator can back up a remote SurrealDB database and recover a working ClassicForum instance using the published runbook.

## Requirements
- [ ] An operator follows the remote backup runbook, exports the selected namespace and database, and restores the export into a clean, isolated target.
- [ ] ClassicForum reports both app and database ready against the restored database. A test account can sign in, and representative accounts, topics, and posts match the recorded pre-backup sample.
- [ ] The runbook reflects the verified procedure and documents version compatibility, how to verify the restore before switching traffic, and what the database export does not cover.

## Tasks
- [ ] Seed test records and record the expected schema, migration version, and selected records before export.
- [ ] Export the isolated database, store the backup with restricted access, and import it into a separate test target.
- [ ] Start the matching ClassicForum release against the restored database and compare readiness, login, and sample records against the pre-backup baseline.
- [ ] Record the tested versions, outcome, and any runbook corrections without publishing backup contents or credentials.

## Notes
- This follows Ticket 0127. No pre-upgrade remote backup or record-level before/after comparison was documented for the pilot deployment. This rehearsal does not retroactively verify either.
- Ticket 0118 records earlier isolated recovery evidence. The installer backup is for embedded RocksDB only, and the installer does not create backups on upgrade.
- Use non-production data and infrastructure. This ticket does not authorize any production export, restore, or cutover. A fresh backup and explicit approval are still required before future production upgrades.

## Relevant Files
- docs/Backups.md
- docs/Quickstart.md
- docs/SurrealDB.md
- scripts/installer.sh

## Progress Log
- 2026-11-27: Ticket created. Remote backup and restore validation moved out of the pilot release closure.
