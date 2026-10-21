# Ticket 0012: Revoke All Active Sessions

## Status
- State: Planned
- Priority: High
- Next: Enforce the 14-day session lifetime during token authentication.

## Goal
Let users recover account control by revoking sessions from settings or resetting their password. Reject expired sessions on every protected request, without waiting for another login to clean them up.

## Requirements
- [ ] User can revoke all sessions except current one (or all, if intended).
- [ ] Revoked sessions are immediately rejected by protected endpoints.
- [ ] Sessions older than 14 days are rejected during authentication even if the account has not logged in again.
- [ ] A successful password reset invalidates every existing session for that account.
- [ ] A failed or rejected password reset does not change the password or revoke sessions.
- [ ] UI clearly confirms completion.

## Tasks
- [ ] Add an age check to token authentication and retain login-time cleanup only as housekeeping.
- [ ] Reuse account-wide session invalidation after a successful password reset; keep password replacement, reset consumption, and revocation consistent on failure.
- [ ] Add revoke-all endpoint or extend existing session APIs.
- [ ] Wire settings UI action and confirmation flow.
- [ ] Test active, invalidated, and expired tokens, the 14-day boundary, and isolation between accounts.
- [ ] Test that old tokens fail immediately after password reset and a new login still works.

## Notes
- `SessionManager.add` deletes sessions older than 14 days when another session is created. `authenticateToken` checks invalidation but currently does not check age.
- Password reset updates the password and marks the reset request used without invalidating existing sessions.
- Expiry enforcement and password-reset revocation can ship before the new settings UI.

## Relevant Files
- app/pages/settings.vue
- app/utils/session.ts
- server/utils/auth.ts
- server/utils/repos/SessionManager.ts
- server/api/profile/logout.ts
- server/api/profile/password/confirm.ts
- server/assets/schema.surql

## Progress Log
- 2026-10-21: Added authentication-time expiry and password-reset session revocation from the application review.
- 2026-04-13: Ticket created.
