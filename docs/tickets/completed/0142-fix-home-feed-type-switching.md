# Ticket 0142: Fix Home Feed Type Switching

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Restore switching between Popular and Following so the selected feed and its results stay in sync.

## Requirements
- [x] A signed-in user can switch from Popular to Following and back, and the Home feed shows results for the selected type without a page reload.
- [x] After a switch, pagination uses the selected feed's page state without appending results from the previous feed.
- [x] Rapid switches do not let an earlier request overwrite the latest selection's results.
- [x] Pinned items remain unchanged, and an empty or failed request for the selected feed uses the existing empty or error state rather than showing the previous feed's results.

## Tasks
- [x] Trace the cached `feed.type` selection through the datasource and identify where the new request is cancelled.
- [x] Isolate the datasource per selected feed and remove the resolved TODO.
- [x] Add focused browser regression coverage using distinct Popular and Following results, including switching back, pagination, and delayed responses.
- [x] Verify switching, independent pagination, delayed responses, pin preservation, and empty/error presentation using the existing release CI run.

## Notes
- Nuxt starts the request for the new URL before the synchronous endpoint watcher calls `clear()` on that same request. The keyed Home list now gives each selection a datasource with a fixed endpoint. Pins remain in the page outside that list.
- The regression now cycles Popular -> Following -> Mutuals -> Popular. It mocks and asserts Popular and Following data only; Mutuals content and eligibility coverage remain in Ticket 0137.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/HomeFeed.vue
- app/utils/feedDatasource.ts
- app/components/lists/Feed.vue
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-27: Closed using the [Pipeline job](https://github.com/tcm151/dox/actions/runs/45745675350/job/139661000452) for the exact `v2026.6.6` commit, `7061d1a01479987fc70649c09216749a7f992a46`. The full suite passed 264/264, including 43/43 in the parallel browser phase. The tagged runner includes `tests/parallel/feed.browser.test.ts`, and the switching regression is enabled in that file. CI reported phase totals rather than individual test names. No tests were rerun locally or against production.
- 2026-11-27: Confirmed the fix and browser spec are in the tagged source. The spec was not run; all runtime requirements remain open.
- 2026-11-25: Traced the cancellation in source, isolated requests by selection, and added a browser regression. Runtime verification is pending.
- 2026-11-23: Ticket created.
