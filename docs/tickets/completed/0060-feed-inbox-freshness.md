# Ticket 0060: Feed and Inbox Freshness

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Keep feed and inbox views current during normal browsing without requiring full-page reloads or realtime infrastructure.

## Requirements
- [x] Feed and inbox refresh after relevant successful local mutations and on fresh navigation when the last successful load is over 60 seconds old; do not auto-refresh on focus or browser history traversal.
- [x] Refreshing preserves the last successfully loaded content while showing pending and recoverable error states.
- [x] Manual, mutation, and fresh-navigation triggers do not create redundant concurrent refresh requests.
- [x] Refresh behavior and staleness policy are covered by focused tests.

## Tasks
- [x] Audit existing feed and inbox refresh triggers and datasource behavior.
- [x] Set a 60-second stale threshold; refresh on fresh navigation only, excluding focus and browser history traversal.
- [x] Implement shared refresh coordination while preserving existing pending and error UI.
- [x] Add focused tests for mutation classification, stale thresholds, deduplication, and refresh recovery.
- [x] Add browser navigation and retained-content coverage to the integration suite.

## Notes
- This ticket covers bounded client refresh behavior, not push-based realtime delivery.
- A datasource is stale only when its last successful load is over 60 seconds old; manual refresh and relevant successful local mutations remain refresh triggers.
- Saved/custom feed presets and URL state are tracked separately in Tickets 0010 and 0015.
- Coordinate inbox-specific refresh changes with the inbox and notification audit in Ticket 0083; feed refresh work can proceed independently.

## Relevant Files
- app/components/lists/Feed.vue
- app/plugins/freshness.client.ts
- app/pages/feed/home.vue
- app/pages/inbox.vue
- app/utils/data.ts
- app/utils/freshness.ts
- tests/parallel/freshness.server.test.ts
- tests/parallel/freshness.browser.test.ts

## Progress Log
- 2026-11-16: Wired stale-navigation refresh to Nuxt's page-finish lifecycle, including pages without transitions. `yarn test freshness.server.test.ts` (15/15), `yarn test freshness.browser.test.ts` (10/10), typecheck, and production build passed.
- 2026-11-15: Completed the freshness implementation and focused test coverage. Typecheck and production build passed; direct Vitest passed (6/6). The integration runner could not start because Windows Application Control blocked the SurrealDB native module, so browser execution had not yet been verified.
- 2026-11-15: Implemented datasource freshness tracking and mutation invalidation. `yarn typecheck`, `yarn build`, and `yarn vitest run tests/parallel/freshness.server.test.ts` passed (6/6). `yarn test freshness.server.test.ts` could not start because Windows Application Control blocked the SurrealDB native module; browser coverage had not yet been verified.
- 2026-11-15: Confirmed a 60-second threshold; refresh on relevant successful local mutations, explicit refresh, and fresh navigation only, excluding focus and browser history traversal.
- 2026-10-25: Ticket created.
