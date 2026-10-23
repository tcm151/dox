# Ticket 0052: Image Attachment Ownership And Refunds

## Status
- State: Planned
- Priority: High
- Next: Add focused integration coverage for ownership, shared images, and uploader refunds.

## Goal
Prevent a post author from deleting another user's images or collecting their upload refund through an attachment. Apply ownership and refund checks on the server, including direct API requests that bypass the editor.

## Requirements
- [ ] Supplying another user's image ID cannot grant deletion rights or a token refund.
- [ ] Attachment handling follows a documented policy for owned images and reuse of existing media.
- [ ] Deleting a post does not remove images still used by other content.
- [ ] Eligible refunds go to the original uploader, not whichever user or administrator initiated deletion.
- [ ] Repeated attachments, deletion retries, and concurrent requests cannot refund an upload more than once.

## Tasks
- [x] Check attachment ownership during post creation and audit other handlers accepting image IDs for the same problem.
- [x] Separate permission to delete a post from permission to delete each attached image.
- [x] Check remaining references before deleting shared media, or prevent reuse if that is the chosen policy.
- [x] Calculate refunds from the stored uploader and upload cost rather than the post author or acting user.
- [ ] Test cross-user attachment requests, shared images, administrator deletion, duplicate IDs, and repeated or concurrent deletion.
- [x] Coordinate record deletion and refund handling with the cleanup strategy in Ticket 0001.

## Notes
- Post, thread, and draft creation accept images owned by the author or marked public.
- Post deletion only removes private images owned by the post author when no other post, thread, or draft references them. Soft-deleted posts retain their images.
- Direct image deletion rejects images still attached to content and refunds the image's stored uploader.
- [Ticket 0001](completed/0001-media-delete-atomicity.md) covers filesystem/database consistency and cleanup retries. This ticket covers which media may be deleted and who receives any refund.

## Relevant Files
- server/api/post/add.ts
- server/api/post/[id]/delete.ts
- server/api/image/[id]/delete.ts
- server/api/thread/add.ts
- server/assets/schema.surql
- server/utils/media.ts
- shared/types/index.ts

## Progress Log
- 2026-10-23: Added shared-reference guards to post and direct image deletion; refund credits use the stored uploader. Focused integration coverage remains.
- 2026-10-23: Added owned-or-public attachment checks for posts, threads, and drafts. Confirmed image publishing already requires uploader ownership.
- 2026-10-21: Ticket created.
