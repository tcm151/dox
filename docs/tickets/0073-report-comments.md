# Ticket 0073: Allow Comments to Be Reported

## Status
- State: Planned
- Priority: Medium
- Next: Define comment report ownership, topic scope, and moderation status behavior

## Dependencies
- [0072](0072-gallery-comments.md): Establishes a consistent post-or-gallery comment target before reports are added for comments.

## Goal
Allow users to report comments and let moderators review them through the existing report workflow, whether the comment belongs to a post or gallery discussion.

## Requirements
- [ ] Users can submit a report against a comment.
- [ ] Comment reports identify the comment author as the subject owner and inherit topic scope from the containing post or gallery.
- [ ] Moderators can review comment reports in the appropriate global and topic-scoped queues.
- [ ] Removing or restoring a reported comment uses the shared content status workflow and preserves the comment's replies and discussion context.

## Tasks
- [ ] Extend report subject handling and computed owner/topic fields to support comments.
- [ ] Apply report resolution and appeal transitions to comment status without changing the containing post or gallery status.
- [ ] Add comment report entry points and render comment subjects in moderator report views.
- [ ] Add integration coverage for comment report submission, topic scope, removal, restoration, and authorization.

## Notes
- Applies to comments on posts and galleries.
- Ticket 0018 covers conversation controls and thread reporting; this ticket establishes comment reporting for those surfaces.

## Relevant Files
- server/utils/ReportManager.ts
- server/api/report/
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue
- shared/types/index.ts
- server/assets/schema.surql

## Progress Log
- 2026-10-29: Ticket created.
