# Ticket 0052: Image Attachment Ownership And Refunds

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Prevent a post author from deleting another user's images or collecting their upload refund through an attachment. Apply ownership and refund checks on the server, including direct API requests that bypass the editor.

## Requirements
- [x] Supplying another user's image ID cannot grant deletion rights or a token refund.
- [x] Attachment handling follows a documented policy for owned images and reuse of existing media.
- [x] Deleting a post does not remove images still used by other content.
- [x] Eligible refunds go to the original uploader, not whichever user or administrator initiated deletion.
- [x] Repeated attachments, deletion retries, and concurrent requests cannot refund an upload more than once.

## Tasks
- [x] Check attachment ownership during post creation and audit other handlers accepting image IDs for the same problem.
- [x] Separate permission to delete a post from permission to delete each attached image.
- [x] Check remaining references before deleting shared media, or prevent reuse if that is the chosen policy.
- [x] Calculate refunds from the stored uploader and upload cost rather than the post author or acting user.
- [ ] Test cross-user attachment requests, shared images, administrator deletion, duplicate IDs, and repeated or concurrent deletion.
- [x] Coordinate record deletion and refund handling with the cleanup strategy in Ticket 0001.

## Notes
- Posts, threads, and drafts may attach images owned by the author or marked public; all three creation routes validate and create in one database execution.
- Post deletion only removes private images owned by the post author when no other post, thread, or draft references them. Soft-deleted posts retain their images.
- Direct image deletion rejects images still attached to content and refunds the image's stored uploader.
- `DELETE ONLY` gates refund and queue creation on successful record deletion, preventing repeated deletion from refunding twice.
- The single-refund and concurrent-request requirement is supported by transaction and delete-result checks, but concurrency behavior is not runtime-verified.
- Automated tests were deferred per user request; completion is based on code review and diagnostics, not runtime test coverage.
- [Ticket 0001](0001-media-delete-atomicity.md) covers filesystem/database consistency and cleanup retries.

## Relevant Files
- server/api/post/add.ts
- server/api/post/[id]/delete.ts
- server/api/thread/add.ts
- server/api/profile/drafts/add.ts
- server/api/image/[id]/delete.ts
- server/utils/mediaCleanup.ts
- server/assets/schema.surql

## Progress Log
- 2026-10-23: Closed after reviewing ownership, shared-reference, atomic attachment, and uploader-refund behavior. Automated tests remain deferred per request.
- 2026-10-23: Added shared-reference guards to post and direct image deletion; refund credits use the stored uploader. Focused integration coverage remains.
- 2026-10-23: Added owned-or-public attachment checks for posts, threads, and drafts. Confirmed image publishing already requires uploader ownership.
- 2026-10-21: Ticket created.