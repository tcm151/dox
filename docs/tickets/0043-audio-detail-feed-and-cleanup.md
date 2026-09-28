# Ticket 0043: Audio Detail, Feed, and Cleanup

## Status
- State: Todo
- Priority: Medium
- Next action: Define the public audio query shape shared by detail and preview rendering.

## Goal
Make published audio playable and discoverable while providing complete owner and moderator lifecycle behavior for both database records and stored files.

## Done Looks Like
- [ ] Published audio has a canonical detail page with an accessible player, metadata, topics, author, and engagement actions.
- [ ] Public audio renders through `MultiPreview` and appears only in enabled feed surfaces.
- [ ] Private staged audio is not returned by public list, detail, feed, or CDN requests.
- [ ] Authorized deletion removes both the record and file with correct token accounting and recoverable failure behavior.
- [ ] Missing files and unsupported playback states produce clear non-destructive errors.

## Tasks
- [ ] Add a public audio detail query and tighten the existing list query around publication visibility.
- [ ] Build the audio detail page and reusable feed preview.
- [ ] Register audio with `MultiPreview` and applicable aggregate, topic, and dedicated feed surfaces.
- [ ] Add owner and moderator deletion using the atomic media cleanup pattern established by Ticket 0001.
- [ ] Wire generic reporting and voting after verifying their authorization and schema assumptions for audio records.
- [ ] Validate range or cache behavior required for reliable browser audio playback.
- [ ] Cover private-media access, deletion failure, missing file, mixed feed, and playback fallback cases.

## Notes
- Depends on Ticket 0042 and on the reusable consistency approach from Ticket 0001.
- The existing audio list endpoint does not filter publication state and returns only raw upload fields.

## Relevant Files
- app/components/system/previews/MultiPreview.vue
- app/pages/feed/audio.vue
- server/api/audio/index.ts
- server/api/feed/popular.ts
- server/routes/cdn/audio/[fileName]/index.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.