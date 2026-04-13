# Ticket 0012: Revoke All Active Sessions

## Status
- State: Todo
- Priority: High
- Next action: Confirm session invalidation behavior in auth utilities

## Goal
Allow users to revoke all active sessions from settings to recover account control quickly.

## Done Looks Like
- [ ] User can revoke all sessions except current one (or all, if intended).
- [ ] Revoked sessions are immediately rejected by protected endpoints.
- [ ] UI clearly confirms completion.

## Tasks
- [ ] Add revoke-all endpoint or extend existing session APIs.
- [ ] Wire settings UI action and confirmation flow.
- [ ] Add tests for revoked-token behavior.

## Notes

## Relevant Files
- [app/pages/settings.vue](../../app/pages/settings.vue)
- [app/utils/session.ts](../../app/utils/session.ts)
- [server/utils/auth.ts](../../server/utils/auth.ts)
- [server/api/profile/logout.ts](../../server/api/profile/logout.ts)

## Progress Log
- 2026-04-13: Ticket created.


