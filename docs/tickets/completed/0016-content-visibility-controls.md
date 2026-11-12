# Ticket 0016: Content Tagging And Visibility Controls

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Implement NSFW/spoiler tagging and configurable visibility policies for community and user preferences, while keeping published tags immutable to authors and append-only for staff.

## Requirements
- [x] Authors can select tags for posts, threads, and galleries before publishing and cannot change them through later edits.
- [x] Only NSFW and spoiler tags are accepted; admins can add tags to existing content and moderators are limited to assigned topics.
- [x] Community defaults and user overrides support show, mask, and filter modes, with safe mask defaults and inherit behavior.
- [x] Visibility rules are applied to previews, detail pages, feeds, and search, with direct links allowing content to be revealed.
- [x] Shared types, schema, migration, and focused tests cover the tag and visibility contracts.

## Tasks
- [x] Add tag and visibility fields to shared types, schema, and migration; restrict supported tags to NSFW and spoiler.
- [x] Add tag selectors to publishing and draft flows, and preserve tags during owner edits.
- [x] Add staff tag operations through ModerationManager with assigned-topic checks for moderators.
- [x] Add community and user visibility settings and apply them to rendering, feeds, and search.
- [x] Add focused tests for tag persistence, authorization, settings, and visibility behavior.

## Notes
- Only NSFW and spoiler tags are supported; the sensitive tag was removed.
- Community defaults use mask, while users can inherit the community policy or choose a personal mode.
- Comments inherit visibility tags from their parent post or gallery.
- Migration changes are consolidated into the confirmed in-progress `2026.6.2` migration.

## Relevant Files
- `app/components/form/ContentTagSelector.vue`
- `app/components/system/ContentVisibility.vue`
- `app/components/system/ExtraOptions.vue`
- `app/components/lists/Feed.vue`
- `app/pages/admin/settings.vue`
- `app/pages/settings/preferences.vue`
- `app/pages/editor/post.vue`
- `app/pages/editor/thread.vue`
- `app/pages/editor/image.vue`
- `app/pages/post/[id].vue`
- `app/pages/thread/[id].vue`
- `app/pages/gallery/[id].vue`
- `server/utils/ModerationManager.ts`
- `server/utils/SettingsManager.ts`
- `server/utils/repos/UserSettingsManager.ts`
- `server/assets/schema.surql`
- `server/assets/migrations/2026.6.2.surql`
- `shared/types/index.ts`
- `tests/parallel/posts.server.test.ts`
- `tests/parallel/threads.server.test.ts`
- `tests/parallel/galleries.server.test.ts`
- `tests/parallel/moderation.server.test.ts`
- `tests/parallel/settings.server.test.ts`

## Progress Log
- 2026-11-12: Completed NSFW/spoiler tagging, staff add-only moderation, and community/user visibility settings with feed/search and rendering support.
- 2026-11-02: Audited application and user settings; neither currently models visibility policy, and existing spoiler rendering is presentation-only.
- 2026-04-13: Ticket created.