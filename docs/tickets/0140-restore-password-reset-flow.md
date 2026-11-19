# Ticket 0140: Restore Password Reset Flow

## Status
- State: Planned
- Priority: High
- Next: Trace the reset page's nested route and parent authentication middleware.

## Goal
Make emailed password-reset links usable without an authenticated session while keeping other settings routes protected, and provide a working way to cancel the reset flow.

## Requirements
- [ ] A signed-out user can open `/settings/reset-password?id=...` from an email, while other protected settings routes remain inaccessible.
- [ ] Cancel exits the reset flow without submitting a password change.
- [ ] Browser coverage verifies direct signed-out entry, cancellation, and continued reset-form functionality.

## Tasks
- [ ] Adjust the route structure or parent middleware so the reset form is public without exposing settings tools.
- [ ] Implement a cancel action that returns to an appropriate signed-out destination.
- [ ] Add browser regression coverage for direct entry, cancel, and protected settings routes.
- [ ] Verify existing reset-token validation, expiry, single-use, and session invalidation behavior remains intact.

## Notes
- The reset email links to `/settings/reset-password?id=...`, but `app/pages/settings.vue` aborts navigation to every `/settings` path for signed-out users.
- The reset form's Cancel button currently has no handler.
- Preserve the password-reset guarantees covered by completed [0012](completed/0012-revoke-all-sessions.md).

## Relevant Files
- app/pages/settings.vue
- app/pages/settings/reset-password.vue
- server/api/profile/password/reset.ts
- tests/sequential/21-account.browser.test.ts

## Progress Log
- 2026-11-19: Ticket created from the settings audit in [0090](completed/0090-core-path-todo-audit.md).