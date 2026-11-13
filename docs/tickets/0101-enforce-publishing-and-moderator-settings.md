# Ticket 0101: Enforce Publishing and Moderator Settings

## Status
- State: Planned
- Priority: Medium
- Next: Define consistent rejection behavior for disabled publishing and full moderator capacity.

## Dependencies
- [0098](completed/0098-audit-appsettings-usage-and-gaps.md): The settings audit identified the client-only publishing and moderator-capacity controls.

## Goal
Enforce post/thread availability, topic-submission rules, and moderator capacity at server boundaries so direct requests cannot bypass community settings.

## Requirements
- [ ] Post and thread editor routes and create APIs reject publication when the corresponding setting is disabled.
- [ ] Post and thread create APIs enforce the topic count and, when restricted, the configured topic allowlist.
- [ ] The moderator request and approval workflows enforce `moderation.perTopic`; approval cannot exceed capacity under concurrent requests.
- [ ] `topics.perSubmission` uses the same minimum as the admin control, and zero does not silently mean unlimited.
- [ ] Focused tests cover disabled settings, over-limit and disallowed topics, and capacity boundaries.

## Tasks
- [ ] Gate direct editor routes and post/thread create APIs using current AppSettings.
- [ ] Enforce topic count and allowlist checks in both publishing workflows.
- [ ] Check moderator capacity at request and approval boundaries, with the approval check atomic with roster mutation.
- [ ] Align `topics.perSubmission` validation with the admin minimum of one.
- [ ] Add focused API tests for each rejected and allowed path, including concurrent moderator approvals.

## Notes
- The client-side `TopicField` and `canRequestTopic` checks remain UX aids; server checks are authoritative.
- Links, polls, audio, and video publishing remain in their existing feature tickets.

## Relevant Files
- app/pages/editor.vue
- app/components/form/fields/TopicField.vue
- app/utils/moderation.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/topic/[topic]/request-moderation.ts
- server/api/moderator/request/[id]/approve.ts
- server/utils/SettingsManager.ts
- tests/parallel/topics.server.test.ts
- tests/parallel/topics.browser.test.ts

## Progress Log
- 2026-11-13: Ticket created.