# Ticket 0098: Audit AppSettings Usage and Configuration Gaps

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Audit application settings and nearby hard-coded behavior to identify options that are unused, applied only in the UI, or should reasonably be configurable. Produce a prioritized inventory with evidence and focused follow-up tickets for accepted changes.

## Requirements
- [x] Every AppSettings field is mapped to its admin control, runtime consumers, server/API enforcement, and validation status, or explicitly marked unused.
- [x] Feature flags and limits are traced through navigation, direct page routes, API boundaries, and server operations; suspected gaps are verified rather than inferred from a missing reference alone.
- [x] Hard-coded behavior candidates are classified as configurable, intentionally fixed, or deployment configuration, with rationale.
- [x] Prioritized findings include affected files and proposed outcomes; accepted implementation work is captured in focused follow-up tickets.

## Tasks
- [x] Inventory AppSettings fields from the shared contract, admin editor, validator, and current client/server consumers.
  - [x] Map initial candidates and verify their client/server enforcement paths.
  - [x] Map every remaining field to its admin control, validation, and runtime consumer or mark it unused.
- [x] Verify initial enforcement paths for voting, topic submission, moderator capacity, image workflows, email spool limits, and nested settings schema.
- [x] Complete end-to-end flag and limit traces for feed visibility, publishing, feedback, and remaining settings.
  - [x] Trace feed visibility and publishing gates through navigation, direct page routes, and server operations.
  - [x] Trace feedback enablement and anonymous-submission settings through UI and API.
  - [x] Finish traces for remaining fields and feature limits.
- [x] Search for hard-coded community and product policies that may belong in AppSettings; exclude presentation details and deployment-specific values unless justified.
  - [x] Identify and classify candidate community/product policies with rationale.
- [x] Record preliminary evidence, impact, and recommendations; create linked follow-up tickets for accepted image-policy and schema work.

## Notes
- This ticket covers audit and prioritization, not implementation of new settings or behavior changes.
- Distinct from [Ticket 0079](0079-validate-application-settings.md), which establishes server-side validation, and [Ticket 0090](../0090-core-path-todo-audit.md), which triages TODOs and unfinished core paths.
- Accepted implementation follow-ups are tracked in [Ticket 0099](../0099-separate-image-upload-gallery-and-attachment-settings.md), [Ticket 0100](../0100-strict-appsettings-schema.md), [Ticket 0101](../0101-enforce-publishing-and-moderator-settings.md), [Ticket 0102](../0102-enforce-feed-availability-settings.md), [Ticket 0103](../0103-enforce-voting-availability-settings.md), and [Ticket 0104](../0104-enforce-feedback-settings-and-anonymous-submissions.md).
- Existing feature work remains in [Ticket 0020](../backlog/0020-checkout-feature-flag-foundation.md), [Ticket 0039](../0039-link-publishing-foundation.md), [Ticket 0041](../0041-link-detail-and-feed-integration.md), [Ticket 0042](../0042-audio-publication-lifecycle.md), [Ticket 0043](../0043-audio-detail-feed-and-cleanup.md), [Ticket 0046](../backlog/0046-video-authoring-playback-and-discovery.md), [Ticket 0047](../backlog/0047-poll-creation-model-and-publishing.md), and [Ticket 0049](../backlog/0049-poll-detail-feed-and-lifecycle.md); this avoids duplicate feature tickets.
- Dependency order: this audit is complete; strictify AppSettings in Ticket 0100 before Ticket 0099 adds image-policy fields. Tickets 0101-0103 can proceed from this audit, while Ticket 0104 follows Ticket 0100.

## Preliminary Findings

### Media Token Setting
- Priority: Low.
- Finding: The admin describes `media.tokens.enabled` as reserved for future media token support. It currently controls only the `/store` navbar link; Store, referral, and upload token behavior is not gated by it, so it is not yet a defined switch for the token economy.
- Evidence: `shared/types/index.ts`, `app/pages/admin/settings.vue`, `app/components/system/Navbar.client.vue`, `app/pages/store.vue`, `server/api/profile/referral.ts`, `server/utils/media.ts`, `server/api/image/upload.ts`, `server/api/audio/upload.ts`.
- Recommendation: Defer the flag's behavior to checkout work in [Ticket 0020](../backlog/0020-checkout-feature-flag-foundation.md); do not treat it as an active token-workflow gate before that contract is defined.

