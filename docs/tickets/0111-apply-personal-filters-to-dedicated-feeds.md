# Ticket 0111: Apply Personal Filters To Dedicated Feeds

## Status
- State: Planned
- Priority: High
- Next: Add dedicated-feed regression cases for muted and blocked authors and topics.

## Goal
Make personal mute and block preferences consistent across dedicated and aggregate discovery feeds. Preserve the distinction between hiding public content and denying access to direct links.

## Requirements
- [ ] Dedicated post, thread, gallery, and link feed results apply the signed-in viewer's muted and blocked user/topic exclusions, including users who blocked the viewer.
- [ ] The implementation uses UserSettingsManager.getFilteredTargets rather than a separate client-only filtering policy.
- [ ] Anonymous browsing, direct-link access, and each feed's existing availability rules remain unchanged.
- [ ] Filtering is applied before pagination, sorting limits, or result counts so hidden records do not consume visible page slots.
- [ ] Tests cover author and topic mute/block cases, reverse user blocks, removal of filters, and anonymous access for each affected feed.

## Tasks
- [ ] Trace dedicated feed consumers and add optional-viewer handling to their data endpoints.
- [ ] Apply the established flat exclusion-list predicate consistently to each collection query.
- [ ] Preserve the Links setting exception: its collection API remains available when dedicated Links navigation is disabled.
- [ ] Add parameterized API coverage and a focused browser check for dedicated-feed behavior.
- [ ] Clarify the cross-feed filter contract in the API documentation.

## Notes
- Completed [0014](completed/0014-block-mute-controls.md) promises feed and search filtering. Aggregate, topic, and user feeds apply the shared exclusion list, but the inspected dedicated collection handlers do not.
- The shared Feed component filters content tags, not muted or blocked user/topic targets.
- The unfiltered Links setting contract in [0041](completed/0041-link-detail-and-feed-integration.md) and [0102](completed/0102-enforce-feed-availability-settings.md) concerns feeds.links availability, not personal mute/block preferences.
- These are public records that remain available by direct link; this finding is inconsistent personal safety controls, not access to private content.
- Coordinate query changes with [0112](0112-bound-discovery-and-inbox-queries.md); neither ticket requires the other to start.

## Relevant Files
- server/api/post/index.ts
- server/api/thread/index.ts
- server/api/gallery/index.ts
- server/api/link/index.ts
- server/utils/repos/UserSettingsManager.ts
- app/components/lists/Feed.vue
- tests/parallel/content-filters.server.test.ts
- tests/parallel/feed.browser.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. Runtime feed behavior was not verified.
