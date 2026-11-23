# Ticket 0114: Discard Cancelled Inline Content Edits

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make Cancel discard inline post, thread, and comment drafts instead of displaying unsaved text as published content. Keep canonical loaded content separate from editable drafts.

## Requirements
- [x] Starting an inline edit copies the current persisted content into local draft state.
- [x] Cancel exits editing and restores the persisted presentation without issuing a save.
- [x] Reopening an editor after cancellation starts from persisted content, not the abandoned draft.
- [x] A failed save keeps the draft available for retry without changing the displayed canonical record.
- [x] A successful save updates canonical content and edit metadata consistently with the server response or a refresh.
- [x] Browser tests cover cancel, reopen, successful save, and failed save for posts, threads, and comments.

## Tasks
- [x] Replace direct editing of loaded post, thread, and comment content with local drafts.
- [x] Separate start, cancel, and save transitions so cancellation cannot accidentally retain or persist changes.
- [x] Follow the existing isolated draft behavior in link and gallery description editing where applicable.
- [x] Add focused browser regressions for all affected content types.

## Notes
- Post, thread, and comment editors now keep draft content separate from datasource records until the save succeeds.
- Cancel and failed saves leave the persisted presentation unchanged; reopening an editor reloads the current content.
- Preview controls are a separate feature under Ticket 0081; this correctness fix does not require adding previews.

## Relevant Files
- app/pages/post/[id].vue
- app/pages/thread/[id].vue
- app/components/system/previews/CommentPreview.vue
- app/pages/post/components/CommentSection.vue
- app/pages/link/[id].vue
- app/pages/gallery/[id].vue
- tests/parallel/content-edits.browser.test.ts

## Progress Log
- 2026-11-17: Added isolated drafts for posts, threads, and comments. Focused browser coverage passes for cancel without a request, reopening from persisted content, failed-save retry, canonical content, and edited metadata; `yarn.cmd typecheck` passes.
- 2026-11-17: Ticket created from the public-launch source review. Rendered behavior and save/cancel persistence were not verified.
