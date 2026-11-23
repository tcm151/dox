# Ticket 0135: OAuth Provider Registration and Login

## Status
- State: `Planned`
- Priority: `Medium`
- Next: Define provider configuration and account-linking behavior.

## Goal
Let people register and sign in to a ClassicForum instance with Google, Apple, or Microsoft accounts, while preserving existing password-based authentication.

## Requirements
- [ ] An operator-configured Google, Apple, or Microsoft identity provider can create a forum account and authenticate that account on later visits.
- [ ] Provider identities are uniquely associated with forum accounts; matching email addresses alone never silently link identities or merge accounts.
- [ ] An existing user can link a provider only through an authenticated forum session and a successful provider authentication.
- [ ] Provider callbacks validate the applicable OAuth/OIDC state, nonce, and PKCE protections, then establish a normal ClassicForum session without exposing provider secrets or tokens to the browser.
- [ ] Federated registration follows the same account-creation restrictions as password registration, and password registration and login continue to work.
- [ ] Provider client credentials are configured per installation, remain server-side, and unconfigured providers are not offered to users.

## Tasks
- [ ] Define provider configuration, account-linking and recovery rules, email handling, and required callback URLs.
- [ ] Add persistent provider-identity storage with uniqueness constraints and a versioned migration.
- [ ] Implement provider initiation and callback flows for Google, Apple, and Microsoft, and connect them to existing account and session workflows.
- [ ] Add provider sign-in and registration controls to the existing authentication UI while retaining password-based flows.
- [ ] Test callback validation, provider errors, duplicate identities, email collisions, account linking, session creation, and password-authentication regression.
- [ ] Document provider setup and secret configuration for instance operators.

## Notes
- Use OpenID Connect for identity where supported; OAuth authorization alone is not proof of a user's identity.
- Ticket 0133 is related: federated registration must respect any registration restrictions enabled by an instance, but it is not a prerequisite.
- Keep provider scopes limited to identity and profile data required for account creation and sign-in; do not retain provider tokens unless a documented feature requires them.

## Relevant Files
- app/components/system/Login.client.vue
- app/pages/register.vue
- app/utils/session.ts
- server/api/profile/login.ts
- server/api/user/register.ts
- server/utils/auth.ts
- server/utils/repos/SessionManager.ts
- server/utils/repos/UserManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- shared/types/index.ts
- tests/

## Progress Log
- 2026-11-19: Ticket created.
