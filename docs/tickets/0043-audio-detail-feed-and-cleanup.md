# Ticket 0043: Audio Detail, Feed, and Cleanup

## Status
- State: Planned
- Priority: Medium
- Next: Define the public audio query shape shared by detail and preview rendering.

## Dependencies
- [0001](0001-media-delete-atomicity.md): Audio deletion must use the shared media cleanup and retry approach.
- [0042](0042-audio-publication-lifecycle.md): Playback, discovery, and deletion need the audio publication model and file state.

## Goal
Make published audio playable and discoverable while providing complete owner and moderator lifecycle behavior for both database records and stored files.

## Requirements
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
- 2026-09-28: Ticket created.