### Voting Flags
- Priority: Medium.
- Finding: `Votes.vue` hides controls according to `voting.enabled`, `voting.misleading`, and `voting.negative`, but all four authenticated vote API handlers mutate vote state without checking those settings. Existing tests cover authentication and vote transitions, not disabled settings.
- Evidence: `app/components/system/tags/Votes.vue`, `server/api/vote/[id]/positive.ts`, `server/api/vote/[id]/misleading.ts`, `server/api/vote/[id]/negative.ts`, `server/api/vote/[id]/reset.ts`, `tests/parallel/votes.server.test.ts`.
- Recommendation: Enforce the settings in the API and add disabled-setting test cases. Tracked in [Ticket 0103](../0103-enforce-voting-availability-settings.md).

### Feed Visibility Flags
- Priority: Medium.
- Finding: `feeds.search`, `topics`, `posts`, `threads`, `images`, and `audio` hide tabs in `app/pages/feed.vue`, but direct page routes and their data APIs do not check those settings. `feeds.discover` has no runtime consumer and the Home tab remains visible. `feeds.links`, `feeds.polls`, and `feeds.video` have no corresponding feed route or runtime consumer.
- Evidence: `app/pages/admin/settings.vue`, `app/pages/feed.vue`, `app/pages/feed/home.vue`, `app/pages/feed/search.vue`, `app/pages/feed/topics.vue`, `app/pages/feed/posts.vue`, `app/pages/feed/threads.vue`, `app/pages/feed/gallery.vue`, `app/pages/feed/audio.vue`, `server/api/feed/search.ts`, `server/api/feed/popular.ts`, `server/api/feed/following.ts`, `server/api/feed/pinned.ts`, `server/api/post/index.ts`, `server/api/topic/index.ts`, `server/api/thread/index.ts`, `server/api/gallery/index.ts`, `server/api/audio/index.ts`.
- Recommendation: Enforce active feed settings for direct routes and feed-specific APIs; preserve aggregate-feed behavior. Tracked in [Ticket 0102](../0102-enforce-feed-availability-settings.md). Link, audio, video, and poll feeds remain with their existing feature tickets.

### Publishing Flags
- Priority: Medium.
- Finding: `posts.enabled` and `threads.enabled` hide their editor tabs, but the editor route middleware only checks authentication and the post/thread create APIs do not check these settings. Direct editor/API requests can still publish while disabled. Link and poll publishing are explicitly marked unfinished in the admin UI and should not be treated as operational flags yet.
- Evidence: `app/pages/editor.vue`, `app/pages/editor/post.vue`, `app/pages/editor/thread.vue`, `server/api/post/add.ts`, `server/api/thread/add.ts`, `app/pages/admin/settings.vue`.
- Recommendation: Enforce post/thread availability in direct editor routes and create APIs; keep unfinished link/poll controls clearly unavailable until their workflows exist. Tracked in [Ticket 0101](../0101-enforce-publishing-and-moderator-settings.md); link and poll work remains in Tickets 0039 and 0047.

### Video Settings
- Priority: Low.
- Finding: Admin settings expose `media.video.enabled`, `media.video.uploadLimit`, and `feeds.video`, but the video editor route renders an unavailable placeholder, there is no video API or feed route, and no server runtime consumer of these settings was found.
- Evidence: `app/pages/admin/settings.vue`, `app/pages/editor.vue`, `app/pages/editor/video.vue`, `app/pages/feed.vue`, `server/utils/SettingsManager.ts`, `server/assets/schema.surql`.
- Recommendation: Keep video explicitly unavailable until its upload and feed workflows are implemented in [Ticket 0046](../backlog/0046-video-authoring-playback-and-discovery.md).

