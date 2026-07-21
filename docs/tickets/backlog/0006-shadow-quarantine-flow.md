# Ticket 0006: Implement Shadow Quarantine Flow

## Status
- State: Todo
- Priority: High
- Next action: Define trigger rules for first-time suspicious accounts

## Goal
Add a moderation safety flow that limits visibility and interaction for suspicious first-time users pending review.

## Done Looks Like
- [ ] Suspicious first-time accounts can be placed into quarantine state.
- [ ] Quarantined behavior is enforced in key write/read surfaces.
- [ ] Moderators/admins can review and clear quarantine status.

## Tasks
- [ ] Define quarantine state and trigger conditions.
- [ ] Enforce state checks in relevant API handlers.
- [ ] Add moderation UI to review and resolve quarantined accounts.

## Notes

## Relevant Files
- app/pages/admin.vue
- server/api/user/register.ts
- server/middleware/protection.ts
- shared/types/index.ts

## Progress Log
- 2026-04-13: Ticket created.


