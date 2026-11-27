# Ticket 0145: Load Admin Pin Moderation in One Query

## Status
- State: Planned
- Priority: Medium
- Next: Confirm how pinned threads and galleries match their moderation records by subject ID.

## Goal
Have `GET /api/admin/pin` return pins and their moderation controls from a single database query instead of fetching the controls separately.

## Requirements
- [ ] The admin pin list uses one database query to load both pins and moderation data after authorization.
- [ ] Pinned threads and galleries with a matching moderation record still return its `locked` and `slowed` fields under `item.moderation`.
- [ ] Pins without a matching control and pins of other content types keep their existing response, including post preview truncation.
- [ ] The endpoint remains admin-only, and public and topic-scoped pin endpoints are unchanged.

## Tasks
- [ ] Move the moderation lookup into the admin pin query, preserving the existing `Pin[]` response.
- [ ] Remove the admin endpoint's `attachPinModeration` call and resolved TODO; keep the helper for its other callers.
- [ ] Add focused API coverage for pinned threads and galleries with controls, pins without controls, and unchanged post previews.

## Notes
- `attachPinModeration` currently runs a second query when the result contains a thread or gallery pin. If it finds no matching record for a pin, it leaves that pin unchanged.
- The current admin pin query truncates post content at 1,024 characters. Preserve that limit in the query and regression coverage.
- Scope is limited to listing admin pins. Pin mutations and the shared helper's other callers are out of scope.

## Relevant Files
- server/api/admin/pin/index.ts
- server/utils/pinModeration.ts
- tests/parallel/posts.server.test.ts

## Progress Log
- 2026-11-23: Ticket created.
