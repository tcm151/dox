# Ticket 0055: Consistent Database Error Mapping

## Status
- State: Planned
- Priority: Low
- Next: Inventory SurrealDB error payloads for expected validation and conflict cases.

## Goal
Map database errors to stable HTTP statuses and safe user-facing messages consistently across API routes. Remove route-specific string matching while preserving useful diagnostics for unexpected failures.

## Requirements
- [ ] Expected validation, authorization, conflict, and missing-record errors map to consistent HTTP statuses.
- [ ] Unexpected database failures remain server errors and do not expose sensitive driver details to clients.
- [ ] API handlers can rely on the centralized mapping instead of parsing database error strings locally.
- [ ] Representative mappings are covered by automated tests.

## Tasks
- [ ] Inventory error payloads produced by the supported SurrealDB client and runtime versions.
- [ ] Define a stable application error classification and HTTP mapping.
- [ ] Centralize the mapping in the database query layer.
- [ ] Remove route-specific database error string matching where centralized handling applies.
- [ ] Add focused tests for expected and unexpected database errors.

## Notes
- `DatabaseQuery.execute()` currently wraps query failures as HTTP 500.
- The image-delete route and post-creation route contain local message matching for expected errors.
- Related cleanup behavior is tracked in [Ticket 0001](completed/0001-media-delete-atomicity.md).

## Relevant Files
- server/utils/database.ts
- server/api/image/[id]/delete.ts
- server/api/post/add.ts

## Progress Log
- 2026-10-23: Ticket created.