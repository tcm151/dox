# Ticket 0001: Make Image Deletion Atomic

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0052](0052-image-attachment-ownership-and-refunds.md): Defines image ownership, shared-reference, and refund rules used by post cleanup.
- [0054](0054-general-purpose-automated-test-harness.md): Provides the shared harness for deferred cleanup coverage.

## Goal
Keep image files, database records, and token refunds consistent across direct image deletion and post deletion. A failed or retried operation must not lose media or refund it twice.

## Requirements
- [x] Deleting an image cannot leave DB and filesystem in conflicting states.
- [x] Deleting a post uses the same cleanup path instead of deleting image records without removing files.
- [x] Partial failures can be retried without duplicate refunds or cleanup work.
- [ ] Error responses remain clear and consistent.
- [x] Auth and role checks still enforce current behavior.
- [ ] Tests cover success and partial failure paths.

## Tasks
- [x] Choose strategy (DB-first with a durable mediaTrash cleanup queue).
- [x] Use the shared cleanup strategy from the image and post delete handlers.
- [x] Make cleanup and refund retries safe, including when the file is already missing.
- [ ] Add tests for filesystem failure, database failure, retries, and post attachment cleanup.
- [x] Update docs only if runtime behavior changes.

## Notes
- Direct image deletion atomically deletes the image record, refunds its stored uploader, and enqueues filesystem cleanup. File removal is deferred to the scheduled worker.
- The direct-delete route calls `trashImage`, and startup schedules `emptyTrash`.
- `trashImage` only refunds and creates a queue row when it successfully deletes an image record. The worker tolerates missing files and removes the queue row only after file removal succeeds.
- Post deletion queues eligible image files for the same scheduled `mediaTrash` cleanup used by direct image deletion.
- Retry behavior was reviewed in code but not covered by automated tests. Tests were deferred per user request.
- Clear and consistent error mapping is tracked separately in [Ticket 0055](../0055-consistent-database-error-mapping.md).
- [Ticket 0052](0052-image-attachment-ownership-and-refunds.md) covers ownership, shared references, and refund eligibility.

## Relevant Files
- server/api/image/[id]/delete.ts
- server/api/post/[id]/delete.ts
- server/utils/mediaCleanup.ts
- server/utils/scheduledTasks.ts
- server/plugins/01.startup.server.ts
- server/plugins/cleanup.ts
- server/assets/migrations/2026.6.0.surql
- server/assets/schema.surql
- server/utils/media.ts
- shared/types/index.ts

## Progress Log
- 2026-10-23: Closed after cleanup queue integration and code review of retry behavior. Automated failure/retry tests remain deferred by request; error mapping moved to Ticket 0055.
- 2026-10-23: Reviewed retry behavior: record deletion, uploader refund, and queue insertion share one transaction; filesystem cleanup tolerates missing files and retains queue records after failures. Tests remain deferred.
- 2026-10-23: Post deletion now enqueues each eligible image in mediaTrash, coordinating record deletion and refunds with the direct-image cleanup pipeline. Failure/retry coverage remains open.
- 2026-10-22: Marked Blocked pending Tickets 0052's media ownership/refund policy and 0054's shared test harness.
- 2026-10-22: Selected DB-first cleanup using a durable mediaTrash table and scheduled processing; added the schema/migration and documented the scheduler lifecycle. Aligned the direct-delete route with `trashImage` and startup with `emptyTrash`; the production build and focused diagnostics pass. Browser verification with a disposable image confirmed upload/publish, deletion with a 178-token refund, and an empty `mediaTrash` query after scheduled cleanup. Failure/retry behavior, post-deletion integration, and retry tests remain; refund-recipient rules still depend on Ticket 0052.
- 2026-10-21: Added post deletion cleanup, retry safety, and the ownership/refund dependency from the application review.
- 2026-04-13: Ticket created.