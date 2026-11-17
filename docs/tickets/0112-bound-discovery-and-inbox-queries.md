# Ticket 0112: Bound Discovery And Inbox Queries

## Status
- State: In Progress
- Priority: High
- Next: Add continuation controls to the remaining discovery and profile feeds.

## Goal
Avoid loading an entire growing community into application memory for one discovery or inbox request. Extend bounded database-side loading beyond the already-paginated Home feed.

## Requirements
- [x] Dedicated content lists, search, topic feeds, user feeds, and inbox requests have documented server-owned default and maximum result sizes.
- [x] Limits and continuation selection apply in the database before complete matching records are hydrated or transferred; fetching all records and slicing in JavaScript does not satisfy the requirement.
- [x] Sorting, personal filters, publication visibility, and profile audience checks apply before page selection, with deterministic tie-breakers.
- [ ] Clients can load subsequent results without losing previously loaded content and show a correct end-of-data state.
- [x] The inbox badge reads `total` from a bounded notification page; requests do not load all notifications merely to compute total.
- [ ] Tests verify the documented exact bounds, oversized and invalid inputs, filtering before limits, ordering, and continuation behavior across mixed result types.

## Tasks
- [x] Inventory affected API response shapes, list consumers, and existing pagination helpers before selecting contracts.
- [x] Move collection sorting and page selection into bounded database queries.
- [x] Bound search result hydration while retaining cross-type ranking and combined filters.
- [x] Separate inbox counting from bounded notification retrieval.
- [ ] Wire continuation controls to each affected client and update related tests.
- [x] Document pagination contracts and the consistency guarantees of the chosen continuation strategy.

## Notes
- Dedicated content lists, search, topic feeds, and user feeds now select bounded candidates before hydrating results; continuation controls remain for the other clients.
- Notifications now share the `FeedPage` items/pageSize/offset/more contract and include the total matching count; the inbox badge requests a one-item page.
- Completed [0003](completed/0003-feed-home-pagination.md) bounds Home feeds, not these other lists. Preserve its documented offset-pagination tradeoffs unless deliberately changing that contract.
- Use the existing offset continuation style with a server default of 20 items, maximum of 50, offset default of 0, and maximum offset of 5,000,000. Pages are independent reads; clients append and de-duplicate by record ID, but content changes between requests may shift later offsets.
- [0075](backlog/0075-thread-append-pagination-server-limits.md) separately covers direct-reply breadth and reply-chain continuation on thread detail pages; do not duplicate that scope.
- Coordinate personal filtering with [0111](completed/0111-apply-personal-filters-to-dedicated-feeds.md). This review establishes source-level scaling exposure, not a measured runtime denial-of-service result.

## Relevant Files
- server/api/post/index.ts
- server/api/thread/index.ts
- server/api/gallery/index.ts
- server/api/link/index.ts
- server/api/feed/search.ts
- server/api/topic/[topic]/feed.ts
- server/api/user/[id]/feed.ts
- server/api/profile/notifications/index.ts
- server/utils/feedPagination.ts
- app/pages/feed/
- app/pages/inbox.vue
- shared/types/index.ts
- tests/sequential/09-feeds.server.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Bounded candidate selection and hydration across dedicated/mixed feeds and search, documented the shared pagination contract, and added explicit expected first-item assertions for new/hot/top. `yarn test --sequential` passed (31/31); `yarn typecheck` and `git diff --check` passed. Remaining feed clients still need continuation controls.
- 2026-11-17: Began inventorying list handlers and consumers; selected the existing offset-based FeedPage contract as the baseline.
- 2026-11-17: Migrated notifications to the shared FeedPage contract with bounded offset queries and a separate total count.
- 2026-11-17: Ticket created from the public-launch source review. Query execution and performance were not verified.
