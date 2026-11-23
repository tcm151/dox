# Ticket 0102: Enforce Feed Availability Settings

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make active feed settings control direct access to their dedicated feed pages and data endpoints, including the Home feed, rather than only hiding navigation tabs.

## Requirements
- [x] Disabled active feed settings reject direct access to their dedicated page and feed-specific API paths.
- [x] `feeds.discover` controls the Home feed route and its feed-specific data access.
- [x] Disabling a dedicated type feed does not remove that content type from aggregate feeds or other workflows unless their own setting requires it.
- [x] Feed APIs reused by other surfaces are gated at a feed-specific boundary rather than globally blocking unrelated content reads.
- [x] Tests cover enabled and disabled routes and API behavior for active feed settings.

## Tasks
- [x] Trace active search, topic, post, thread, gallery, audio, Links, and Home feed routes to their API consumers.
- [x] Add route and feed-specific API enforcement for the active `feeds.*` settings.
- [x] Verify aggregate feed behavior remains correct when an individual dedicated feed is disabled.
- [x] Add focused route and API tests for disabled and enabled settings.

## Notes
- Admin descriptions distinguish dedicated feeds from the aggregate Home feed; a disabled dedicated feed must not implicitly disable content publishing or aggregate discovery.
- The dedicated Links page follows `feeds.links`, but `/api/link` remains unfiltered as specified by completed Ticket 0041. Polls and video do not yet have complete feed workflows; their settings remain with Tickets 0049 and 0046.
- Audio feed behavior remains with Ticket 0043.

## Relevant Files
- app/pages/feed.vue
- app/middleware/feedAvailability.global.ts
- app/utils/feedSettings.ts
- app/pages/feed/links.vue
- app/pages/feed/home.vue
- app/pages/feed/search.vue
- app/pages/feed/topics.vue
- app/pages/feed/posts.vue
- app/pages/feed/threads.vue
- app/pages/feed/gallery.vue
- app/pages/feed/audio.vue
- server/api/feed/search.ts
- server/api/feed/topics.ts
- server/api/feed/popular.ts
- server/api/feed/pinned.ts
- server/api/feed/following.ts
- server/api/post/index.ts
- server/api/topic/index.ts
- server/api/thread/index.ts
- server/api/gallery/index.ts
- server/api/audio/index.ts
- server/api/link/index.ts
- server/utils/SettingsManager.ts
- server/utils/TopicManager.ts
- tests/parallel/feed.browser.test.ts
- tests/sequential/10-feed-availability.server.test.ts

## Progress Log
- 2026-11-17: Completed route/API enforcement, the dedicated Topics endpoint, and coverage for feed settings, Links, shared endpoints, and aggregate reads. `yarn test --sequential` passed (27/27), `yarn typecheck` and `yarn build` passed; `yarn test` reported 36/39 with failures in Submit visibility, pin activation, and search scroll restoration.
- 2026-11-17: Mapped active feed consumers, including the completed Links page, and began route/API enforcement with the general `/api/link` collection left unfiltered per Ticket 0041.
- 2026-11-13: Ticket created.