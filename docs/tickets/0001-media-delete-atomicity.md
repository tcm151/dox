# Ticket 0001: Make Image Deletion Atomic

## Status
- State: Blocked
- Priority: High
- Next: Implement direct-cleanup failure/retry tests using the shared harness from Ticket 0054.

## Dependencies
- [0052](0052-image-attachment-ownership-and-refunds.md): Defines ownership, shared-image deletion, and refund rules required before post cleanup integration.
- [0054](0054-general-purpose-automated-test-harness.md): Provides the test infrastructure required for cleanup success and failure/retry coverage.

## Goal
Keep image files, database records, and token refunds consistent across direct image deletion and post deletion. A failed or retried operation must not lose media or refund it twice.

## Requirements
- [x] Deleting an image cannot leave DB and filesystem in conflicting states.
- [ ] Deleting a post uses the same cleanup path instead of deleting image records without removing files.
- [ ] Partial failures can be retried without duplicate refunds or cleanup work.
- [ ] Error responses remain clear and consistent.
- [x] Auth and role checks still enforce current behavior.
- [ ] Tests cover success and partial failure paths.

## Tasks
- [x] Choose strategy (DB-first with a durable mediaTrash cleanup queue).
- [ ] Use the shared cleanup strategy from the image and post delete handlers.
- [ ] Make cleanup and refund retries safe, including when the file is already missing.
- [ ] Add tests for filesystem failure, database failure, retries, and post attachment cleanup.
- [x] Update docs only if runtime behavior changes.

## Notes
- Direct image deletion is being changed to delete the image, refund tokens, and enqueue filesystem cleanup in one database transaction; file removal is deferred to the scheduled worker.
- The direct-delete route calls `trashImage`, and startup schedules `emptyTrash`. Browser verification with a disposable image confirmed upload/publish, deletion with a 178-token refund, and an empty `mediaTrash` query after scheduled cleanup; failure/retry behavior remains unverified.
- Image and post delete routes still authenticate requests and enforce owner/admin authorization; this was confirmed by code inspection, not an unauthorized-request test.
- The direct-delete route currently passes the acting user's ID to `trashImage` for the refund. Preserve Ticket 0052's uploader-based refund rule when sharing this cleanup path with post deletion or administrator actions.
- Post deletion refunds attached images and deletes their records without removing the files.
- [Ticket 0052](0052-image-attachment-ownership-and-refunds.md) covers ownership, shared references, and refund eligibility. This ticket covers cleanup consistency and recovery from partial failure.

## Relevant Files
- server/api/image/[id]/delete.ts
- server/api/post/[id]/delete.ts
- server/utils/mediaCleanup.ts
- server/utils/scheduledTasks.ts
- server/plugins/01.startup.server.ts
- server/plugins/cleanup.ts
- server/assets/migrations/2026.5.3.surql
- server/assets/schema.surql
- server/utils/media.ts
- shared/types/index.ts

## Progress Log
- 2026-10-22: Marked Blocked pending Tickets 0052's media ownership/refund policy and 0054's shared test harness.
- 2026-10-22: Selected DB-first cleanup using a durable mediaTrash table and scheduled processing; added the schema/migration and documented the scheduler lifecycle. Aligned the direct-delete route with `trashImage` and startup with `emptyTrash`; the production build and focused diagnostics pass. Browser verification with a disposable image confirmed upload/publish, deletion with a 178-token refund, and an empty `mediaTrash` query after scheduled cleanup. Failure/retry behavior, post-deletion integration, and retry tests remain; refund-recipient rules still depend on Ticket 0052.
- 2026-10-21: Added post deletion cleanup, retry safety, and the ownership/refund dependency from the application review.
- 2026-04-13: Ticket created.
