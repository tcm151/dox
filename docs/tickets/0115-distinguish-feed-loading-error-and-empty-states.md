# Ticket 0115: Distinguish Feed Loading Error And Empty States

## Status
- State: Planned
- Priority: Medium
- Next: Add a delayed and failed initial-load case for a dedicated feed.

## Goal
Avoid telling visitors that a community has no content when a feed is still loading or has failed. Give initial failures a clear retry path while retaining loaded content during refreshes.

## Requirements
- [ ] Initial pending requests show a meaningful loading state rather than a confirmed-empty message.
- [ ] Empty-result messages appear only after a successful load with no visible results.
- [ ] Failed initial loads show a clear failure state and an accessible retry action, in addition to existing request-correlated error hints.
- [ ] Refreshes preserve existing content, and refresh failures do not replace it with an empty state.
- [ ] Successfully loaded content filtered by visibility preferences remains distinguishable from a genuinely empty feed.
- [ ] Browser coverage checks initial loading, success-empty, visibility-filtered, initial failure, retry, and refresh failure.

## Tasks
- [ ] Trace the existing Feed datasource contract and every caller that adapts it.
- [ ] Carry the status and error information needed for accurate result states without introducing a generic application-wide async-state abstraction.
- [ ] Add the distinct loading, failure, empty, and retry presentations using existing UI components and classes.
- [ ] Add focused feed and search browser coverage with controlled delays and failures.

## Notes
- The inspected shared Feed template renders its empty state whenever visibleItems is empty, without checking whether the request succeeded.
- useDatasource already publishes error hints; the missing behavior is accurate persistent feed presentation, not a claim that requests fail silently.
- This is an actionable follow-up for [0090](0090-core-path-todo-audit.md), not a prerequisite for performing that audit.
- Preserve the loaded-content freshness behavior from [0060](completed/0060-feed-inbox-freshness.md).

## Relevant Files
- app/components/lists/Feed.vue
- app/utils/data.ts
- app/pages/feed/home.vue
- app/pages/feed/search.vue
- app/pages/feed/
- tests/parallel/feed.browser.test.ts
- tests/parallel/search.browser.test.ts
- tests/parallel/freshness.browser.test.ts

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. Browser and runtime behavior were not verified.
