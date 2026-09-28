# Ticket 0049: Poll Detail, Feed, and Lifecycle

## Status
- State: Todo
- Priority: Medium
- Next action: Define the poll detail and compact preview states for open, answered, closed, and expired polls.

## Goal
Make polls discoverable and understandable across detail and feed surfaces while exposing complete, authorized closure, deletion, reporting, and result states.

## Done Looks Like
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
- Depends on Tickets 0047 and 0048.
- Roadmap C4 calls for expiration and result display states; those states should be visible consistently in compact and full views.

## Relevant Files
- app/components/system/previews/MultiPreview.vue
- app/pages/feed.vue
- server/api/feed/popular.ts
- server/api/report/send.ts
- server/api/vote/[id]/positive.ts
- docs/Roadmap.md

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.