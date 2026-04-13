# Ticket 0001: Make Image Deletion Atomic

## Status
- State: Todo
- Priority: High
- Next action: Choose implementation strategy

## Goal
Image deletion is currently non-atomic. If file deletion succeeds but the database mutation fails, state can drift.

## Done Looks Like
- [ ] Deleting an image cannot leave DB and filesystem in conflicting states.
- [ ] Error responses remain clear and consistent.
- [ ] Auth and role checks still enforce current behavior.
- [ ] Tests cover success and partial failure paths.

## Tasks
- [ ] Choose strategy (DB-first with retry queue, or rollback-safe file handling).
- [ ] Implement strategy in delete handler and supporting utilities.
- [ ] Add tests for success and partial failure scenarios.
- [ ] Update docs only if runtime behavior changes.

## Notes

## Relevant Files
- [server/api/image/[id]/delete.ts](../../server/api/image/[id]/delete.ts)
- [server/utils/media.ts](../../server/utils/media.ts)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


