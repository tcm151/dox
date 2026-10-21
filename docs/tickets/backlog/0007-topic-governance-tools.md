# Ticket 0007: Build Topic Governance Tools

## Status
- State: Planned
- Priority: Medium
- Next: Split into rename/archive/moderator-assignment sub-features

## Goal
Deliver moderator topic governance controls for lifecycle and safety management.

## Requirements
- [ ] Moderators can perform approved topic governance actions.
- [ ] Actions are role-gated and validated server-side.
- [ ] Topic UI clearly shows governance state where relevant.

## Tasks
- [ ] Implement topic rename request/approval flow.
- [ ] Implement archive/lock controls and enforcement.
- [ ] Add moderator assignment management in topic tools.

## Notes

## Relevant Files
- app/pages/topic/[topic]/profile.vue
- app/pages/topic/[topic]/index.vue
- server/api/topic/[topic]/update.ts
- server/api/topic/[topic]/request-moderation.ts

## Progress Log
- 2026-04-13: Ticket created.
