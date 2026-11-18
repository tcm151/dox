# Ticket 0113: Isolate Account Preference Request State

## Status
- State: Paused
- Priority: High
- Next: Investigate why preferences remain pending at their default value after returning to a profile following logout.

## Goal
Prevent preference requests started under one identity from overwriting the current account's store after an account switch or logout. Keep privacy and notification controls attached to the identity that owns their data.

## Requirements
- [ ] Refresh and save results apply only to the same account and request generation that initiated them.
- [ ] Switching accounts or logging out immediately removes the previous identity's preference state, and late responses cannot restore it.
- [ ] Loading, loaded, and saving state cannot be incorrectly cleared or enabled by an older request.
- [ ] Saving under the new account cannot persist another account's preferences through stale client state.
- [ ] Failed preference loads are surfaced with a usable retry path rather than silently retaining defaults as loaded data.
- [ ] Tests exercise both response orders, an in-flight save, logout, failed loads, and different profile audience and notification settings.

## Tasks
- [ ] Tie preference refresh and save operations to an explicit account/request ownership check.
- [ ] Discard or cancel obsolete work without hiding failures from the active account's request.
- [ ] Keep pending and recovery behavior consistent in preferences and filters settings pages.
- [ ] Add account-switch regression coverage with controlled response delays and verify stored settings for both accounts.

## Notes
- The inspected store resets preferences on identity changes but unconditionally assigns later refresh and save responses.
- A delayed response for account A can overwrite account B's loaded preferences. A subsequent save writes the supplied settings values to the currently authenticated user.
- This is an asynchronous client-state issue, not a demonstrated server authorization bypass.
- Related completed work: [0061](completed/0061-account-switch-data-refresh.md), [0008](completed/0008-user-notification-preferences.md), and [0107](completed/0107-account-profile-privacy-controls.md).
- Cross-device feed preferences remain separate under [0070](backlog/0070-sync-feed-preferences-across-devices.md).

## Relevant Files
- app/utils/userSettings.ts
- app/utils/session.ts
- app/pages/settings/preferences.vue
- app/pages/settings/filters.vue
- server/api/profile/settings/update.ts
- server/utils/repos/UserSettingsManager.ts
- tests/parallel/account.browser.test.ts
- tests/parallel/settings.browser.test.ts

## Progress Log
- 2026-11-17: Added identity-scoped preference requests, retryable settings-load UI, delayed account-switch coverage, and focused test diagnostics. `yarn typecheck` passes. The focused account browser test gets through fixture setup but fails after re-authentication: the preference select remains disabled at `public` instead of showing the profile's saved value; artifacts are retained in `.test-output-XOJXya`. The sequential run passes the migration tests but later times out in `09-feeds.server.test.ts` at 5 seconds. Paused with the account-state failure still unresolved.
- 2026-11-17: Ticket created from the public-launch source review. Response races and persistence were not runtime-verified.
