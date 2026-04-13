# Ticket 0013: Account Archive/Delete Flow

## Status
- State: Todo
- Priority: Medium
- Next action: Define archive vs delete behavior and retained content rules

## Goal
Provide a user-controlled account exit flow while preserving forum integrity and moderation traceability.

## Done Looks Like
- [ ] User can trigger account archive/delete from settings.
- [ ] Content retention behavior is consistent and documented.
- [ ] Auth/session state is safely invalidated after action.

## Tasks
- [ ] Define account state transitions and data retention rules.
- [ ] Implement API handler with confirmations and safeguards.
- [ ] Add settings UI with warning text and irreversible-action prompts.

## Notes

## Relevant Files
- [app/pages/settings.vue](../../app/pages/settings.vue)
- [server/api/profile/account.ts](../../server/api/profile/account.ts)
- [server/api/profile/logout.ts](../../server/api/profile/logout.ts)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


