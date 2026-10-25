# Ticket 0061: Account Switch Data Refresh

## Status
- State: In Progress
- Priority: Medium
- Next: Resume browser regression validation after Ticket 0062 provides the shared browser test suite.

## Dependencies
- [0062](0062-browser-validation-test-suite.md): Provides the reusable browser runner and fixtures needed for account-switch regression coverage.

## Goal
Refresh account-dependent views when a user logs in or switches profiles, without a full router reload. Ensure data from the previous account is not left visible under the new identity.

## Requirements
- [x] Mounted account-dependent requests use the newly selected session and refresh after login or account switch.
- [x] Private data from the previous account is cleared or withheld while the new identity's requests are pending or fail.
- [ ] Account switching preserves the current route and unrelated public page state without reloading the full application.
- [ ] Focused tests cover switching between two users with different private data and a failed refresh.

## Tasks
- [x] Inventory account-dependent datasources and existing authentication events.
- [x] Design and implement targeted refresh or hydration for mounted consumers.
- [x] Clear or gate prior-account private results during identity changes.
- [ ] Add focused validation for successful switches, failed requests, and public-page state preservation.

## Notes
- Ticket 0002 makes datasource authorization headers reactive; this ticket covers refreshing already-mounted data after the identity changes.
- Avoid using a full router reload as the refresh mechanism.

## Relevant Files
- app/app.vue
- app/utils/session.ts
- app/utils/data.ts
- app/components/system/UserManager.client.vue
- app/pages/inbox.vue

## Progress Log
- 2026-10-25: Deferred durable browser regression coverage until the generic browser validation test suite in Ticket 0062 is available.
- 2026-10-25: Confirmed reactive auth headers refetch mounted data but leave old inbox items visible while pending. `useDatasource` now clears on account identity changes; browser checks confirmed stale items disappear during pending and failed requests, then restore after refresh. Automated browser regression coverage remains.
- 2026-10-25: Ticket created.
