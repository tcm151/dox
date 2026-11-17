# Ticket 0114: Discard Cancelled Inline Content Edits

## Status
- State: Planned
- Priority: Medium
- Next: Add a regression case that edits a post, cancels, and compares displayed content with the server.

## Goal
Make Cancel discard inline post, thread, and comment drafts instead of displaying unsaved text as published content. Keep canonical loaded content separate from editable drafts.

## Requirements
- [ ] Starting an inline edit copies the current persisted content into local draft state.
- [ ] Cancel exits editing and restores the persisted presentation without issuing a save.
- [ ] Reopening an editor after cancellation starts from persisted content, not the abandoned draft.
- [ ] A failed save keeps the draft available for retry without changing the displayed canonical record.
- [ ] A successful save updates canonical content and edit metadata consistently with the server response or a refresh.
- [ ] Browser tests cover cancel, reopen, successful save, and failed save for posts, threads, and comments.

## Tasks
- [ ] Replace direct editing of loaded post, thread, and comment content with local drafts.
- [ ] Separate start, cancel, and save transitions so cancellation cannot accidentally retain or persist changes.
- [ ] Follow the existing isolated draft behavior in link and gallery description editing where applicable.
- [ ] Add focused browser regressions for all affected content types.

## Notes
- The inspected post and thread editors bind directly to their datasource object's content field; Cancel only toggles editing.
- Comment editing similarly mutates comment.content, while Cancel only emits finish-edit.
- This can make cancelled text appear saved locally even though a reload restores the server's original content.
- Preview controls are a separate feature under [0081](backlog/0081-inline-edit-markdown-preview.md); this correctness fix does not require adding previews.

## Relevant Files
- app/pages/post/[id].vue
- app/pages/thread/[id].vue
- app/components/system/previews/CommentPreview.vue
- app/pages/post/components/CommentSection.vue
- app/pages/link/[id].vue
- app/pages/gallery/[id].vue
- tests/parallel/

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. Rendered behavior and save/cancel persistence were not verified.
