# Ticket 0143: Make Topics a Full Feed

## Status
- State: In Progress
- Priority: Medium
- Next: Add a paged topic query that uses the latest activity for New and Hot, and set Hot as the shared feed default.

## Goal
Turn the Topics page from a static list into a sortable, paginated feed using the same controls and result states as the other dedicated feeds.

## Requirements
- [ ] The Topics page renders topic previews in the shared Feed component and loads more topics until the end of the feed.
- [ ] Changing the sort order reloads from the first page, and topics are not duplicated across pages for an unchanged result set.
- [ ] Sortable feeds default to Hot when no sort is selected. Explicit New and Top choices still work, and the UI and API agree on the default.
- [ ] Topics uses the latest item that uses each topic for New and as the age input for Hot. Unused topics appear last in New and Hot. Top ranks by score.
- [ ] The page uses the shared loading, empty, and retryable error states, and existing topic preview actions still refresh the feed when needed.
- [ ] The dedicated Topics page and endpoint still respect the `feeds.topics` setting without changing other topic listings.

## Tasks
- [x] Identify the dedicated Topics endpoint's consumers and its current sort order.
- [x] Confirm the supported sort modes, default order, and where topics without activity appear.
- [ ] Return paged topic results from `/api/feed/topics` using the shared paging helper while preserving the availability check.
- [ ] Replace the manually rendered list with `Feed` and `useFeedDatasource`, keep the preview refresh behavior, and remove the obsolete TODOs.
- [ ] Update the shared client and server defaults to Hot without overriding a selected sort.
- [ ] Add focused API and browser coverage for sorting, loading past the first page, and disabled-feed behavior.

## Notes
- The live handler still returns the unpaged `TopicManager.list()` result. The commented paging sketch is not an implemented contract; preserve the active `canViewFeed("topics")` guard when replacing the handler.
- On `2026.6.6`, a direct visit to `/feed/topics` showed preview cards with no sort controls or Load More button.
- The Topics page is the only application consumer found for `/api/feed/topics`; the availability test checks that endpoint's status. Admin Topics uses `/api/topic`, which shares `TopicManager.list()` and should keep its unpaged response. Keep the new topic selection query in the dedicated feed endpoint and reuse the paging helper for bounds and the response.
- The current topic list orders by score descending, and the shared feeds currently default to New. Change the shared default to Hot for sortable feeds, not just Topics. Keep comment sorting separate.
- The Topics query needs the most recent content timestamp, not `firstUsed`. Use topic IDs to break ties so unchanged results keep their order across pages.
- Keep the existing topic-preview follower count refresh regression. Make sure its fixture is on a visible page once paging is enabled.
- Preserve the dedicated feed availability behavior established in Ticket 0102.

## Relevant Files
- app/pages/feed/topics.vue
- app/pages/feed/posts.vue
- app/components/lists/Feed.vue
- app/utils/feedDatasource.ts
- server/api/feed/topics.ts
- server/api/topic/index.ts
- server/utils/TopicManager.ts
- server/assets/schema.surql
- server/utils/feedPagination.ts
- tests/parallel/feed.browser.test.ts
- tests/parallel/topics.browser.test.ts
- tests/sequential/10-availability.server.test.ts

## Progress Log
- 2026-11-27: Confirmed Hot as the default for all sortable feeds. Topics uses the latest activity for New and Hot, with unused topics last in those modes.
- 2026-11-27: Recorded the read-only production baseline and traced the list consumers. The dedicated feed can change to a paged response without changing the general listing. Sort semantics remain open; no application code changed or tests ran.
- 2026-11-23: Ticket created.
