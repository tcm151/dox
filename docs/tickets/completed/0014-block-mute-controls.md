# Ticket 0014: User And Topic Block/Mute Controls

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Let users reduce unwanted content by blocking or muting other users and topics through personal settings.

## Requirements
- [x] Users can block or mute users and topics from the appropriate settings and profile surfaces.
- [x] Feed and search results exclude matching user/topic targets while direct links remain accessible.
- [x] Server-side blocks reject user/topic actions that would otherwise notify excluded targets; moderation/admin notifications remain available.
- [x] User blocks prevent follows, comments, replies, awards, and referral claims in either direction; topic blocks prevent following, publishing, and awarding content associated with the topic.
- [x] Controls are reversible and easy to understand.

## Tasks
- [x] Define user/topic block and mute behavior, including the distinction between hiding and blocking.
- [x] Implement persistence and add/remove/list operations for user and topic targets.
- [x] Apply a single flat exclusion list to feed, pinned, search, topic-feed, and user-feed queries.
- [x] Remove existing follows on block and prevent either user from following while the block remains.
- [x] Hide blocked topic pages and remove the caller's existing topic follow.
- [x] Prevent blocked users from commenting, replying, awarding, or claiming referrals in either direction.
- [x] Prevent following or publishing to blocked topics, and prevent awards on content associated with blocked topics.
- [x] Block user/topic interactions at the server action level instead of filtering notification creation or reads.

## Notes
- Keyword muting is a deferred extension tracked in Ticket 0088 because text matching has distinct semantics and query costs.
- `UserSettingsManager.getFilteredTargets(viewer)` returns one flat array of muted/blocked user and topic IDs plus users who blocked the viewer. An empty array means no filtering; query predicates use `$excluded.len()` and `CONTAINSNONE`.
- Notifications are not filtered at creation or read time. Server-side action checks block interactions involving blocked users/topics before notification sends; moderation/admin actions remain available. Mutes continue to hide content without rejecting actions.
- User blocks remove existing follows and prevent either user from following, commenting, replying, awarding, or claiming referrals with the other. Topic blocks hide the topic page, remove the caller's follow, and prevent following, publishing new content, or awarding content associated with the topic.
- Mute and block preferences can coexist. Blocking removes existing follows; unblocking does not restore them. Schema changes are approved for the unreleased 2026.6.3 migration.
- Filter preferences use the existing `userSettings` record: `content.filters.muted` and `content.filters.blocked` each store user or topic record references.
- Settings lists support removing filters, while user and topic profile cards provide mute/block controls.

## Relevant Files
- app/pages/settings/preferences.vue
- app/components/system/ExtraOptions.vue
- server/utils/repos/UserSettingsManager.ts
- server/utils/repos/ReferralManager.ts
- server/utils/feedPagination.ts
- server/api/feed/pinned.ts
- server/api/feed/search.ts
- server/api/topic/[topic]/feed.ts
- server/api/topic/[topic]/follow.ts
- server/api/topic/[topic]/index.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- server/api/thread/[id]/quote.ts
- server/api/gallery/publish.ts
- server/api/link/add.ts
- server/api/comment/add.ts
- server/api/thread/[id]/reply.ts
- server/api/user/[id]/feed.ts
- server/api/user/[id]/follow.ts
- server/api/user/[id]/award.ts
- server/api/post/[id]/award.ts
- server/api/thread/[id]/award.ts
- server/api/gallery/[id]/award.ts
- server/api/link/[id]/award.ts
- server/api/comment/[id]/award.ts
- server/api/profile/notifications/index.ts
- docs/API.md
- shared/types/index.ts
- tests/parallel/content-filters.server.test.ts

## Progress Log
- 2026-11-16: Centralized server block assertions in `UserSettingsManager.isBlocked`, simplified target mapping and query checks, and removed redundant filter target validation, view types, and sorting. `content-filters.server.test.ts` passed 13 tests.
- 2026-11-16: Server-side blocks now reject award and referral actions between blocked users and awards on blocked-topic content. Moderation/admin notifications remain available. `content-filters.server.test.ts` passed 12 tests, `engagement.server.test.ts` passed 16 tests, and typecheck passed.
- 2026-11-16: Applied the flat exclusion list to feeds and search, documented the chosen operators, and deferred notification filtering to source-side handling.
- 2026-11-16: User blocks now prevent re-following in either direction; `content-filters.server.test.ts` passed 12 tests and typecheck passed.
- 2026-11-16: Comment and reply restrictions now use the manager-provided flat blocked-user list; the follow route uses the same list. `content-filters.server.test.ts` passed 12 tests, typecheck passed, and `git diff --check` passed.
- 2026-11-16: Topic blocks now prevent following and publishing posts, threads, quotes, galleries, and links. `content-filters.server.test.ts` passed 12 tests, typecheck passed, and `git diff --check` passed.
- 2026-11-15: Defined first-release behavior and approved including schema changes in the unreleased 2026.6.3 migration.
- 2026-11-15: Added settings filter APIs and profile/settings controls; verified user and topic mute/block persistence and follow-removal behavior.
- 2026-04-13: Ticket created.
