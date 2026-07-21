# Ticket 0003: Add Pagination To Home Feed

## Status
- State: Todo
- Priority: High
- Next action: Decide pagination model (offset/cursor) for /api/feed/*

## Goal
Add paged loading behavior to home feed so users can load more content predictably and avoid heavy single-batch loads.

## Done Looks Like
- [ ] Home feed supports load-more pagination.
- [ ] API and UI use consistent pagination parameters.
- [ ] Existing sort modes continue to work with pagination.

## Tasks
- [ ] Define pagination params for popular and following feed endpoints.
- [ ] Update home feed UI to request additional pages.
- [ ] Add basic empty/end-of-list states.

## Notes

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- server/api/feed/popular.ts
- server/api/feed/following.ts

## Progress Log
- 2026-04-13: Ticket created.


