# Ticket 0030: SurrealDB User Guide

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Create a general-purpose SurrealDB user guide that links to authoritative upstream documentation and records ClassicForum's database configuration and runtime requirements.

## Requirements
- [x] Guide links to upstream documentation for SurrealDB installation, operation, security, and database administration.
- [x] Guide documents ClassicForum's embedded default and remote configuration requirements.
- [x] Guide explains application-specific authentication scope, startup migrations, and health checks.

## Tasks
- [x] Add upstream documentation links for general SurrealDB usage and operations.
- [x] Document ClassicForum-specific database modes, credentials, and startup behavior.
- [x] Link the guide from contribution and architecture docs.

## Notes
- Upstream SurrealDB documentation is the source for general database guidance; this guide records only ClassicForum-specific requirements.
- Live remote database provisioning and connectivity validation remain deployment-specific.

## Relevant Files
- docs/ContributionGuide.md
- docs/Architecture.md
- docs/SurrealDB.md
- server/utils/database.ts
- docs/.env.example

## Progress Log
- 2026-10-25: Renamed and reframed the guide as a general SurrealDB user guide, with upstream references and the application's specific configuration and auth-scope details.
- 2026-10-25: Added the remote operations guide with secure network, credential, health, migration, backup, and troubleshooting guidance; linked it from architecture and contribution docs.
- 2026-04-13: Ticket created.
