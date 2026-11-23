# Ticket 0143: Make Topics a Full Feed

## Status
- State: Planned
- Priority: Medium
- Next: Identify consumers of `/api/feed/topics` before changing its response from a list to a paged result.

## Goal
Turn the Topics page from a static list into a sortable, paginated feed using the same controls and result states as the other dedicated feeds.

## Requirements
- [ ] The Topics page renders topic previews in the shared Feed component and loads more topics until the end of the feed.
- [ ] Changing the sort order reloads from the first page, and topics are not duplicated across pages for an unchanged result set.
- [ ] The page uses the shared loading, empty, and retryable error states, and existing topic preview actions still refresh the feed when needed.
- [ ] The dedicated Topics page and endpoint still respect the `feeds.topics` setting without changing other topic listings.

## Tasks
- [ ] Check existing endpoint consumers and confirm the supported topic sort modes and default order.
- [ ] Return paged topic results from `/api/feed/topics` using the shared paging helper while preserving the availability check.
- [ ] Replace the manually rendered list with `Feed` and `useFeedDatasource`, keep the preview refresh behavior, and remove the obsolete TODOs.
- [ ] Add focused API and browser coverage for sorting, loading past the first page, and disabled-feed behavior.

## Notes
- The current page fetches a topic array in one request. The TODOs in the page and endpoint outline a move to the shared feed and paging patterns.
- Preserve the dedicated feed availability behavior established in Ticket 0102.

## Relevant Files
- app/pages/feed/topics.vue
- app/pages/feed/posts.vue
- app/components/lists/Feed.vue
- app/utils/feedDatasource.ts
- server/api/feed/topics.ts
- server/utils/feedPagination.ts
- tests/parallel/feed.browser.test.ts
- tests/sequential/10-feed-availability.server.test.ts

## Progress Log
- 2026-11-23: Ticket created.