### Topic Submission Rules
- Priority: Medium.
- Finding: `TopicField.vue` applies `topics.perSubmission`, `topics.restrict`, and `topics.allowed`; post and thread creation accept topic IDs and check topic status/cooldown, but do not enforce these settings. Direct API requests can exceed the configured count or assign topics outside the allowlist. The admin control requires `perSubmission >= 1`, while server settings validation permits zero.
- Evidence: `app/components/form/fields/TopicField.vue`, `server/api/post/add.ts`, `server/api/thread/add.ts`, `server/utils/SettingsManager.ts`, `app/pages/admin/settings.vue`.
- Recommendation: Enforce assignment count and allowlist in server publishing workflows, and align the zero-value contract with the admin minimum. Tracked in [Ticket 0101](../0101-enforce-publishing-and-moderator-settings.md).

### Moderator Capacity
- Priority: Medium.
- Finding: `useModeration.canRequestTopic` checks the current moderator count, but the request endpoint does not enforce the limit and the approval endpoint adds a moderator without checking capacity. Direct requests/approvals can exceed the configured per-topic limit.
- Evidence: `app/utils/moderation.ts`, `server/api/topic/[topic]/request-moderation.ts`, `server/api/moderator/request/[id]/approve.ts`.
- Recommendation: Enforce capacity in the server approval workflow and cover limit/race cases. Tracked in [Ticket 0101](../0101-enforce-publishing-and-moderator-settings.md).

### Email Spool Limits
- Priority: Medium.
- Finding: Admin inputs constrain `dailyLimit`, `batchLimit`, and `maxRetries`, but `SettingsManager.validate` checks only email support strings and the schema stores email as a flexible object. `EmailSpool` consumes these values directly, so invalid API updates can suppress sending or alter retry behavior.
- Evidence: `app/pages/admin/settings.vue`, `server/utils/SettingsManager.ts`, `server/assets/schema.surql`, `server/utils/EmailSpool.ts`.
- Recommendation: Validate integer types and bounds server-side to match the admin controls. Tracked in [Ticket 0100](../0100-strict-appsettings-schema.md).

### Image Upload and Attachments
- Priority: Medium.
- Finding: `media.images.enabled` controls the image editor tab and upload API, while its admin description also promises gallery publishing; `feeds.images` controls gallery feed visibility. Gallery publishing has no `media.images.enabled` check, and post/thread APIs accept image IDs without per-type attachment settings.
- Evidence: `app/pages/admin/settings.vue`, `app/pages/editor.vue`, `app/pages/editor/image.vue`, `app/pages/editor/post.vue`, `app/pages/editor/thread.vue`, `server/utils/media.ts`, `server/api/gallery/publish.ts`, `server/api/post/add.ts`, `server/api/thread/add.ts`.
- Recommendation: Define independent upload, gallery-publish, and post/thread-attachment controls, keeping gallery feed visibility separate. Tracked in [Ticket 0099](../0099-separate-image-upload-gallery-and-attachment-settings.md).

### AppSettings Database Schema
- Priority: Medium.
- Finding: The table is `SCHEMAFULL`, but most settings objects are `TYPE object FLEXIBLE`; `SettingsManager.validate` checks declared fields but does not reject unknown nested keys, and `Validator.object` does not inspect extra properties. The schema default also contains `topics.enabled`, which is absent from the shared AppSettings contract.
- Evidence: `server/assets/schema.surql`, `shared/types/index.ts`, `server/utils/SettingsManager.ts`, `shared/utils/Validator.ts`.
- Recommendation: Reconcile schema-only/legacy fields and define strict nested fields with a data-preserving migration. Tracked in [Ticket 0100](../0100-strict-appsettings-schema.md).

### Feedback Settings
- Priority: Medium.
- Finding: `misc.feedback.enabled` hides feedback UI entry points, but `/api/feedback/submit` does not check the setting. `allowAnonymous` appears in the admin control, default, schema, and validator, but the client only offers submission to authenticated users and the API always calls `authenticateRequest`. The shared type narrows both fields to their default literals (`true` and `false`) although the admin exposes toggles and the validator accepts booleans.
- Evidence: `app/app.vue`, `app/components/system/Navbar.client.vue`, `app/components/system/Feedback.client.vue`, `app/pages/contact.vue`, `app/pages/admin/settings.vue`, `server/api/feedback/submit.ts`, `tests/parallel/feedback.server.test.ts`.
- Recommendation: Enforce `enabled` and implement anonymous submission when allowed, including an optional feedback author and abuse controls. Tracked in [Ticket 0104](../0104-enforce-feedback-settings-and-anonymous-submissions.md); align the AppSettings field types in [Ticket 0100](../0100-strict-appsettings-schema.md).

