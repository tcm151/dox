# Ticket 0001: Make Image Deletion Atomic

## Status
- State: Planned
- Priority: High
- Next: Choose a cleanup strategy shared by direct image deletion and post deletion.

## Goal
Keep image files, database records, and token refunds consistent across direct image deletion and post deletion. A failed or retried operation must not lose media or refund it twice.

## Requirements
- [ ] Deleting an image cannot leave DB and filesystem in conflicting states.
- [ ] Deleting a post uses the same cleanup path instead of deleting image records without removing files.
- [ ] Partial failures can be retried without duplicate refunds or cleanup work.
- [ ] Error responses remain clear and consistent.
- [ ] Auth and role checks still enforce current behavior.
- [ ] Tests cover success and partial failure paths.

## Tasks
- [ ] Choose strategy (DB-first with retry queue, or rollback-safe file handling).
- [ ] Use the shared cleanup strategy from the image and post delete handlers.
- [ ] Make cleanup and refund retries safe, including when the file is already missing.
- [ ] Add tests for filesystem failure, database failure, retries, and post attachment cleanup.
- [ ] Update docs only if runtime behavior changes.

## Notes
- Direct image deletion removes the file before updating the database. A database failure leaves a record pointing at a missing file.
- Post deletion refunds attached images and deletes their records without removing the files.
- [Ticket 0052](0052-image-attachment-ownership-and-refunds.md) covers ownership, shared references, and refund eligibility. This ticket covers cleanup consistency and recovery from partial failure.

## Relevant Files
- server/api/image/[id]/delete.ts
- server/api/post/[id]/delete.ts
- server/utils/media.ts
- shared/types/index.ts

## Progress Log
- 2026-10-21: Added post deletion cleanup, retry safety, and the ownership/refund dependency from the application review.
- 2026-04-13: Ticket created.
