# Ticket 0060: Feed and Inbox Freshness

## Status
- State: Planned
- Priority: Medium
- Next: Define refresh triggers and a bounded stale threshold for feeds and inbox.

## Goal
Keep feed and inbox views current during normal browsing without requiring full-page reloads or realtime infrastructure.

## Requirements
- [ ] Feed and inbox refresh after relevant successful local mutations and when a stale view returns to the foreground.
- [ ] Refreshing preserves the last successfully loaded content while showing pending and recoverable error states.
- [ ] Repeated focus events or overlapping triggers do not create redundant concurrent refresh requests.
- [ ] Refresh behavior and staleness policy are covered by focused tests.

## Tasks
- [ ] Audit existing feed and inbox refresh triggers and datasource behavior.
- [ ] Define the stale threshold and visibility/focus refresh policy.
- [ ] Implement shared refresh coordination and user-visible refresh states where needed.
- [ ] Add focused validation for mutation, stale-on-return, overlapping, and failure cases.

## Notes
- This ticket covers bounded client refresh behavior, not push-based realtime delivery.
- Saved/custom feed presets and URL state are tracked separately in Ticket 0010.

## Relevant Files
- app/components/lists/Feed.vue
- app/pages/feed/home.vue
- app/pages/inbox.vue
- app/utils/data.ts

## Progress Log
- 2026-10-25: Ticket created.
