# Ticket 0008: Add User Notification Preferences

## Status
- State: Todo
- Priority: Medium
- Next action: Define first-pass preference model (in-app + email toggles)

## Goal
Let users control notification behavior from settings without requiring moderator/admin intervention.

## Done Looks Like
- [ ] User preferences are persisted and loaded in settings.
- [ ] Notification delivery respects user preference toggles.
- [ ] Defaults are documented and sensible for self-hosted communities.

## Tasks
- [ ] Add preference fields to settings model/schema as needed.
- [ ] Build settings UI controls for notification options.
- [ ] Apply preference checks in notification creation/delivery paths.

## Notes

## Relevant Files
- [app/pages/settings/preferences.vue](../../app/pages/settings/preferences.vue)
- [app/utils/settings.ts](../../app/utils/settings.ts)
- [server/api/settings/[id]/index.ts](../../server/api/settings/[id]/index.ts)
- [server/api/profile/notifications/index.ts](../../server/api/profile/notifications/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


