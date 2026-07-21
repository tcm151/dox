# Ticket 0015: Search Filters With URL Sync

## Status
- State: Todo
- Priority: Medium
- Next action: Pick initial filter set for first release

## Goal
Add practical search filters and keep filter state synchronized in the URL for shareable queries.

## Done Looks Like
- [ ] Search supports initial filter set (type/topic/user/date or subset).
- [ ] URL query string reflects active search state.
- [ ] Refresh/back/forward preserve search context.

## Tasks
- [ ] Define filter schema and query params.
- [ ] Update search API handling for new filters.
- [ ] Build UI controls and URL state synchronization.

## Notes

## Relevant Files
- app/pages/feed/search.vue
- app/pages/feed.vue
- app/utils/cache.ts
- server/api/feed/search.ts

## Progress Log
- 2026-04-13: Ticket created.


