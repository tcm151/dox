# Ticket 0137: Mutuals Feed

## Status
- State: `Planned`
- Priority: `Medium`
- Next: Define signed-out behavior and confirm the Mutuals feed's content scope.

## Dependencies
- [0142](0142-fix-home-feed-type-switching.md): Verify that the Home feed can switch among all three options without showing results from the previous selection.

## Goal
Add a Mutuals option alongside Popular and Following on the Home feed. Mutuals shows content from users who follow the viewer and whom the viewer follows in return.

## Requirements
- [ ] Authenticated users can select Mutuals alongside Popular and Following, with the same supported content types, sort modes, and bounded pagination behavior.
- [ ] Mutuals includes content only from authors the viewer follows who also follow the viewer; one-way follows and topic follows alone do not qualify.
- [ ] The feed applies the existing personal mute and block filters and does not expose results to unauthenticated API requests.
- [ ] Feed results remain deterministically ordered and paging metadata accurately reports offsets and whether more results are available.
- [ ] Focused server and browser tests cover reciprocal and one-way follows, empty results, filtering, sorting, pagination, and signed-out behavior.

## Tasks
- [ ] Confirm the signed-out experience for the Mutuals selector.
- [ ] Add an authenticated Mutuals feed query using reciprocal user-follow relationships and the shared paging and filtering helpers.
- [ ] Add Mutuals to the Home feed selector without changing Popular or Following behavior.
- [ ] Add focused API and browser coverage for eligibility, filters, ordering, pagination, and authentication.

## Notes
- The existing Following feed includes content from either followed authors or followed topics; Mutuals is specifically author-based and requires both follow directions.
- Keep saved-user ranking from Ticket 0105 separate; it changes ranking, not feed eligibility.
- The Home feed selector and paged query patterns are established by Ticket 0003.

## Relevant Files
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- server/api/feed/following.ts
- server/api/feed/popular.ts
- server/api/feed/
- server/utils/feedPagination.ts
- server/utils/repos/UserSettingsManager.ts
- server/api/user/[id]/follow.ts
- server/api/user/[id]/unfollow.ts
- shared/types/index.ts
- tests/sequential/09-feeds.server.test.ts
- tests/parallel/feed.browser.test.ts
- docs/Roadmap.md

## Progress Log
- 2026-11-23: Recorded the Home feed switching fix as a completion prerequisite. Mutuals design and query work can proceed in parallel.
- 2026-11-19: Ticket created.
