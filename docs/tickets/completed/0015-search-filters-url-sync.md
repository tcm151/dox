# Ticket 0015: Search Filters With URL Sync

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Add practical search filters and keep filter state synchronized in the URL for shareable queries.

## Requirements
- [x] Search supports type, topic, author, and inclusive date-range filters, individually and in combination.
- [x] The search URL reflects the active text and filter values, and refresh/back/forward restore that search context.
- [x] Returning to any feed page with Back restores that feed route's scroll position.
- [x] Invalid filter values receive a clear validation error.

## Tasks
- [x] Validate type, topic, author, and date query parameters and apply them to search results.
- [x] Build search filter controls and synchronize submitted search state with the URL.
- [x] Preserve and restore scroll position per feed route when navigating away and returning with Back.
- [x] Add focused API and browser coverage for combined filters, URL history, and feed scroll restoration.

## Notes
- This ticket establishes the filter and query-string contract for saved presets in Ticket 0010.
- Type filtering covers the current search result types: posts, threads, galleries, and comments. Date boundaries use UTC calendar days.

## Relevant Files
- app/pages/feed/search.vue
- app/pages/feed.vue
- app/plugins/directives.ts
- server/api/feed/search.ts
- server/utils/DatabaseQuery.ts
- docs/API.md
- tests/parallel/search.server.test.ts
- tests/parallel/search.browser.test.ts

## Progress Log
- 2026-11-16: Added route and feed transition waits before checking Back-navigation scroll restoration. The focused search browser spec passed 2 tests; the full suite still has intermittent browser failures under concurrency.
- 2026-11-15: Reviewed the implementation with no findings. Typecheck, focused API/browser tests, and one full suite run passed (187/187); a later full run timed out at the 5-second limit in the unrelated `09-feeds.server.test.ts` feed-pagination test.
- 2026-11-15: Started implementation with type, topic, author, and date filters plus Back-based scroll restoration for all feed pages.
- 2026-04-13: Ticket created.
