# Ticket 0003: Add Pagination To Home Feed

## Status
- State: In Progress
- Priority: High
- Next: Assert exact sort order and add following-feed pagination coverage.

## Goal
Add paged loading behavior to home feed so users can load more content predictably and avoid heavy single-batch loads.

## Requirements
- [x] Home feed supports load-more pagination.
- [x] API and UI use consistent pagination parameters.
- [ ] Existing sort modes continue to work with pagination.
- [x] Feed queries and responses are bounded server-side, including each content type in a mixed feed.
- [x] Missing or oversized page sizes cannot trigger a full-table response.
- [x] Paging a stable mixed feed does not skip or repeat items across content types.

## Tasks
- [x] Define pagination params for popular and following feed endpoints.
- [x] Apply a default page size and a maximum page size on the server.
- [x] Apply the selected sort order and pagination before loading the complete matching dataset; define a stable tie-breaker across content types.
- [x] Update home feed UI to request additional pages.
- [x] Add basic empty/end-of-list states.
- [ ] Test page-size limits, mixed post/thread/gallery pages, sort modes, and end-of-list behavior.

## Notes
- The shared feed view now pages posts, top-level threads, and galleries before hydrating feed records.
- The sequential test checks page-size bounds, all three popular sort modes, complete mixed-feed traversal without duplicate or missing fixtures, and an exact-full terminal page with `more: false`. It does not assert exact item ordering or following-feed pagination.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- server/api/feed/popular.ts
- server/api/feed/following.ts
- server/utils/feedPagination.ts
- server/assets/schema.surql
- tests/sequential/05-home-feed-pagination.test.ts

## Progress Log
- 2026-10-24: Implemented bounded shared-feed pagination and home-feed load more; mixed post/thread/gallery traversal, page-size limits, and terminal-page checks pass. Exact ordering and following-feed pagination coverage remain.
- 2026-10-21: Added bounded database queries, server-side page-size limits, and mixed-feed ordering checks from the application review.
- 2026-04-13: Ticket created.
