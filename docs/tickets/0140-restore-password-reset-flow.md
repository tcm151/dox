# Ticket 0140: Restore Password Reset Flow

## Status
- State: In Progress
- Priority: High
- Next: Run `yarn test` (sequential browser phase) in a dependency-enabled environment to verify the fix and the new regression.

## Goal
Make emailed password-reset links usable without an authenticated session while keeping profile settings protected, and provide a working way to cancel the reset flow.

## Requirements
- [x] A signed-out user can open the emailed `/profile/reset-password?id=...` URL, while protected profile settings remain inaccessible.
- [x] Cancel exits the reset flow without submitting a password change.
- [x] Browser coverage verifies direct signed-out entry, cancellation, and continued reset-form functionality.

## Tasks
- [x] Adjust the route structure or parent middleware so the reset form is public without exposing settings tools.
- [x] Implement a cancel action that returns to an appropriate signed-out destination.
- [x] Add browser regression coverage for direct entry, cancel, and protected profile routes.
- [x] Verify existing reset-token validation, expiry, single-use, and session invalidation behavior remains intact.

## Notes
- Commit `d36668f8` moved account settings and the reset page under `/profile` and changed the emailed URL. The parent in `app/pages/profile.vue` still aborts signed-out navigation to `/profile/*`. On production `v2026.6.6`, opening `/profile/reset-password` signed out showed the same Page Not Found screen as `/profile/account` instead of the reset form.
- The reset form's Cancel button still has no handler. Decide whether still-valid links issued under `/settings/reset-password` need a redirect that preserves the query.
- Decided against a legacy `/settings/reset-password` redirect: reset tokens expire 15 minutes after creation, so no link issued before the move can still be valid, and no pages remain under a settings route.
- The reset email also includes a `?report=` link that the reset page never handles; it renders the normal empty form. Out of scope here, tracked as a note for 0130.
- Keep the emailed URL. Exempt the exact reset path before the parent runs settings navigation or saves the last settings tab, and render the reset form without the settings tab strip. Leave the other profile routes guarded and the password confirmation API unchanged.
- In a fresh signed-out browser context, open the emailed path directly, check the form is visible without the settings tabs, and confirm Cancel goes to `/feed` without a password confirmation request or a token in the URL. Verify direct access to `/profile/account` remains unavailable and a valid token still completes the reset in the isolated test app.
- Ticket 0130 also tracks the reset-request flow from the Login popup and live delivery; opening the reset page does not prove that the correct account receives mail.
- Preserve the password-reset guarantees covered by completed Ticket 0012.

## Relevant Files
- app/pages/profile.vue
- app/pages/profile/reset-password.vue
- nuxt.config.ts
- server/api/profile/password/reset.ts
- server/api/profile/password/confirm.ts
- tests/sequential/21-account.browser.test.ts

## Progress Log
- 2026-11-27: Implemented the fix. The parent middleware in `app/pages/profile.vue` now returns early for the exact `/profile/reset-password` path before the auth guard and last-tab tracking, and hides the profile tab strip on that route. Cancel on the reset form now navigates to `/feed`. Added a sequential browser regression that registers an isolated account, requests a reset, reads the emailed token through the developer query route, opens the link signed out (form visible, no profile tabs), cancels without a confirmation request, confirms `/profile/account` still shows the 404 screen, completes the reset, and verifies the new password logs in while the old password and prior session fail. Source-verified only; no build, typecheck, or test run was possible in this workspace.
- 2026-11-27: Confirmed signed-out direct navigation to `/profile/reset-password` and `/profile/account` shows the app's 404 screen at the requested URL. The reset page was checked without a token; no email was requested and no form was submitted.
- 2026-11-27: Opened `/profile/reset-password` on production `v2026.6.6` while signed in and without a token. The form appeared inside the profile tabs. Clicking Cancel on the empty form left the URL and form unchanged. No reset was requested or submitted; signed-out entry was not tested.
- 2026-11-27: Documented the exact-path change, Cancel destination, and browser regression. No app changes or runtime checks were made.
- 2026-11-27: Traced the new emailed URL, profile guard, and unchanged Cancel button in the tagged source. Direct entry and reset completion were not exercised.
- 2026-11-19: Ticket created from the settings audit in [0090](completed/0090-core-path-todo-audit.md).