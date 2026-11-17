# Ticket 0073: Allow Comments to Be Reported

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0072](0072-gallery-comments.md): Establishes a consistent post-or-gallery comment target before reports are added for comments.

## Goal
Allow users to report comments and let moderators review them through the existing report workflow, whether the comment belongs to a post or gallery discussion.

## Requirements
- [x] Users can submit a report against a comment.
- [x] Comment reports identify the comment author as the subject owner and inherit topic scope from the containing post or gallery.
- [x] Moderators can review comment reports in the appropriate global and topic-scoped queues.
- [x] Removing or restoring a reported comment uses the shared content status workflow and preserves the comment's replies and discussion context.

## Tasks
- [x] Extend report subject handling and computed owner/topic fields to support comments.
- [x] Apply report resolution and appeal transitions to comment status without changing the containing post or gallery status.
- [x] Add comment report entry points and render comment subjects in moderator report views.
- [x] Add integration coverage for comment report submission, topic scope, removal, restoration, and authorization.

## Notes
- Applies to comments on posts and galleries.
- Comment reports inherit topics from their containing post or gallery; moderators cannot remove those topic associations from a comment report.
- Quarantined comments remain in their discussion tree so replies and context are preserved, but their text is hidden and excluded from search until restored.
- Ticket 0018 covers conversation controls and thread reporting; this ticket establishes comment reporting for those surfaces.

## Relevant Files
- server/utils/ReportManager.ts
- server/api/report/
- server/api/moderator/reports.ts
- server/api/topic/[topic]/reports.ts
- app/components/system/previews/CommentPreview.vue
- app/components/lists/ReportQueueItem.vue
- app/pages/post/components/CommentSection.vue
- app/components/system/ExtraOptions.vue
- shared/types/index.ts
- app/utils/moderation.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.2.surql
- tests/parallel/reports.server.test.ts

## Progress Log
- 2026-10-30: Implemented comment reporting for post and gallery discussions, including inherited topic scope, moderator queue rendering, comment-only quarantine/restoration, preserved replies, and focused UI options. `yarn test` passed 65/65 and `yarn typecheck` passed.
- 2026-10-29: Ticket created.