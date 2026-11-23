# Ticket 0142: Fix Home Feed Type Switching

## Status
- State: Planned
- Priority: Medium
- Next: Reproduce switching from Popular to Following and back on the Home feed.

## Goal
Restore switching between Popular and Following so the selected feed and its results stay in sync.

## Requirements
- [ ] A signed-in user can switch from Popular to Following and back, and the Home feed shows results for the selected type without a page reload.
- [ ] After a switch, pagination uses the selected feed's page state without appending results from the previous feed.
- [ ] Rapid switches do not let an earlier request overwrite the latest selection's results.
- [ ] Pinned items remain unchanged, and an empty or failed request for the selected feed uses the existing empty or error state rather than showing the previous feed's results.

## Tasks
- [ ] Trace the cached `feed.type` selection through the datasource to reproduce the regression and identify its cause.
- [ ] Fix the switch and remove the resolved TODO.
- [ ] Add focused browser regression coverage using distinct results for each feed, including switching back, pagination, and delayed responses.

## Notes
- The Home feed already cycles between Popular and Following and builds its endpoint from `feedType`. The source TODO reports that switching is broken; the cause has not been verified.
- Ticket 0137 builds on this fix. This ticket covers the two existing feed types only.

## Relevant Files
- app/pages/feed/home.vue
- app/utils/feedDatasource.ts
- app/components/lists/Feed.vue
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-23: Ticket created.
