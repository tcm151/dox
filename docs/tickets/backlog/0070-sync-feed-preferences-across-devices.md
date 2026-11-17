# Ticket 0070: Sync Feed Preferences Across Devices

## Status
- State: Planned
- Priority: Low
- Next: Define the persisted feed preference fields and defaults

## Goal
Persist feed and comment sorting choices in account settings so they follow a signed-in user across devices instead of remaining browser-local.

## Requirements
- [ ] Users can choose a default home feed and feed sort in settings.
- [ ] Feed and comment sort preferences persist and are restored after reload or sign-in on another device.
- [ ] Missing or invalid stored values fall back to sensible defaults.

## Tasks
- [ ] Add typed feed and comment preference fields with schema, migration, and account-creation defaults.
- [ ] Add settings controls and explicit save/reset behavior.
- [ ] Replace the relevant browser-local cache values with account preferences.
- [ ] Add tests for persistence, defaults, and restored feed behavior.

## Notes
- The current `feed.type`, `feed.sort`, and `comments.sort` values are stored in browser-local cache scoped to the signed-in user.
- Initial home-feed values are `popular` and `new`; supported sorting values are `new`, `hot`, and `top`.

## Relevant Files
- app/utils/userSettings.ts
- app/pages/settings/preferences.vue
- app/pages/feed/home.vue
- app/components/lists/Feed.vue
- app/pages/post/[id].vue
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.1.surql
- tests/parallel/threads.test.ts

## Progress Log
- 2026-10-26: Ticket created.
