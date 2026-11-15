# Ticket 0018: Conversation Lock And Slow Mode Controls

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0072](0072-gallery-comments.md): Establishes post and gallery comment support before comment controls are added.
- [0073](0073-report-comments.md): Establishes comment reporting and moderation status behavior before this ticket adds conversation controls.

## Goal
Give moderators controls to limit replies on posts, galleries, comments, and threads, with clear lock scope and configurable slow mode.

## Requirements
- [x] Authorized moderators can lock and unlock post/gallery discussions to control new comments.
- [x] Authorized moderators can lock and unlock comments to control direct replies.
- [x] Authorized moderators can lock and unlock an individual thread; descendant-wide chain locks are deferred.
- [x] Quoting a locked thread is blocked.
- [x] Slow mode can be configured for supported discussions and is enforced for direct comments and replies to the selected thread item.
- [x] Users see clear lock and slow-mode state, and admins can review control changes in the audit log.

## Tasks
- [x] Define initial lock behavior: comment locks block direct replies; thread item locks remain local.
- [x] Define slow-mode configuration: admins manage allowed interval presets; moderators select a preset per discussion; no role bypass.
- [x] Define the per-user rate limit and discussion boundaries: one accepted submission per user per interval; comments share the post/gallery cooldown and thread replies share the target item's cooldown; quotes are separate.
- [x] Add admin-configurable slow-mode interval presets and authorized moderator operations to set or clear slow mode.
- [x] Add the shared moderation type and per-subject control table with a unique reference and cascade cleanup to the fresh schema and in-progress `2026.6.2` migration.
- [x] Add authorized moderator lock/unlock operations and audit entries for setting and clearing locks.
- [x] Enforce active locks transactionally in comment creation, thread replies, and quote creation.
- [x] Enforce slow-mode limits transactionally in comment creation and thread replies.
- [x] Add moderator controls and user-visible state to post, gallery, comment, and thread surfaces.
- [x] Add integration coverage for discussion locks, direct comment locks, thread item locks, and blocked quotes.
- [x] Add integration coverage for lock-control authorization, audit entries, and preserving slow-mode settings when unlocking.
- [x] Add integration coverage for slow-mode preset selection, authorization, clearing, and audit entries.
- [x] Add integration coverage for cooldown limits, concurrent attempts, and no role bypass.

## Notes
- Keep interaction controls separate from content `status` and report workflow state.
- Comment locks block direct replies only; descendant-wide comment locks are outside this ticket's initial scope.
- Quoting a locked thread is blocked.
- Admins configure the allowed slow-mode intervals in application settings; moderators select an allowed interval for a discussion. Slow-mode enforcement has no role-based bypass.
- Initial slow-mode interval presets are 30, 60, 300, and 900 seconds.
- Each user can submit once per selected interval on the moderated item. Comments on a post/gallery share that item's cooldown; replies share the cooldown of the exact thread item they target. Quotes are separate root threads and are not rate-limited as replies.
- Thread and comment reporting already use the shared report workflow; this ticket focuses on interaction controls.
- Comment context is a post or gallery; comment replies use `replyTo`. Thread chains use `replyTo`, while quotes create a separate root thread.
- Recursive thread-chain locking is deferred to [Ticket 0077](0077-recursive-thread-chain-locks.md); thread locks in this ticket are item-only.

## Relevant Files
- app/pages/thread/[id].vue
- app/pages/admin/settings.vue
- app/utils/settings.ts
- app/pages/post/[id].vue
- app/pages/gallery/[id].vue
- app/pages/post/components/CommentSection.vue
- server/api/comment/add.ts
- server/api/thread/[id]/reply.ts
- server/api/thread/[id]/quote.ts
- server/api/moderation/[type]/[id]/index.ts
- server/api/moderation/[type]/[id]/lock/apply.ts
- server/api/moderation/[type]/[id]/lock/clear.ts
- server/api/moderation/[type]/[id]/slow/apply.ts
- server/api/moderation/[type]/[id]/slow/clear.ts
- server/utils/ModerationManager.ts
- server/assets/migrations/
- server/assets/schema.surql
- shared/types/index.ts
- tests/parallel/posts.test.ts
- tests/parallel/galleries.test.ts
- tests/parallel/moderation.test.ts
- tests/parallel/settings.test.ts
- tests/parallel/threads.test.ts

## Progress Log
- 2026-11-01: Completed moderation controls and state refresh across post, gallery, comment, and thread surfaces; aligned audit review with the admin-only ModeratorLog convention.
- 2026-11-01: Kept thread locks and slow mode item-only, removed detail pagination, and moved chain assembly into SQL after isolating SurrealDB's computation-depth interaction. Recursive chain locks remain deferred to Ticket 0077.
- 2026-10-30: Enforced comment and root-thread slow-mode cooldowns from existing submission timestamps, with transactional serialization through the moderation record. Post tests passed (12/12), thread tests passed (16/16), typecheck and migration replay passed. Full suite was 70/72, with gallery-publishing and exact-phrase-search failures outside this work.
- 2026-10-30: Added per-discussion slow-mode selection and clearing for admins and assigned topic moderators, constrained selections to admin-configured presets, and audited changes. Focused moderation tests passed (14/14).
- 2026-10-30: Added topic-authorized lock/unlock operations for post, gallery, comment, and thread controls, with admin-global access and transactional audit entries.
- 2026-10-30: Focused moderation tests passed (14/14) and typecheck passed. The latest full suite was 67/69, with gallery-publishing and exact-phrase-search expectation failures outside this task's changed files.
- 2026-10-30: Added backend lock enforcement for comment contexts, direct comment replies, thread replies, and thread quotes, with integration coverage. Typecheck passes; latest full suite run was 66/67 with a report rate-limit expectation failure outside this change.
- 2026-10-30: Updated scope after Tickets 0072 and 0073 completed; confirmed direct-only comment locks and blocking quotes to locked threads.
- 2026-04-13: Ticket created.