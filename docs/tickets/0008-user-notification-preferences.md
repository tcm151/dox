# Ticket 0008: Add User Notification Preferences

## Status
- State: In Progress
- Priority: Medium
- Next: Add email notification preference fields and defaults to user settings.

## Goal
Let users control notification behavior from settings without requiring moderator/admin intervention.

## Requirements
- [x] In-app notification and UI preferences are persisted and loaded in settings.
- [x] In-app notification creation respects its preference toggle.
- [ ] Email notification preferences are persisted and respected by delivery.
- [ ] Defaults are documented and sensible for self-hosted communities.

## Tasks
- [x] Persist in-app notification and UI preference fields with defaults.
- [ ] Add email notification preference fields and defaults.
- [x] Build settings controls for in-app notification options.
- [ ] Build settings controls for email notification options.
- [x] Gate in-app notification creation on its preference.
- [ ] Apply preferences to email notification delivery.

## Notes
- In-app notifications default to enabled for new users and existing users migrated to user settings.
- Preference-gated notifications are written in a separate transaction from their originating actions.

## Relevant Files
- app/pages/settings/preferences.vue
- app/utils/settings.ts
- server/api/settings/[id]/index.ts
- server/api/profile/notifications/index.ts

## Progress Log
- 2026-10-27: Persisted and tested in-app preferences; email preference support and default documentation remain. Notification writes use separate transactions by design.
- 2026-04-13: Ticket created.
