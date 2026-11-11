# Ticket 0007: Build Topic Governance Tools

## Status
- State: In Progress
- Priority: Medium
- Next: Define moderator assignment permissions in Ticket 0086

## Dependencies
- [0084](0084-topic-rename-requests.md): Complete the topic rename request and approval workflow.
- [0085](0085-topic-lock-controls.md): Complete admin-only topic locking and new-content enforcement.
- [0086](0086-topic-moderator-assignment-management.md): Complete topic moderator roster management.

## Goal
Deliver moderator topic governance controls for lifecycle, safety, and content curation. Rules and summary history are tracked separately in Ticket 0017.

## Requirements
- [ ] Moderators can perform approved topic governance actions.
- [ ] Actions are role-gated and validated server-side.
- [ ] Topic UI clearly shows governance state where relevant.
- [ ] Moderators can feature or pin supported topic content, and those selections are visible to users.

## Tasks
- [ ] Complete [0084](0084-topic-rename-requests.md): topic rename request and approval flow.
- [x] Complete [0085](0085-topic-lock-controls.md): admin-only topic locking and enforcement.
- [ ] Complete [0086](0086-topic-moderator-assignment-management.md): moderator assignment management in topic tools.
- [ ] Add moderator controls and user-facing display for featured/pinned topic content.

## Notes
- Existing moderation-request approvals can add a user to a topic's moderator list; Ticket 0086 covers roster management outside that workflow.

## Relevant Files
- app/pages/topic/[topic]/profile.vue
- app/pages/topic/[topic]/index.vue
- server/api/topic/[topic]/update.ts
- server/api/topic/[topic]/request-moderation.ts

## Progress Log
- 2026-11-11: Completed lock-only Ticket 0085; archive/restore are outside the current scope.
- 2026-11-11: Defined distinct locked and archived behavior for Ticket 0085 and confirmed the 2026.6.2 migration target.
- 2026-11-11: Paused the rename sub-feature at the user's request and moved the immediate focus to topic lifecycle controls.
- 2026-11-11: Split rename, lifecycle, and moderator-assignment work into focused tickets; narrowed Ticket 0067's dependency to the rename workflow.
- 2026-04-13: Ticket created.
