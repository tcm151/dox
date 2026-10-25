# Ticket 0066: Configure Community Moderation Defaults

## Status
- State: Planned
- Priority: Medium
- Next: Define the first set of community-level moderation settings

## Dependencies
- [0064](0064-anti-spam-defaults.md): Community settings should start from the documented baseline recommendations.

## Goal
Let community moderators configure supported moderation defaults using documented recommended presets.

## Requirements
- [ ] Authorized moderators can configure supported community-level defaults.
- [ ] Defaults are validated server-side and enforced by the relevant write paths.
- [ ] Recommended presets and fallback behavior are documented.

## Tasks
- [ ] Define the supported settings and their safe ranges.
- [ ] Add persistence and role-gated update handling.
- [ ] Add moderator controls and apply settings to relevant enforcement paths.
- [ ] Document recommended presets and fallback behavior.

## Notes
- Admin controls for NSFW, spoiler, and sensitive-content visibility are tracked in Ticket 0016.

## Relevant Files
- app/pages/topic/[topic]/profile.vue
- server/api/topic/[topic]/update.ts
- shared/types/index.ts

## Progress Log
- 2026-10-25: Ticket created.