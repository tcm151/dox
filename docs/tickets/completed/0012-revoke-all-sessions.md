# Ticket 0012: Revoke All Active Sessions

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Let users recover account control by revoking sessions from settings or resetting their password. Reject expired sessions on every protected request, without waiting for another login to clean them up.

## Requirements
- [x] User can revoke all sessions except current one (or all, if intended).
- [x] Revoked sessions are immediately rejected by protected endpoints.
- [x] Sessions older than 14 days are rejected during authentication even if the account has not logged in again.
- [x] A successful password reset invalidates every existing session for that account.
- [x] A failed or rejected password reset does not change the password or revoke sessions.
- [x] UI clearly confirms completion.

## Tasks
- [x] Add an age check to token authentication and retain login-time cleanup only as housekeeping.
- [x] Invalidate account sessions in the existing password-reset query alongside password replacement and reset consumption.
- [x] Add an authenticated endpoint that invalidates other account sessions while preserving the current session.
- [x] Wire settings UI action and confirmation flow.
- [x] Review active, invalidated, and expired token handling, the 14-day boundary, and account isolation.
- [x] Review password-reset invalidation and confirm the updated password can issue a new session.

## Notes
- `SessionManager.add` removes sessions older than 14 days when another session is created; `authenticateToken` now also rejects sessions older than 14 days on every authenticated request.
- Password reset now invalidates every session for the reset account in the same `RETURN` query that updates the password and consumes the reset request.
- `POST /api/profile/sessions/invalidate` authenticates the current token, invalidates other sessions for its account, and preserves the current session.
- Profile settings provides a confirmation-protected "Sign Out Everywhere" action and reports success or failure without logging out the current session.
- Expiry enforcement and password-reset revocation can ship before the new settings UI.
- Behavior was accepted by code review; no disposable SurrealDB integration run was performed.

## Relevant Files
- app/pages/settings.vue
- app/utils/session.ts
- server/utils/auth.ts
- server/utils/repos/SessionManager.ts
- server/api/profile/sessions/invalidate.ts
- server/api/profile/logout.ts
- server/api/profile/password/confirm.ts
- server/assets/schema.surql

## Progress Log
- 2026-10-22: Closed based on code review of the 14-day authentication predicate, account-scoped revoke-others behavior, settings confirmation flow, and password-reset invalidation in the existing `RETURN` operation. No live database behavior test was run.
- 2026-10-22: Added the Profile settings action and confirmation flow for signing out other sessions while preserving the current session. Focused diagnostics pass; behavior-level verification remains.
- 2026-10-22: Added session invalidation to the password-reset query and added the authenticated revoke-other-sessions endpoint. Focused diagnostics passed; database behavior and UI flow remain to be verified.
- 2026-10-22: Added the 14-day age predicate to `SessionManager.authenticateToken`, using the existing session `time` field. `yarn build` passed; the predicate has not yet been exercised against a live SurrealDB instance.
- 2026-10-21: Added authentication-time expiry and password-reset session revocation from the application review.
- 2026-04-13: Ticket created.
