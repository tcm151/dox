# Ticket 0113: Isolate Account Preference Request State

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Prevent preference requests started under one identity from overwriting the current account's store after an account switch or logout. Keep privacy and notification controls attached to the identity that owns their data.

## Requirements
- [x] Refresh and save results apply only to the same account and request generation that initiated them.
- [x] Switching accounts or logging out immediately removes the previous identity's preference state, and late responses cannot restore it.
- [x] Logged-out users have default in-memory settings, and preference requests only run for an authenticated account.
- [x] Loading, loaded, and saving state cannot be incorrectly cleared or enabled by an older request.
- [x] Saving under the new account cannot persist another account's preferences through stale client state.
- [x] Failed preference loads are surfaced with a usable retry path rather than silently retaining defaults as loaded data.
- [x] Tests exercise both response orders, an in-flight save, logout, failed loads, and different profile audience and notification settings.

## Tasks
- [x] Tie preference refresh and save operations to an explicit account/request ownership check.
- [x] Discard or cancel obsolete work without hiding failures from the active account's request.
- [x] Keep pending and recovery behavior consistent in preferences and filters settings pages.
- [x] Add account-switch regression coverage with controlled response delays and verify stored settings for both accounts.

## Notes
- The current store resets preferences on logout and identity changes, and applies refresh/save results only when their account and request generation still match.
- The logout/login flow has focused browser coverage. The sequential account-switch test also covers both response orders, an in-flight save, and persistence for each account.
- This is an asynchronous client-state issue, not a demonstrated server authorization bypass.
- Related completed work: [0061](0061-account-switch-data-refresh.md), [0008](0008-user-notification-preferences.md), and [0107](0107-account-profile-privacy-controls.md).
- Cross-device feed preferences remain separate under [0070](../backlog/0070-sync-feed-preferences-across-devices.md).

## Relevant Files
- app/utils/userSettings.ts
- app/utils/session.ts
- app/pages/settings/preferences.vue
- app/pages/settings/filters.vue
- server/api/profile/settings/update.ts
- server/utils/repos/UserSettingsManager.ts
- tests/parallel/settings.browser.test.ts
- tests/sequential/21-account.browser.test.ts

## Progress Log
- 2026-11-18: Added focused logged-out-default coverage and confirmed account-isolation behavior with both delayed-response orders, in-flight saves, and per-account persistence. `yarn test --file settings.browser.test.ts` passed 13/13 checks; `yarn test --sequential` passed 98/98 checks. The previously reported pending state after re-authentication was not reproduced.
- 2026-11-17: Added identity-scoped preference requests, retryable settings-load UI, delayed account-switch coverage, and focused test diagnostics. `yarn typecheck` passes. The focused account browser test gets through fixture setup but fails after re-authentication: the preference select remains disabled at `public` instead of showing the profile's saved value; artifacts are retained in `.test-output-XOJXya`. The sequential run passes the migration tests but later times out in `09-feeds.server.test.ts` at 5 seconds. Paused with the account-state failure still unresolved.
- 2026-11-17: Ticket created from the public-launch source review. Response races and persistence were not runtime-verified.
