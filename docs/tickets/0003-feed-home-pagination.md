# Ticket 0003: Add Pagination To Home Feed

## Status
- State: Planned
- Priority: High
- Next: Decide pagination model (offset/cursor) for /api/feed/*

## Goal
Add paged loading behavior to home feed so users can load more content predictably and avoid heavy single-batch loads.

## Requirements
- [ ] Home feed supports load-more pagination.
- [ ] API and UI use consistent pagination parameters.
- [ ] Existing sort modes continue to work with pagination.
- [ ] Feed queries and responses are bounded server-side, including each content type in a mixed feed.
- [ ] Missing or oversized page sizes cannot trigger a full-table response.
- [ ] Paging a stable mixed feed does not skip or repeat items across content types.

## Tasks
- [ ] Define pagination params for popular and following feed endpoints.
- [ ] Apply a default page size and a maximum page size on the server.
- [ ] Apply the selected sort order and pagination before loading the complete matching dataset; define a stable tie-breaker across content types.
- [ ] Update home feed UI to request additional pages.
- [ ] Add basic empty/end-of-list states.
- [ ] Test page-size limits, mixed post/thread/image pages, sort modes, and end-of-list behavior.

## Notes
- Popular feed currently loads all matching posts, threads, and public images before sorting the combined collection in memory. Following feed is also unbounded.
- Slicing the response after loading every record does not solve the database and application memory costs.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- server/api/feed/popular.ts
- server/api/feed/following.ts

## Progress Log
- 2026-10-21: Added bounded database queries, server-side page-size limits, and mixed-feed ordering checks from the application review.
- 2026-04-13: Ticket created.
