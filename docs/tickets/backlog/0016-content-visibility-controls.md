# Ticket 0016: Content Visibility Policy Controls

## Status
- State: Todo
- Priority: Medium
- Next action: Define admin-level policy fields and defaults

## Goal
Add admin settings for content visibility policy (NSFW/spoiler/sensitive content) to support safer community defaults.

## Done Looks Like
- [ ] Admin can configure visibility policy settings.
- [ ] Policy settings are applied consistently in relevant views.
- [ ] Defaults are documented and safe.

## Tasks
- [ ] Add policy fields to settings model/schema.
- [ ] Implement admin settings UI and API updates.
- [ ] Apply policy checks in rendering/listing paths where needed.

## Notes

## Relevant Files
- app/pages/admin/settings.vue
- app/utils/settings.ts
- server/api/admin/settings/[id]/update.ts
- shared/types/index.ts

## Progress Log
- 2026-04-13: Ticket created.


