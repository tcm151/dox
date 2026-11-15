# Ticket 0102: Enforce Feed Availability Settings

## Status
- State: Planned
- Priority: Medium
- Next: Map active dedicated feed routes to their feed-specific data endpoints.

## Dependencies
- [0098](completed/0098-audit-appsettings-usage-and-gaps.md): The settings audit verified that active feed switches currently hide navigation only.

## Goal
Make active feed settings control direct access to their dedicated feed pages and data endpoints, including the Home feed, rather than only hiding navigation tabs.

## Requirements
- [ ] Disabled active feed settings reject direct access to their dedicated page and feed-specific API paths.
- [ ] `feeds.discover` controls the Home feed route and its feed-specific data access.
- [ ] Disabling a dedicated type feed does not remove that content type from aggregate feeds or other workflows unless their own setting requires it.
- [ ] Feed APIs reused by other surfaces are gated at a feed-specific boundary rather than globally blocking unrelated content reads.
- [ ] Tests cover enabled and disabled routes and API behavior for active feed settings.

## Tasks
- [ ] Trace active search, topic, post, thread, gallery, audio, and Home feed routes to their API consumers.
- [ ] Add route and feed-specific API enforcement for the active `feeds.*` settings.
- [ ] Verify aggregate feed behavior remains correct when an individual dedicated feed is disabled.
- [ ] Add focused route and API tests for disabled and enabled settings.

## Notes
- Admin descriptions distinguish dedicated feeds from the aggregate Home feed; a disabled dedicated feed must not implicitly disable content publishing or aggregate discovery.
- Links, polls, and video do not yet have complete feed workflows. Their settings remain with [Ticket 0041](completed/0041-link-detail-and-feed-integration.md), [Ticket 0046](backlog/0046-video-authoring-playback-and-discovery.md), and [Ticket 0049](backlog/0049-poll-detail-feed-and-lifecycle.md).
- Audio feed behavior remains with [Ticket 0043](0043-audio-detail-feed-and-cleanup.md).

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/home.vue
- app/pages/feed/search.vue
- app/pages/feed/topics.vue
- app/pages/feed/posts.vue
- app/pages/feed/threads.vue
- app/pages/feed/gallery.vue
- app/pages/feed/audio.vue
- server/api/feed/search.ts
- server/api/feed/popular.ts
- server/api/feed/pinned.ts
- server/api/feed/following.ts
- server/api/post/index.ts
- server/api/topic/index.ts
- server/api/thread/index.ts
- server/api/gallery/index.ts
- server/api/audio/index.ts
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-13: Ticket created.