## AppSettings Field Map

| Field | Admin/runtime use | Server enforcement and validation |
| --- | --- | --- |
| `about.summary` | Admin editor; rendered on the About page. | String validated; display-only setting. |
| `email.support`, `email.additional` | Admin editor; Contact page and support address in confirmation/reset emails. | Strings validated; no address-format or list-entry validation. |
| `email.spool.dailyLimit`, `batchLimit`, `maxRetries` | Admin numeric controls; consumed by `EmailSpool`. | Runtime-consumed, but not validated by `SettingsManager`; see Email Spool Limits. |
| `moderation.perTopic` | Admin control; client request-eligibility helper. | Integer validated; request/approval API does not enforce capacity. |
| `moderation.threshold` | Admin control; moderation-request approve/deny and review workflows. | Integer validated and consumed server-side. |
| `moderation.slowModes` | Admin interval list; surfaced by moderation actions. | Positive integers validated and permitted intervals enforced by `ModerationManager`. |
| `content.visibility` | Admin modes; `ContentVisibility` combines them with user preferences. | Supported tags/modes validated; client presentation behavior, not a server access filter. |
| `voting.enabled`, `misleading`, `negative` | Admin toggles; control vote UI. | Booleans validated; vote APIs do not enforce them. |
| `topics.perSubmission`, `restrict`, `allowed` | Admin controls; `TopicField` applies them in the client. | Values validated; post/thread APIs do not enforce them. |
| `feeds.search`, `topics`, `posts`, `threads`, `images`, `audio` | Admin toggles; hide corresponding feed tabs. | Booleans validated; direct feed routes/APIs are not gated. |
| `feeds.links`, `polls`, `video` | Admin toggles; no feed route or runtime consumer found. | Booleans validated, but these settings have no feed behavior. |
| `feeds.discover` | Admin toggle; Home tab remains visible. | Boolean validated; no runtime consumer found. |
| `posts.enabled`, `threads.enabled` | Admin toggles; hide editor tabs. | Booleans validated; direct editor routes and create APIs do not enforce them. |
| `links.enabled`, `polls.enabled` | Admin toggles; link/poll editor pages are marked unavailable. | Booleans validated; publishing workflows are unfinished. |
| `media.tokens.enabled` | Admin toggle; controls Store navbar link. | Boolean validated; does not gate token workflows. |
| `media.tokens.enabled` | Admin placeholder reserved for future token support; currently controls the Store navbar link. | Boolean validated; token workflow semantics are deferred to [Ticket 0020](../backlog/0020-checkout-feature-flag-foundation.md). |
| `media.images.enabled`, `uploadLimit` | Admin controls; editor and upload utility. | Boolean and integer validated; upload enablement/size enforced in `processMedia`; gallery and attachment policies are not separately gated. |
| `media.audio.enabled`, `uploadLimit` | Admin controls; editor and upload utility. | Boolean and integer validated; upload enablement/size enforced in `processMedia`. |
| `media.video.enabled`, `uploadLimit` | Admin controls; editor tab opens an unavailable page. | Values validated; no video upload API or runtime consumer found. |
| `misc.feedback.enabled`, `allowAnonymous` | Admin controls; feedback UI entry points and authenticated feedback form. | Validator accepts booleans, but the shared type narrows these fields to `true` and `false`; submit API ignores `enabled` and always requires authentication, so anonymous submission is not supported. |
| `topics.enabled` | Present in the database default only; absent from the shared contract and admin editor. | Not covered by SettingsManager validation; reconcile before strictifying the schema. |

## Hard-Coded Policy Audit

