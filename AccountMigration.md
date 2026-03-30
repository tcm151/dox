# Account Migration Plan

## Goal

Move sensitive credentials and identity fields out of the `user` record and into `account`, so regular `user` fetches no longer include email/password data.

## Last 6 Commits Review (2026-03-30)

Reviewed commits:

1. `4ac441d` merge from `dev`
2. `d3821d8` start on account table migration
3. `953c67a` UI alignment (non-auth)
4. `fa4d11d` validation updates
5. `808e16a` schema ordering updates
6. `bacae5d` repository-based auth refactor

Commit impact on this migration:

1. `d3821d8` introduced `Account`, `Session.account`, and account schema definitions.
2. `bacae5d` moved auth responsibilities into repository classes:
   - `server/utils/repos/UserManager.ts`
   - `server/utils/repos/SessionManager.ts`
   - `server/utils/repos/ReferralManager.ts`
3. `shared/types/index.ts` now removes `email` from `User`, but runtime auth/data paths still depend on `user.email`/`user.password` in multiple server and client flows.
4. `server/assets/migrations.surql` no longer drops `account`; previous risk note about `REMOVE TABLE IF EXISTS account` is obsolete.

## Current State (Observed Drift)

1. Shared types and schema already model `Account` and `Session.account`.
2. Runtime auth has been refactored to repository classes, but still creates and validates credentials directly on `user`.
3. Runtime sessions still use `session.user` and `FETCH user` in `SessionManager` despite schema and types using `session.account`.
4. Startup default admin seed in `server/plugins/01.migrations.server.ts` still writes `user.email` and `user.password`.
5. Password reset and confirm-email paths still rely on `user.email` and `user.password`.
6. Client settings profile still references `session.user.email` even though `User` type no longer includes `email`.

## Target Data Model

### User (public profile)
- Keep: profile and community fields (`name`, `link`, `description`, `roles`, `traits`, etc.)
- Remove: `email`, `password`

### Account (sensitive identity)
- `id`
- `email` (unique)
- `password` (argon hash)
- `user` (unique `record<user>`)

### Session (auth token record)
- `id`
- `account` (`record<account>`)
- `time`
- `invalidated`

## Rollout Strategy (Phased)

## Phase 0: Preflight and Safety

1. Freeze auth-related writes during migration window or run in a maintenance window.
2. Back up DB before migration.
3. Verify no migration reintroduces destructive account-table changes in future merges.
4. Keep migration scripts idempotent (safe to run multiple times).

## Phase 1: Schema Alignment (Backward Compatible)

1. Ensure `account` table exists with indexes:
   - unique `account.email`
   - unique `account.user`
2. Ensure `session.account` exists.
3. Temporarily keep legacy fields where needed for a dual-read window:
   - `session.user` (optional short-lived compatibility)
   - `user.email` / `user.password` until backfill and cutover complete
4. Update shared contracts for transitional state if needed (example: `Session` may support both `account` and legacy `user` during rollout).

## Phase 2: Data Backfill

Backfill accounts from existing users.

Example migration query:

```sql
-- Create account rows for users that still carry credentials.
FOR $u IN (SELECT id, email, password FROM user WHERE email != NONE AND password != NONE) {
    IF !record::exists(type::thing("account", record::id($u.id))) {
        CREATE type::thing("account", record::id($u.id)) SET
            user = $u.id,
            email = $u.email,
            password = $u.password;
    };
};

-- Backfill sessions to point at account.
UPDATE session SET
    account = type::thing("account", record::id(user))
WHERE account = NONE AND user != NONE;
```

Validation checks before proceeding:

```sql
-- Must be 0 before cleanup.
RETURN {
  users_without_account: array::len(SELECT VALUE id FROM user WHERE id NOT IN (SELECT VALUE user FROM account)),
  sessions_without_account: array::len(SELECT VALUE id FROM session WHERE account = NONE)
};
```

## Phase 3: Auth and Session Code Cutover

Update repository-driven auth flow to read credentials from `account` and sessions from `session.account`.

### Login flow changes

Current behavior: compare password on `user.password`.

Target behavior:
1. Find account by `account.email = $id` OR by joined `account.user.name = $id`.
2. Compare `crypto::argon2::compare(account.password, $password)`.
3. Create session with `account = $account.id`.
4. Return sanitized `user` object (not account password/hash).

Example query shape:

```sql
SELECT account.*, user.*
FROM account
FETCH user
WHERE (email = $id OR user.name = $id)
AND crypto::argon2::compare(password, $password)
LIMIT 1;
```

### Session authentication changes

Current behavior: `SELECT * FROM session FETCH user`.

Target behavior: `SELECT * FROM session FETCH account, account.user` and return `account.user` as authenticated profile.

### Session invalidation changes

Current behavior: invalidate by `session.user`.

Target behavior: invalidate by `session.account.user` or by account lookup first.

## Phase 4: Registration and Bootstrap Cutover

### Registration (`server/utils/auth.ts` + `server/utils/repos/UserManager.ts`)

Current behavior: create `user` with `email` and hashed `password` directly on `user`.

Target behavior:
1. Create `user` with non-sensitive profile fields only.
2. Create linked `account` with `email`, hashed `password`, and `user`.
3. Create `session` with `account`.

Example transaction pattern:

```sql
BEGIN TRANSACTION;

LET $user = (CREATE user SET
    name = $username
);

LET $account = (CREATE account SET
    user = $user.id,
    email = $email,
    password = crypto::argon2::generate($password)
);

LET $session = (CREATE session SET
    account = $account.id
);

COMMIT TRANSACTION;
RETURN { user: $user, account: $account, session: $session };
```

### Default admin seed (`server/plugins/01.migrations.server.ts`)

