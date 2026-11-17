# Ticket 0066: Configure Community Moderation Defaults

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0064](0064-anti-spam-defaults.md): Community settings should start from the documented baseline recommendations.

## Goal
Let topic moderators configure supported per-topic moderation defaults using documented recommended presets.

## Requirements
- [x] Authorized topic moderators and admins can configure posting cooldown and priority-report threshold settings.
- [x] Settings are validated server-side and enforced by post, thread, gallery, and topic-report workflows.
- [x] Recommended values, supported ranges, and fallback behavior are documented.

## Tasks
- [x] Define the supported settings and their safe ranges.
- [x] Add persistence and role-gated update handling.
- [x] Add moderator controls and apply settings to relevant enforcement paths.
- [x] Document recommended presets and fallback behavior.

## Notes
- Admin controls for NSFW, spoiler, and sensitive-content visibility are tracked in Ticket 0016.
- Topic defaults are a 60-second posting interval and a priority threshold of five distinct reporters. The posting interval can be set to zero to disable it; missing values use schema defaults.
- Application-wide `moderation.perTopic`, `moderation.threshold`, and `moderation.slowModes` are not per-topic policy. In particular, `moderation.threshold` controls moderator-request approval, not report prioritization or posting limits.
- Posting cooldown applies when any selected topic is still within its interval. Report priority is calculated for pending or appealed reports in topic-scoped queues and never automatically hides or removes content.

## Relevant Files
- app/pages/topic/[topic]/tools/profile.vue
- server/api/topic/[topic]/update.ts
- server/api/topic/[topic]/reports.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- server/utils/ModerationManager.ts
- server/api/post/
- server/api/thread/
- server/api/gallery/publish.ts
- tests/parallel/topics.server.test.ts
- tests/parallel/reports.server.test.ts

## Progress Log
- 2026-11-09: Implemented per-topic cooldown and distinct-reporter report priority, documented defaults and fallback behavior, and verified with `yarn test` (78/78), moderation tests (14/14), and `yarn typecheck`.
- 2026-11-02: Audited topic and application settings; topic configuration is currently description-only, and existing global moderation values do not implement per-topic defaults.
- 2026-10-25: Ticket created.