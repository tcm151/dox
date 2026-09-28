# Ticket 0046: Video Authoring, Playback, and Discovery

## Status
- State: Todo
- Priority: Medium
- Next action: Sketch the video editor payload and publication transition on top of Ticket 0045's staged upload contract.

## Goal
Complete the user-facing video workflow from editor metadata and preview through publication, canonical playback, feeds, and moderation actions.

## Done Looks Like
- [ ] The video editor supports upload, title, description, topics, preview, publish, retry, and cancellation states.
- [ ] Published video has a canonical responsive playback page with metadata and accessible controls.
- [ ] Public videos render through `MultiPreview` and appear only in enabled feed surfaces.
- [ ] Staged or disabled video is excluded from public APIs, feeds, and CDN access.
- [ ] Owner and moderator lifecycle actions keep records, primary files, thumbnails, and tokens consistent.

## Tasks
- [ ] Add the missing `/editor/video` page using `EditorFrame` and the staged upload API.
- [ ] Add authenticated publication validation for title, description, topics, and visibility.
- [ ] Build the canonical video page and reusable preview with poster and playback fallback states.
- [ ] Register video with `MultiPreview` and applicable aggregate, topic, and dedicated feed surfaces.
- [ ] Add deletion, reporting, and voting behavior consistent with the selected media lifecycle.
- [ ] Validate keyboard operation, responsive sizing, interrupted playback, missing derivatives, and mixed-feed rendering.

## Notes
- Depends on Tickets 0044 and 0045.
- Rich external video embeds belong with the safe link-preview work in Ticket 0040; this ticket covers hosted video.
- Draft support remains out of scope per completed Ticket 0011.

## Relevant Files
- app/pages/editor.vue
- app/pages/editor/components/EditorFrame.vue
- app/components/system/MediaUploader.vue
- app/components/system/previews/MultiPreview.vue
- app/utils/media.ts
- server/api/feed/popular.ts
- shared/types/index.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.