# Ticket 0098: Audit AppSettings Usage and Configuration Gaps

## Status
- State: In Progress
- Priority: Medium
- Next: Inventory each AppSettings field against the shared contract, admin control, validator, and runtime consumers.

## Goal
Audit application settings and nearby hard-coded behavior to identify options that are unused, applied only in the UI, or should reasonably be configurable. Produce a prioritized inventory with evidence and focused follow-up tickets for accepted changes.

## Requirements
- [ ] Every AppSettings field is mapped to its admin control, runtime consumers, server/API enforcement, and validation status, or explicitly marked unused.
- [ ] Feature flags and limits are traced through navigation, direct page routes, API boundaries, and server operations; suspected gaps are verified rather than inferred from a missing reference alone.
- [ ] Hard-coded behavior candidates are classified as configurable, intentionally fixed, or deployment configuration, with rationale.
- [ ] Prioritized findings include affected files and proposed outcomes; accepted implementation work is captured in focused follow-up tickets.

## Tasks
- [ ] Inventory AppSettings fields from the shared contract, admin editor, validator, and current client/server consumers.
- [x] Verify initial enforcement paths for voting, topic submission, moderator capacity, image workflows, email spool limits, and nested settings schema.
- [ ] Complete end-to-end flag and limit traces for feed visibility, publishing, feedback, and remaining settings.
- [ ] Search for hard-coded community and product policies that may belong in AppSettings; exclude presentation details and deployment-specific values unless justified.
- [x] Record preliminary evidence, impact, and recommendations; create linked follow-up tickets for accepted image-policy and schema work.

## Notes
- This ticket covers audit and prioritization, not implementation of new settings or behavior changes.
- Distinct from [Ticket 0079](completed/0079-validate-application-settings.md), which establishes server-side validation, and [Ticket 0090](0090-core-path-todo-audit.md), which triages TODOs and unfinished core paths.
- Remaining audit areas include the full AppSettings field inventory, feed and publishing flags, feedback, and hard-coded community/product policies.
- Accepted implementation follow-ups are tracked in [Ticket 0099](0099-separate-image-upload-gallery-and-attachment-settings.md) and [Ticket 0100](0100-strict-appsettings-schema.md); other recommendations remain pending prioritization.
- Dependency order: complete this audit, then strictify the AppSettings schema in Ticket 0100, then add image-policy fields in Ticket 0099.

## Preliminary Findings

### Media Token Setting
- Priority: Medium.
- Finding: `media.tokens.enabled` is validated and persisted, but `Navbar.client.vue` uses it only to show the `/store` link. The Store page has no setting guard; referral redemption delegates without consulting settings; image/audio uploads still calculate and deduct token costs.
- Evidence: `shared/types/index.ts`, `app/pages/admin/settings.vue`, `app/components/system/Navbar.client.vue`, `app/pages/store.vue`, `server/api/profile/referral.ts`, `server/utils/media.ts`, `server/api/image/upload.ts`, `server/api/audio/upload.ts`.
- Recommendation: Clarify whether this setting should gate Store and token workflows or only control Store navigation.

### Voting Flags
- Priority: Medium.
- Finding: `Votes.vue` hides controls according to `voting.enabled`, `voting.misleading`, and `voting.negative`, but all four authenticated vote API handlers mutate vote state without checking those settings. Existing tests cover authentication and vote transitions, not disabled settings.
- Evidence: `app/components/system/tags/Votes.vue`, `server/api/vote/[id]/positive.ts`, `server/api/vote/[id]/misleading.ts`, `server/api/vote/[id]/negative.ts`, `server/api/vote/[id]/reset.ts`, `tests/parallel/votes.server.test.ts`.
- Recommendation: Enforce the settings in the API and add disabled-setting test cases.

### Topic Submission Rules
- Priority: Medium.
- Finding: `TopicField.vue` applies `topics.perSubmission`, `topics.restrict`, and `topics.allowed`; post and thread creation accept topic IDs and check topic status/cooldown, but do not enforce these settings. Direct API requests can exceed the configured count or assign topics outside the allowlist. The admin control requires `perSubmission >= 1`, while server settings validation permits zero.
- Evidence: `app/components/form/fields/TopicField.vue`, `server/api/post/add.ts`, `server/api/thread/add.ts`, `server/utils/SettingsManager.ts`, `app/pages/admin/settings.vue`.
- Recommendation: Enforce assignment count and allowlist in server publishing workflows, and align the zero-value contract.

