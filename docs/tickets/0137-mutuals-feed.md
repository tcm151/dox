# Ticket 0137: Mutuals Feed

## Status
- State: `In Progress`
- Priority: `Medium`
- Next: Run the full suite in an environment with dependencies to verify the new Mutuals API and Home browser coverage.

## Goal
Add a Mutuals option alongside Popular and Following on the Home feed. Mutuals shows content from users who follow the viewer and whom the viewer follows in return.

## Requirements
- [x] Authenticated users can select Mutuals alongside Popular and Following, with the same supported content types, sort modes, and bounded pagination behavior.
- [x] Mutuals includes content only from authors the viewer follows who also follow the viewer; one-way follows and topic follows alone do not qualify.
- [x] The feed applies the existing personal mute and block filters and does not expose results to unauthenticated API requests.
- [x] Feed results remain deterministically ordered and paging metadata accurately reports offsets and whether more results are available.
- [ ] Signed-out visitors see only Popular. A remembered Following or Mutuals selection, or signing out while either is selected, falls back to Popular without requesting an authenticated feed.
- [ ] Focused server and browser tests cover reciprocal and one-way follows, empty results, filtering, sorting, pagination, and signed-out behavior.

## Tasks
- [x] Decide which feed choices are available while signed out.
- [x] Apply the Popular fallback on direct loads, reloads, and session changes. Keep the public pin outside the selected feed.
- [x] Add an authenticated Mutuals feed query using reciprocal user-follow relationships and the shared paging and filtering helpers.
- [x] Add Mutuals to the Home feed selector without changing Popular or Following behavior.
- [x] Add focused API and browser coverage for eligibility, filters, ordering, pagination, and authentication.

## Notes
- The tagged source includes the reciprocal-follow endpoint and Home selector. Ticket 0142 verified Popular and Following switching in release CI; Mutuals results and eligibility still need their own tests.
- On the signed-in `2026.6.6` production baseline, Home switched Popular -> Following -> Mutuals -> Popular. The pin stayed visible and Mutuals settled on "There is nothing here currently." with no visible error. That confirms the selector and empty state for this account, not who qualifies or how a populated feed pages.
- Home offers all three choices regardless of session, while Following and Mutuals require authentication. The switch regression clicks through the Mutuals button but does not assert Mutuals results; add distinct fixtures and dedicated API coverage.
- Signed out on `v2026.6.6`, switching to Following or Mutuals shows an authentication error and "Unable to load this feed." Reloading with Mutuals selected keeps the broken selection, so guarding the selector click alone is not enough. Switching back to Popular restores results.
- For the browser regression, give Popular, Following, and Mutuals distinct results so the test can detect stale content. Check a fresh signed-out load, a reload with a remembered Mutuals selection, and signing out from Mutuals. Verify that only Popular is available and that neither authenticated feed is requested.
- Extend the server feed tests with reciprocal, one-way, topic-only, and filtered authors. `tests/parallel/mutuals.server.test.ts` now covers reciprocal eligibility, one-way and fan-only exclusion, mute filtering, `new` ordering, paging offsets and `more`, and the unauthenticated 401. `/api/feed/mutuals` is included in the `feeds.discover` availability test.
- `docs/API.md` lists Mutuals with its access rules and shared paging contract.
- The existing Following feed includes content from either followed authors or followed topics; Mutuals is specifically author-based and requires both follow directions.
- Keep saved-user ranking from Ticket 0105 separate; it changes ranking, not feed eligibility.
- The Home feed selector and paged query patterns are established by Ticket 0003.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/HomeFeed.vue
- app/components/lists/Feed.vue
- app/utils/cache.ts
- server/api/feed/following.ts
- server/api/feed/popular.ts
- server/api/feed/mutuals.ts
- server/api/feed/
- server/utils/feedPagination.ts
- server/utils/repos/UserSettingsManager.ts
- server/api/user/[id]/follow.ts
- server/api/user/[id]/unfollow.ts
- shared/types/index.ts
- tests/parallel/mutuals.server.test.ts
- tests/sequential/09-feeds.server.test.ts
- tests/sequential/10-availability.server.test.ts
- tests/parallel/feed.browser.test.ts
- docs/API.md
- docs/Roadmap.md

## Progress Log
- 2026-11-27: Added `tests/parallel/mutuals.server.test.ts` covering reciprocal eligibility, one-way and fan-only exclusion, mute filtering and unmute recovery, deterministic `new` ordering, paging offsets with accurate `more`, and unauthenticated 401. Added `/api/feed/mutuals` to the availability test's discover case. Source-reviewed only; the suite has not run in this workspace.
- 2026-11-27: Implemented the signed-out Popular fallback in the workspace. Added browser cases for remembered Following and Mutuals selections and logout from Mutuals, and added a distinct Mutuals result to the switching test. These cases have not run. The production deployment was not changed.
- 2026-11-27: Reloaded Home while signed out with Mutuals selected. Mutuals stayed selected, the pin remained, and the feed showed an error. The console reported a hydration mismatch and HTTP 401. After switching back to Popular, a reload showed the public feed without either error. The owner chose Popular only for signed-out visitors. No implementation or tests were run.
- 2026-11-27: Reproduced the signed-out selector issue on production. Following and Mutuals each produced a new HTTP 401 console error without showing feed results. The pin stayed visible and Popular recovered. Did not check logout while an authenticated feed was selected.
- 2026-11-27: Recorded the read-only production check for signed-in switching, pin preservation, and the empty Mutuals state. Reviewed the existing feed and availability specs and identified the missing result, authentication, and availability assertions. No tests were run.
- 2026-11-27: Removed the completed Home switching prerequisite. The release regression does not verify distinct Mutuals results or signed-out behavior.
- 2026-11-27: Reconciled the Mutuals endpoint, selector, and switching fix with the `v2026.6.6` source. Signed-out behavior, Mutuals result assertions, and API acceptance remain open.
- 2026-11-23: Recorded the Home feed switching fix as a completion prerequisite. Mutuals design and query work can proceed in parallel.
- 2026-11-19: Ticket created.
