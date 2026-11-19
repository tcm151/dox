# Ticket 0115: Distinguish Feed Loading Error And Empty States

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Avoid telling visitors that a community has no content when a feed is still loading or has failed. Give initial failures a clear retry path while retaining loaded content during refreshes.

## Requirements
- [x] Initial pending requests show a meaningful loading state rather than a confirmed-empty message.
- [x] Empty-result messages appear only after a successful load with no visible results.
- [x] Failed initial loads show a clear failure state and an accessible retry action, in addition to existing request-correlated error hints.
- [x] Refreshes preserve existing content, and refresh failures do not replace it with an empty state.
- [x] Successfully loaded content filtered by visibility preferences remains distinguishable from a genuinely empty feed.
- [x] Browser coverage checks initial loading, success-empty, visibility-filtered, initial failure, retry, and refresh failure.

## Tasks
- [x] Trace the existing Feed datasource contract and every caller that adapts it.
- [x] Carry the status and error information needed for accurate result states without introducing a generic application-wide async-state abstraction.
- [x] Add the distinct loading, failure, empty, and retry presentations using existing UI components and classes.
- [x] Add focused feed and search browser coverage with controlled delays and failures.

## Notes
- The inspected shared Feed template renders its empty state whenever visibleItems is empty, without checking whether the request succeeded.
- useDatasource already publishes error hints; the missing behavior is accurate persistent feed presentation, not a claim that requests fail silently.
- This is an actionable follow-up for [0090](0090-core-path-todo-audit.md), not a prerequisite for performing that audit.
- Preserve the loaded-content freshness behavior from [0060](0060-feed-inbox-freshness.md).

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
- 2026-11-19: Added pending, empty, retryable failure, visibility-filtered, and retained-refresh states with focused feed and search browser tests. `yarn test --file feed.browser.test.ts` (3/3) and `yarn test --file search.browser.test.ts` (4/4) passed. `yarn test --browser` passed 40/41; the unrelated topic moderators page test failed at its heading assertion. `yarn typecheck` reported errors in already-modified topic tools pages, which were outside this ticket.
- 2026-11-17: Ticket created from the public-launch source review. Browser and runtime behavior were not verified.
