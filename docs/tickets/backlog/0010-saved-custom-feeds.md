# Ticket 0010: Saved Custom Feeds

## Status
- State: Planned
- Priority: Medium
- Next: Reuse the filter and URL contract established by Ticket 0015

## Dependencies
- [0015](../0015-search-filters-url-sync.md): Saved presets must use the shared filter schema and query-string behavior.

## Goal
Enable users to save reusable feed presets with filter and sort settings.

## Requirements
- [ ] Users can create, edit, and select saved feed presets.
- [ ] Presets map cleanly to feed query behavior.
- [ ] URL state and selected preset stay in sync.

## Tasks
- [ ] Define preset data model and persistence path.
- [ ] Add feed UI for saving/selecting presets.
- [ ] Apply preset values to feed/search API requests.

## Notes
- Persisted default feed and sort preferences are tracked separately in [Ticket 0070](../0070-sync-feed-preferences-across-devices.md); coordinate the settings model without conflating defaults with saved presets.

## Relevant Files
- app/pages/feed.vue
- app/pages/feed/search.vue
- app/utils/cache.ts
- server/api/feed/search.ts

## Progress Log
- 2026-04-13: Ticket created.
