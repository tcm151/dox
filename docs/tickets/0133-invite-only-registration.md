# Ticket 0133: Invite-Only Registration

## Status
- State: `Planned`
- Priority: `Medium`
- Next: Define invitation policy, lifecycle, and operator workflow before implementation.

## Goal
Allow an installation to restrict new account creation to people with valid invitations, while preserving the existing registration experience when the restriction is disabled.

## Requirements
- [ ] An authorized operator can enable or disable invitation-only registration; changing the policy does not alter existing accounts.
- [ ] When enabled, both the registration page and API require a valid invitation, and registration cannot bypass the requirement through a direct API request.
- [ ] An invitation can be redeemed only once, and redemption is atomic with account creation so concurrent attempts cannot create multiple accounts.
- [ ] Authorized operators can issue and revoke invitations and review their redemption status; unauthorized users cannot manage invitations.
- [ ] Existing optional referral behavior remains distinct from invitation access, and public browsing remains available without an account.

## Tasks
- [ ] Define invitation policy, including operator permissions, invitation lifecycle, policy defaults, and registration UX.
- [ ] Add persistent invitation records and installation settings through the established schema/migration workflow.
- [ ] Add authorized invitation management and enforce invitation validation and single-use redemption across UI and API.
- [ ] Cover policy changes, unauthorized access, missing/invalid/revoked/redeemed invitations, and concurrent redemption with focused tests.

## Notes
- Assumption: invitations are operator-issued and single-use, and invitation-only mode is opt-in to preserve current open-registration behavior by default.
- The existing optional referral value is not an access credential. Preserve its separate semantics.
- Related work: [0006](0006-shadow-quarantine-flow.md), [0128](../completed/0128-verify-demo-navigation-and-hydration.md), and [0019](../completed/0019-referral-redemption-hardening.md). These are not prerequisites.

## Relevant Files
- app/pages/register.vue
- app/pages/admin/settings.vue
- app/pages/admin/users.vue
- server/api/user/register.ts
- server/assets/schema.surql
- server/utils/SettingsManager.ts
- server/utils/repos/ReferralManager.ts
- shared/types/index.ts
- tests/
- TBD

## Progress Log
- 2026-11-19: Ticket created.
