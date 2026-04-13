# Ticket 0010: Saved Custom Feeds

## Status
- State: Todo
- Priority: Medium
- Next action: Define minimal custom feed filter schema

## Goal
Enable users to save reusable feed presets with filter and sort settings.

## Done Looks Like
- [ ] Users can create, edit, and select saved feed presets.
- [ ] Presets map cleanly to feed query behavior.
- [ ] URL state and selected preset stay in sync.

## Tasks
- [ ] Define preset data model and persistence path.
- [ ] Add feed UI for saving/selecting presets.
- [ ] Apply preset values to feed/search API requests.

## Notes

## Relevant Files
- [app/pages/feed.vue](../../app/pages/feed.vue)
- [app/pages/feed/search.vue](../../app/pages/feed/search.vue)
- [app/utils/cache.ts](../../app/utils/cache.ts)
- [server/api/feed/search.ts](../../server/api/feed/search.ts)

## Progress Log
- 2026-04-13: Ticket created.


