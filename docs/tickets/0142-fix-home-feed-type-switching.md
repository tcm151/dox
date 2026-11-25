# Ticket 0142: Fix Home Feed Type Switching

## Status
- State: In Progress
- Priority: Medium
- Next: Run `yarn test --file feed.browser.test.ts` when executable validation is available.

## Goal
Restore switching between Popular and Following so the selected feed and its results stay in sync.

## Requirements
- [ ] A signed-in user can switch from Popular to Following and back, and the Home feed shows results for the selected type without a page reload.
- [ ] After a switch, pagination uses the selected feed's page state without appending results from the previous feed.
- [ ] Rapid switches do not let an earlier request overwrite the latest selection's results.
- [ ] Pinned items remain unchanged, and an empty or failed request for the selected feed uses the existing empty or error state rather than showing the previous feed's results.

## Tasks
- [x] Trace the cached `feed.type` selection through the datasource and identify where the new request is cancelled.
- [x] Isolate the datasource per selected feed and remove the resolved TODO.
- [x] Add focused browser regression coverage using distinct results for each feed, including switching back, pagination, and delayed responses.

## Notes
- Nuxt starts the request for the new URL before the synchronous endpoint watcher calls `clear()` on that same request. The keyed Home list now gives each selection a datasource with a fixed endpoint. Pins remain in the page outside that list.
- Ticket 0137 builds on this fix. This ticket covers the two existing feed types only.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/HomeFeed.vue
- app/utils/feedDatasource.ts
- app/components/lists/Feed.vue
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-25: Traced the cancellation in source, isolated requests by selection, and added a browser regression. Runtime verification is pending.
- 2026-11-23: Ticket created.
