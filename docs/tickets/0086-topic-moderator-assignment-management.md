# Ticket 0086: Topic Moderator Assignment Management

## Status
- State: Planned
- Priority: Medium
- Next: Define who can directly add or remove topic moderators and how removals affect global moderator roles

## Goal
Make the moderator roster manageable from topic tools while preserving the existing moderation-request approval workflow.

## Requirements
- [ ] Authorized administrators can review and directly add or remove moderators for a topic.
- [ ] Assignment changes are role-gated and validated server-side.
- [ ] Topic tools clearly show the current moderator roster and assignment outcomes.
- [ ] The existing moderator request and approval flow continues to work independently of direct assignment controls.
- [ ] Tests cover authorization, assignment changes, and preservation of unrelated moderator assignments.

## Tasks
- [ ] Define direct-assignment permissions and the effect of removing a user's final topic assignment on their global moderator role.
- [ ] Implement role-gated assignment APIs and any required persistence changes.
- [ ] Add moderator roster controls to topic tools with clear success and failure feedback.
- [ ] Add focused API and UI tests.

## Notes
- The existing moderation-request approval flow can add a user to a topic's moderator list; this ticket covers roster management outside that flow.

## Relevant Files
- app/pages/topic/[topic]/profile.vue
- server/api/topic/[topic]/
- server/api/moderator/request/
- server/assets/schema.surql
- shared/types/index.ts

## Progress Log
- 2026-11-11: Ticket created.
