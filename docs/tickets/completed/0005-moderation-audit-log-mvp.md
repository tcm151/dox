# Ticket 0005: Add Moderation Audit Log MVP

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Track core moderation actions with enough detail to support accountability and review.

## Requirements
- [x] Core moderation actions produce audit records.
- [x] Audit records include actor, action, target, and timestamp.
- [x] Admin-only audit view is available.

## Tasks
- [x] Define audit event structure in shared/server contracts.
- [x] Record events from key moderation write endpoints.
- [x] Add an admin-only list view for recent audit events.

## Notes
- The audit view is intentionally admin-only; the read endpoint enforces the role server-side.

## Relevant Files
- app/pages/admin.vue
- app/pages/admin/logs.vue
- server/api/admin/logs/moderator.ts
- tests/parallel/moderation.server.test.ts
- shared/types/index.ts
- server/assets/migrations/2026.6.1.surql

## Progress Log
- 2026-10-27: Added the admin-only expandable audit view; authorization, moderation event coverage, tests, and production build verified.
- 2026-04-13: Ticket created.