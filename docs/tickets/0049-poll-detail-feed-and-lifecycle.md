# Ticket 0049: Poll Detail, Feed, and Lifecycle

## Status
- State: Planned
- Priority: Medium
- Next: Define the poll detail and compact preview states for open, answered, closed, and expired polls.

## Dependencies
- [0047](0047-poll-creation-model-and-publishing.md): Detail pages and feed previews need published polls and their lifecycle rules.
- [0048](0048-poll-responses-and-results.md): Poll interactions and result displays need response handling and result calculations.

## Goal
Make polls discoverable and understandable across detail and feed surfaces while exposing complete, authorized closure, deletion, reporting, and result states.

## Requirements
- [ ] Poll detail renders open, answered, closed, expired, empty-result, and unavailable states accessibly.
- [ ] Polls render through `MultiPreview` and appear only in enabled aggregate, topic, and dedicated feed surfaces.
- [ ] Inline and detail responses share mutation and result behavior without stale or contradictory state.
- [ ] Owners and authorized moderators can close or delete polls according to documented lifecycle rules.
- [ ] Reporting and content voting remain distinct from poll response controls.

## Tasks
- [ ] Build the canonical poll detail page and reusable preview and results components.
- [ ] Register poll rendering with `MultiPreview` and applicable feed queries and navigation.
- [ ] Add optimistic response handling with rollback and stale-result refresh behavior.
- [ ] Add explicit close and delete operations with owner and moderator authorization.
- [ ] Wire generic report and content-vote actions separately from answer controls.
- [ ] Validate keyboard interaction, screen-reader labels, narrow layouts, stale responses, missing records, and mixed feeds.

## Notes
- Roadmap C4 calls for expiration and result display states; those states should be visible consistently in compact and full views.

## Relevant Files
- app/components/system/previews/MultiPreview.vue
- app/pages/feed.vue
- server/api/feed/popular.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- docs/Roadmap.md

## Progress Log
- 2026-09-28: Ticket created.
