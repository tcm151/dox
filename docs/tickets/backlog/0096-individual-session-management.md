# Ticket 0096: Individual Session Management

## Status
- State: Deferred
- Priority: Medium
- Next: Define safe session-list metadata and individual revocation behavior

## Goal
Let users review their active sessions and revoke a selected session without exposing session credentials.

## Requirements
- [ ] Users can view active sessions for their own account with non-sensitive identifying metadata.
- [ ] Users can revoke a selected session, and the revoked session is immediately rejected by protected endpoints.
- [ ] Session records and API responses never expose authentication tokens or secrets.
- [ ] The UI distinguishes the current session and handles its revocation without leaving ambiguous auth state.
- [ ] Listing, revocation, account isolation, and expired-session behavior have focused coverage.

## Tasks
- [ ] Define which existing session metadata is safe and useful to display.
- [ ] Add an authenticated, account-scoped active-session listing operation.
- [ ] Add selected-session revocation using the existing invalidation semantics.
- [ ] Build settings UI for session review and revocation.
- [ ] Add focused server and UI coverage for authorization and state transitions.

## Notes
- Reuse the session expiry and invalidation behavior from Ticket 0012, which implemented revoke-other-sessions and password-reset invalidation.
- Do not add IP or device fingerprint collection as part of this ticket.

## Relevant Files
- app/pages/settings.vue
- app/utils/session.ts
- server/utils/repos/SessionManager.ts
- server/api/profile/sessions/
- tests/parallel/

## Progress Log
- 2026-11-12: Ticket created.