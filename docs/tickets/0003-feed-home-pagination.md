# Ticket 0003: Add Pagination To Home Feed

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Add paged loading behavior to home feed so users can load more content predictably and avoid heavy single-batch loads.

## Requirements
- [x] Home feed supports load-more pagination.
- [x] API and UI use consistent pagination parameters.
- [x] Existing sort modes continue to work with pagination.
- [x] Feed queries and responses are bounded server-side, including each content type in a mixed feed.
- [x] Missing or oversized page sizes cannot trigger a full-table response.
- [x] Pages are bounded and deterministically ordered for each request; content changes between offset requests may cause repeats or omissions.

## Tasks
- [x] Define pagination params for popular and following feed endpoints.
- [x] Apply a default page size and a maximum page size on the server.
- [x] Apply the selected sort order and pagination before loading the complete matching dataset; define a stable tie-breaker across content types.
- [x] Update home feed UI to request additional pages.
- [x] Add basic empty/end-of-list states.
- [x] Test page-size limits, mixed post/thread/gallery pages, sort modes, and end-of-list behavior.

## Notes
- The shared feed view pages posts, top-level threads, and galleries before hydrating feed records.
- Offset pagination does not provide snapshot consistency. Inserts, deletions, or sort-field changes between requests may cause items to repeat or be omitted.
- Tests use unchanged fixtures to verify deterministic per-request ordering, bounded pages, following-topic filtering, and end-of-list metadata; they do not promise continuity across concurrent feed changes.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- server/api/feed/popular.ts
- server/api/feed/following.ts
- server/utils/feedPagination.ts
- server/assets/schema.surql
- tests/sequential/05-home-feed-pagination.test.ts

## Progress Log
- 2026-10-24: Clarified offset pagination's non-snapshot tradeoff and completed controlled sort-order, following-topic pagination, score, bounds, and stable-fixture end-of-list coverage.
- 2026-10-24: Implemented bounded shared-feed pagination and home-feed load more; mixed post/thread/gallery traversal, page-size limits, and terminal-page checks pass. Exact ordering and following-feed pagination coverage remain.
- 2026-10-21: Added bounded database queries, server-side page-size limits, and mixed-feed ordering checks from the application review.
- 2026-04-13: Ticket created.