| Candidate | Classification | Evidence and rationale |
| --- | --- | --- |
| Sensitive-route request limits | Intentionally fixed application security policy | `RateLimiter` applies a five-per-minute client-address budget to selected authentication, referral, upload, and report routes. [Ticket 0065](0065-moderation-abuse-protections.md) documents the report limit; keeping abuse controls outside community settings prevents an administrator from disabling server protections. |
| Trusted proxy list | Deployment configuration | `NUXT_TRUSTED_PROXIES` reflects the deployment network boundary and is empty by default; [Ticket 0053](0053-trusted-proxy-rate-limit-client-addresses.md) documents the trust requirements. It is not a per-community option. |
| Topic posting cooldown and priority-report threshold | Configurable community policy, already implemented per topic | `topic.moderation.maxPostInterval` and `priorityReportThreshold` are edited and enforced in topic workflows ([Ticket 0066](0066-community-moderation-defaults.md)). Do not duplicate them in AppSettings; global `moderation.threshold` is for moderator-request approval. |
| Content tag and visibility vocabularies | Intentionally fixed product contract | Supported tags are `nsfw` and `spoiler`, and modes are `show`, `mask`, and `filter`. Communities configure visibility defaults, but adding tag types requires coordinated schema, validation, and UI support ([Ticket 0016](0016-content-visibility-controls.md)). |
| Role, ownership, and moderator-scope checks | Intentionally fixed security policy | Server routes and managers authorize actions from current roles, ownership, and topic assignments. These checks must remain authoritative rather than becoming community-controlled settings. |
| UI and notification preferences | User-level preferences, not community policy | Hover behavior, hint duration, and notification delivery belong to `UserSettings`; they should not be duplicated in AppSettings. |

No additional AppSettings fields are recommended by this scan; the actionable mismatches and inactive controls are recorded in Preliminary Findings.

## Relevant Files
- shared/types/index.ts
- app/pages/admin/settings.vue
- server/utils/SettingsManager.ts
- server/utils/RateLimiter.ts
- server/middleware/protection.ts
- server/utils/clientAddress.ts
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
- server/api/topic/[topic]/update.ts
- server/api/topic/[topic]/reports.ts
- server/utils/ModerationManager.ts
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
- app/pages/feed/home.vue
- app/pages/feed/search.vue
- app/pages/feed/topics.vue
- app/pages/feed/posts.vue
- app/pages/feed/threads.vue
- app/pages/feed/gallery.vue
- app/pages/feed/audio.vue
- app/components/system/Feedback.client.vue
- app/pages/contact.vue
- server/api/feed/search.ts
- server/api/feedback/submit.ts
- tests/parallel/feedback.server.test.ts
- server/utils/repos/UserSettingsManager.ts
- docs/tickets/completed/0016-content-visibility-controls.md
- docs/tickets/completed/0053-trusted-proxy-rate-limit-client-addresses.md
- docs/tickets/completed/0064-anti-spam-defaults.md
- docs/tickets/completed/0065-moderation-abuse-protections.md
- docs/tickets/completed/0066-community-moderation-defaults.md

## Progress Log
- 2026-11-13: Prioritized findings, resolved feed and anonymous-feedback behavior, linked existing feature work, created follow-up Tickets 0101-0104, and completed the audit.
- 2026-11-13: Classified fixed rate limits, deployment proxy trust, existing per-topic policies, product tag/mode enums, authorization rules, and user-level preferences; recorded the feedback type mismatch. Recommendation prioritization remains.
- 2026-11-13: Completed the AppSettings field map and traced feed, publishing, feedback, and remaining flag/limit paths; next is the hard-coded-policy scan.
- 2026-11-13: Traced feed, publishing, and feedback settings through UI, direct routes, and API boundaries; added findings and inventory subtasks.
- 2026-11-13: Updated investigation progress and linked the dependency sequence 0098 -> 0100 -> 0099.
- 2026-11-13: Added the strict AppSettings schema finding and linked follow-up Ticket 0100.
- 2026-11-13: Verified initial enforcement findings for media tokens/images, voting, topic rules, moderator capacity, email spool limits, and nested settings schema.
- 2026-11-13: Ticket created.