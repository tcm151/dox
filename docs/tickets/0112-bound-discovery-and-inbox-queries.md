# Ticket 0112: Bound Discovery And Inbox Queries

## Status
- State: Planned
- Priority: High
- Next: Inventory list consumers and define server-owned page defaults, maximums, and continuation contracts.

## Goal
Avoid loading an entire growing community into application memory for one discovery or inbox request. Extend bounded database-side loading beyond the already-paginated Home feed.

## Requirements
- [ ] Dedicated content lists, search, topic feeds, user feeds, and positive-amount inbox requests have documented server-owned default and maximum result sizes.
- [ ] Limits and continuation selection apply in the database before complete matching records are hydrated or transferred; fetching all records and slicing in JavaScript does not satisfy the requirement.
- [ ] Sorting, personal filters, publication visibility, and profile audience checks apply before page selection, with deterministic tie-breakers.
- [ ] Clients can load subsequent results without losing previously loaded content and show a correct end-of-data state.
- [ ] The inbox badge retains its count-only amount=0 behavior; positive requests do not load all notifications merely to compute total.
- [ ] Tests verify the documented exact bounds, oversized and invalid inputs, filtering before limits, ordering, and continuation behavior across mixed result types.

## Tasks
- [ ] Inventory affected API response shapes, list consumers, and existing pagination helpers before selecting contracts.
- [ ] Move collection sorting and page selection into bounded database queries.
- [ ] Bound search result hydration while retaining cross-type ranking and combined filters.
- [ ] Separate inbox counting from bounded notification retrieval.
- [ ] Wire continuation controls to each affected client and update related tests.
- [ ] Document pagination contracts and the consistency guarantees of the chosen continuation strategy.

## Notes
- Dedicated post, thread, gallery, and link lists and the inspected topic, profile, and search queries return all matches.
- For positive amounts, the notification handler loads all matching records and only then slices the array.
- Completed [0003](completed/0003-feed-home-pagination.md) bounds Home feeds, not these other lists. Preserve its documented offset-pagination tradeoffs unless deliberately changing that contract.
- [0075](backlog/0075-thread-append-pagination-server-limits.md) separately covers direct-reply breadth and reply-chain continuation on thread detail pages; do not duplicate that scope.
- Coordinate personal filtering with [0111](0111-apply-personal-filters-to-dedicated-feeds.md). This review establishes source-level scaling exposure, not a measured runtime denial-of-service result.

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
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. Query execution and performance were not verified.
