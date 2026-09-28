# Ticket 0044: Video Delivery Architecture

## Status
- State: Todo
- Priority: Medium
- Next action: Test representative video files against the current single-process deployment and filesystem media model.

## Goal
Choose and document a video ingestion and playback design that fits OpenForum's deployment model before exposing uploads or committing to a record contract.

## Done Looks Like
- [ ] Supported containers, codecs, maximum size, and validation strategy are documented.
- [ ] The project has an explicit store-as-is versus transcode decision with resource and dependency tradeoffs.
- [ ] Playback delivery defines byte-range, cache, content-type, and private or staged access behavior.
- [ ] Thumbnail, duration, dimensions, token cost, cleanup, and failure recovery responsibilities are assigned.
- [ ] The design identifies abuse controls and deployment requirements for CPU, disk, temporary storage, and request duration.
- [ ] Follow-up implementation tickets have confirmed contracts and no unresolved blocking decisions.

## Tasks
- [ ] Review the image and audio pipelines and the constraints of embedded and remote SurrealDB deployments.
- [ ] Evaluate browser-compatible input formats and whether an external media tool is acceptable for validation or transcoding.
- [ ] Prototype representative uploads and byte-range playback within configured Nitro limits.
- [ ] Define staged upload, publish, cancellation, orphan cleanup, and token-refund state transitions.
- [ ] Define the shared `Video` contract and persistence fields needed by Tickets 0045 and 0046.
- [ ] Update architecture or operational documentation with the selected dependencies and resource assumptions.

## Notes
- The repository currently has only settings and an editor tab for video. There is no editor page, type, table, API, processor, or playback route.
- This ticket is a bounded technical decision, not an open-ended implementation spike.

## Relevant Files
- docs/Architecture.md
- docs/Roadmap.md
- nuxt.config.ts
- package.json
- shared/types/index.ts
- server/utils/media.ts
- server/routes/cdn/audio/[fileName]/index.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.