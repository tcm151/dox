# Ticket 0086: Topic Moderator Assignment Management

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Make the moderator roster manageable from topic tools while preserving the existing moderation-request approval workflow.

## Requirements
- [x] Administrators can review and remove moderators from a topic.
- [x] Administrators can open any topic profile from the admin topics list.
- [x] Admins and assigned moderators can reach Profile, Moderators, and Reports from the public topic page.
- [x] Only admins can remove moderators from a topic; topic moderators cannot remove other moderators.
- [x] Assignment changes are role-gated and validated server-side.
- [x] Topic tools clearly show the current moderator roster and assignment outcomes.
- [x] Moderator tools use nested Profile, Moderators, and Reports pages under `/topic/[topic]/tools`; the public topic page remains separate.
- [x] The existing moderator request and approval flow remains the path for adding moderators.
- [x] Tests cover authorization, assignment changes, and preservation of unrelated moderator assignments.

## Tasks
- [x] Define moderator-removal permissions: only admins can remove topic moderators.
- [x] Decide whether removing a user's final topic assignment also removes their global moderator role.
- [x] Implement the admin-only moderator removal API and global-role cleanup.
- [x] Move the moderator roster and admin-only removal controls to `/topic/[topic]/tools/moderators`.
- [x] Add a topic-tools parent page with shared navigation across Profile, Moderators, and Reports, keeping the public topic page separate.
- [x] Add focused API and UI tests.

## Notes
- The existing moderation-request approval flow can add a user to a topic's moderator list; this ticket covers roster management outside that flow.
- Direct admin additions are deferred; the nested Moderators page only displays moderators assigned to that topic.
- A moderator-removal vote is out of scope and should be handled by a separate future ticket.

## Relevant Files
- app/pages/admin/topics.vue
- app/pages/topic/[topic]/tools.vue
- app/pages/topic/[topic]/tools/profile.vue
- app/pages/topic/[topic]/tools/moderators.vue
- app/pages/topic/[topic]/tools/reports.vue
- server/api/topic/[topic]/
- server/api/moderator/request/
- server/assets/schema.surql
- shared/types/index.ts

## Progress Log
- 2026-11-11: Deferred direct moderator additions; the current scope is roster display and admin-only removal, with additions continuing through the existing request pipeline.
- 2026-11-11: Initially confirmed direct assignments should follow the moderator-request pipeline; direct admin additions were later deferred and requests remain the addition path.
- 2026-11-11: Confirmed that only admins can remove topic moderators; moderators cannot remove each other. A removal vote is deferred to a separate ticket.
- 2026-11-11: Ticket created.
