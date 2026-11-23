# Ticket 0101: Enforce Publishing and Moderator Settings

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Enforce post/thread availability, topic-submission rules, and moderator-request eligibility at server boundaries so direct requests cannot bypass community settings.

## Requirements
- [x] Post and thread editor routes and create APIs reject publication when the corresponding setting is disabled.
- [x] Post and thread create APIs enforce the topic count and, when restricted, the configured topic allowlist.
- [x] New moderator requests are rejected once assigned moderators reach `moderation.perTopic`; requests already submitted remain eligible for approval.
- [x] `topics.perSubmission` uses the same minimum as the admin control, and zero does not silently mean unlimited.
- [x] Focused tests cover disabled settings, over-limit and disallowed topics, request eligibility, and queued approvals.

## Tasks
- [x] Gate direct editor routes and post/thread create APIs using current AppSettings.
- [x] Enforce topic count and allowlist checks in both publishing workflows.
- [x] Enforce the moderator request threshold at request creation while preserving approval of existing requests.
- [x] Align `topics.perSubmission` validation with the admin minimum of one.
- [x] Add focused API tests for rejected and allowed paths, including approval after the request threshold is reached.

## Notes
- The client-side `TopicField` and `canRequestTopic` checks remain UX aids; server checks are authoritative.
- Disabled publishing follows existing feature-gate behavior (`403`); exceeded topic limits return `400`; disallowed topic assignments and requests beyond the moderator request threshold return `403` and `409`, respectively.
- `moderation.perTopic` gates new requests; it is not a hard limit on the final moderator roster.
- Links, polls, audio, and video publishing remain in their existing feature tickets.

## Relevant Files
- app/pages/editor.vue
- app/pages/admin/settings.vue
- app/components/form/fields/TopicField.vue
- app/utils/moderation.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/topic/[topic]/request-moderation.ts
- server/api/moderator/request/[id]/approve.ts
- server/utils/SettingsManager.ts
- tests/parallel/editor-settings.browser.test.ts
- tests/parallel/settings.server.test.ts
- tests/sequential/11-publishing-settings.server.test.ts
- tests/parallel/topics.server.test.ts
- tests/parallel/topics.browser.test.ts

## Progress Log
- 2026-11-17: Completed enforcement and focused coverage; typecheck passed. The full suite reported nine browser failures in pre-existing UI worktree changes.
- 2026-11-17: Clarified `moderation.perTopic` as a new-request threshold rather than a roster cap; server checks and focused coverage now follow that contract.
- 2026-11-17: Started implementation after the AppSettings audit; established rejection behavior from existing API conventions.
- 2026-11-13: Ticket created.