### Moderator Capacity
- Priority: Medium.
- Finding: `useModeration.canRequestTopic` checks the current moderator count, but the request endpoint does not enforce the limit and the approval endpoint adds a moderator without checking capacity. Direct requests/approvals can exceed the configured per-topic limit.
- Evidence: `app/utils/moderation.ts`, `server/api/topic/[topic]/request-moderation.ts`, `server/api/moderator/request/[id]/approve.ts`.
- Recommendation: Enforce capacity in the server approval workflow and cover limit/race cases.

### Email Spool Limits
- Priority: Medium.
- Finding: Admin inputs constrain `dailyLimit`, `batchLimit`, and `maxRetries`, but `SettingsManager.validate` checks only email support strings and the schema stores email as a flexible object. `EmailSpool` consumes these values directly, so invalid API updates can suppress sending or alter retry behavior.
- Evidence: `app/pages/admin/settings.vue`, `server/utils/SettingsManager.ts`, `server/assets/schema.surql`, `server/utils/EmailSpool.ts`.
- Recommendation: Validate integer types and bounds server-side to match the admin controls.

### Image Upload and Attachments
- Priority: Medium.
- Finding: `media.images.enabled` controls the image editor tab and upload API, while its admin description also promises gallery publishing; `feeds.images` controls gallery feed visibility. Gallery publishing has no `media.images.enabled` check, and post/thread APIs accept image IDs without per-type attachment settings.
- Evidence: `app/pages/admin/settings.vue`, `app/pages/editor.vue`, `app/pages/editor/image.vue`, `app/pages/editor/post.vue`, `app/pages/editor/thread.vue`, `server/utils/media.ts`, `server/api/gallery/publish.ts`, `server/api/post/add.ts`, `server/api/thread/add.ts`.
- Recommendation: Define independent upload, gallery-publish, and post/thread-attachment controls, keeping gallery feed visibility separate. Tracked in [Ticket 0099](0099-separate-image-upload-gallery-and-attachment-settings.md).

### AppSettings Database Schema
- Priority: Medium.
- Finding: The table is `SCHEMAFULL`, but most settings objects are `TYPE object FLEXIBLE`; `SettingsManager.validate` checks declared fields but does not reject unknown nested keys, and `Validator.object` does not inspect extra properties. The schema default also contains `topics.enabled`, which is absent from the shared AppSettings contract.
- Evidence: `server/assets/schema.surql`, `shared/types/index.ts`, `server/utils/SettingsManager.ts`, `shared/utils/Validator.ts`.
- Recommendation: Finish the field inventory, reconcile schema-only/legacy fields, and define strict nested fields with a data-preserving migration. Tracked in [Ticket 0100](0100-strict-appsettings-schema.md).

## Relevant Files
- shared/types/index.ts
- app/pages/admin/settings.vue
- server/utils/SettingsManager.ts
- app/pages/editor.vue
- app/pages/feed.vue
- app/pages/editor/image.vue
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- app/components/form/fields/TopicField.vue
- app/utils/moderation.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/topic/[topic]/request-moderation.ts
- server/api/moderator/request/[id]/approve.ts
- server/utils/EmailSpool.ts
- tests/sequential/06-email-spool.server.test.ts
- shared/utils/Validator.ts
- app/components/system/Navbar.client.vue
- app/pages/store.vue
- server/api/profile/referral.ts
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/audio/upload.ts
- server/api/gallery/publish.ts
- server/assets/schema.surql
- app/components/system/tags/Votes.vue
- server/api/vote/[id]/positive.ts
- server/api/vote/[id]/misleading.ts
- server/api/vote/[id]/negative.ts
- server/api/vote/[id]/reset.ts
- tests/parallel/votes.server.test.ts

## Progress Log
- 2026-11-13: Updated investigation progress and linked the dependency sequence 0098 -> 0100 -> 0099.
- 2026-11-13: Added the strict AppSettings schema finding and linked follow-up Ticket 0100.
- 2026-11-13: Verified initial enforcement findings for media tokens/images, voting, topic rules, moderator capacity, email spool limits, and nested settings schema.
- 2026-11-13: Ticket created.