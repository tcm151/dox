# Ticket 0016: Content Visibility Policy Controls

## Status
- State: Planned
- Priority: Medium
- Next: Define policy fields, defaults, and community/user precedence

## Goal
Add admin settings for content visibility policy (NSFW/spoiler/sensitive content) to support safer community defaults.

## Requirements
- [ ] Admin can configure visibility policy settings.
- [ ] Policy settings are applied consistently in relevant views.
- [ ] Defaults are documented and safe.

## Tasks
- [ ] Add policy fields to settings model/schema.
- [ ] Implement admin settings UI and API updates.
- [ ] Apply policy checks in rendering/listing paths where needed.

## Notes
- The current `AppSettings` and `UserSettings` contracts contain no NSFW, spoiler, or sensitive-content visibility policy fields.
- Markdown spoiler syntax is rendered, but it is not connected to a configurable policy.
- This ticket covers community-wide defaults. Decide whether personal overrides belong here or in a separate user-preferences ticket before adding settings fields.

## Relevant Files
- app/pages/admin/settings.vue
- app/utils/settings.ts
- server/api/admin/settings/[id]/update.ts
- server/assets/schema.surql
- server/utils/SettingsManager.ts
- shared/types/index.ts
- app/plugins/markdown.ts

## Progress Log
- 2026-11-02: Audited application and user settings; neither currently models visibility policy, and existing spoiler rendering is presentation-only.
- 2026-04-13: Ticket created.