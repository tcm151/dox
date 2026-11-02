# Ticket 0066: Configure Community Moderation Defaults

## Status
- State: Planned
- Priority: Medium
- Next: Define the first per-topic settings and their enforcement paths

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
- Topic records currently have no moderation-default fields; the topic profile editor only saves its description.
- Application-wide `moderation.perTopic`, `moderation.threshold`, and `moderation.slowModes` are not per-topic policy. In particular, `moderation.threshold` controls moderator-request approval, not report prioritization or posting limits.
- Ticket 0064 documents recommended anti-spam values as guidance, not as currently enforced behavior. Choose the initial per-topic fields and fallback behavior explicitly.

## Relevant Files
- app/pages/topic/[topic]/profile.vue
- server/api/topic/[topic]/update.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- server/utils/ModerationManager.ts
- server/api/post/
- server/api/thread/

## Progress Log
- 2026-11-02: Audited topic and application settings; topic configuration is currently description-only, and existing global moderation values do not implement per-topic defaults.
- 2026-10-25: Ticket created.