Current behavior: one `CREATE user` with email/password.

Target behavior: create user + account pair, then grant roles/traits on user only.

## Phase 5: Password and Confirmation Flows

### Password reset (`server/api/profile/password/reset.ts`)

Current behavior:
- Lookup `user` by name/email.
- Send to `user.email`.

Target behavior:
- Lookup account by email or account.user.name.
- Send to `account.email`.
- Prefer storing `passwordReset.account` (schema + type update) instead of `passwordReset.user`.

### Password confirm (`server/api/profile/password/confirm.ts`)

Current behavior:
- Compare request email with `$passwordReset.user.email`.
- Update `user.password`.

Target behavior:
- Compare against `$passwordReset.account.email`.
- Update `account.password`.

### Account confirmation send (`server/api/profile/confirm/send.ts`)

Current behavior uses `auth.email`.

Target behavior loads account by `auth.id` and uses `account.email`.

## Phase 6: Contract Cleanup and Hard Removal

After all reads/writes use account:

1. Remove `email` and `password` fields from `user` schema.
2. Remove legacy `session.user` field from schema/migrations.
3. Update `shared/types/index.ts`:
   - remove `email` from `User`
   - keep `Account` for sensitive fields
   - keep `Session.account`
4. Audit API responses to ensure no endpoint returns account.password.

Cleanup example:

```sql
REMOVE FIELD IF EXISTS email ON TABLE user;
REMOVE FIELD IF EXISTS password ON TABLE user;
UPDATE user SET email = NONE, password = NONE
WHERE email != NONE OR password != NONE;

REMOVE FIELD IF EXISTS user ON TABLE session;
UPDATE session SET user = NONE WHERE user != NONE;
```

## Worklist by Area

## Shared contracts

1. `shared/types/index.ts`
   - Remove `email` from `User`.
   - Keep/confirm `Account` as sensitive model.
   - Confirm `Session` uses `account` only.
   - Optional transitional type for rollout (`LegacySession`).

## Database schema and migrations

1. `server/assets/schema.surql`
   - Ensure `account` is defined and indexed.
   - Ensure `session.account` is authoritative.
   - Ensure `user` no longer defines credential fields at final phase.
2. `server/assets/migrations.surql`
   - Add backfill migration blocks.
   - Keep existing account-related cleanup (`REMOVE ACCESS IF EXISTS account ON DATABASE`) under review only if DB access policies are reintroduced.
   - Add cleanup migration to null/remove legacy user credential fields.

## Server auth/session layer

1. `server/utils/auth.ts`
   - Keep as orchestration layer only (parse headers, map errors, call repo methods).
2. `server/utils/repos/UserManager.ts`
   - Change user creation to profile-only fields.
   - Add account creation linked to user for registration/bootstrap paths.
3. `server/utils/repos/SessionManager.ts`
   - Replace login credential checks to account table.
   - Create sessions with account reference.
   - Authenticate token via `FETCH account, account.user`.
   - Invalidate sessions by account/user relationship.
4. `server/utils/repos/ReferralManager.ts`
   - Validate that referral flows continue to use `user` records only and do not depend on credential fields.

## Startup/bootstrap

1. `server/plugins/01.migrations.server.ts`
   - Default admin seed to create account linked to user.

## Profile + password endpoints

1. `server/api/profile/password/reset.ts`
   - Query account for email/username resolution.
   - Use account email for recipient.
2. `server/api/profile/password/confirm.ts`
   - Update account password (not user password).
   - Validate email against account.
3. `server/api/profile/confirm/send.ts`
   - Resolve account email for authenticated user.

## Client/session consumers

1. `app/utils/session.ts`
   - Stop assuming `User.email` exists unless you intentionally expose a private profile shape.
2. `app/pages/settings/profile.vue`
   - Replace direct `session.user.email` usage with either:
     - dedicated private endpoint response (`/api/profile/private`), or
     - account-specific store field.

## API contract decisions (required)

1. Decide whether authenticated self-profile should include email:
   - Option A: never include in `User`; expose separate account endpoint.
   - Option B: include in a separate response type only for current authenticated user.
2. Keep public profile/user list endpoints sanitized.

## Commit-Aware Priority Order

1. Refactor `SessionManager` login/token methods first (highest drift vs schema/types).
2. Refactor `UserManager.create` and default-admin bootstrap to user+account split.
3. Update password reset/confirm and confirm-send endpoints to resolve account email/password.
4. Resolve client usage of `session.user.email` with a private account endpoint or separate account store.
5. Perform hard cleanup of legacy fields after dual-read period.

## Security and Reliability Checklist

For each updated write path (`register`, `login`, `password reset`, `password confirm`, `logout`):

1. Authentication/authorization still enforced.
2. Input validation unchanged or stricter.
3. Rate limits still applied to auth-sensitive routes.
4. Idempotent migrations and conflict-safe unique constraints (`account.email`, `account.user`).
5. Errors do not leak credential details.
6. Existing sessions invalidation strategy is clear during cutover.

## Suggested Implementation Order

1. Add migration blocks for account/session backfill.
2. Deploy dual-read auth code (supports old and new while backfill runs).
3. Run backfill and validate counts.
4. Switch writes to account-only.
5. Update profile/password/confirmation flows.
6. Update client usage of email/private account data.
7. Remove legacy user/session fields and compatibility code.

## Testing Plan

1. Register new user -> account created -> session.account set.
2. Login by username and by email -> both succeed using account credentials.
3. `/api/profile` does not include password/hash and does not include email once final cleanup completes.
4. Password reset end-to-end updates `account.password` only.
5. Confirmation flow still marks user trait `confirmed`.
6. Logout and invalidate-by-user/session still work.
7. Existing pre-migration users can still authenticate after backfill.
