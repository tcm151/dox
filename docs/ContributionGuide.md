# Contribution Guide

Follow these steps to build and run the site on your local machine.

For suspected vulnerabilities, use the private reporting process in [SECURITY.md](../SECURITY.md); do not report them in public issues.

## 1. Setup Repository

Clone the repo from GitHub into your development environment. You should use a recent Node.js LTS release and yarn.

I recommend using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage your Node.js installations. You can install yarn globally with:

```bash
npm install --global yarn
```

## 2. Choose Your Database Mode

ClassicForum supports two SurrealDB modes:

- **remote**: connect to an external SurrealDB server over RPC.
- **embedded**: run SurrealDB from inside the app process via a local engine.

Choose one mode and set `NUXT_SURREAL_INFO_TYPE` accordingly.
For SurrealDB documentation and ClassicForum-specific database configuration, see the [SurrealDB guide](SurrealDB.md).

## 3. Environment Variables

Create a `.env` file with these parameters:

```bash
PORT= # the port of your running Nuxt instance. Ex: 3000
NUXT_PUBLIC_BASE_URL= # the public address of your running Nuxt instance. Ex: http://localhost:3000

NUXT_PUBLIC_SITE_TITLE= # the title you'd like to be displayed in the browser tab
NUXT_PUBLIC_SITE_TITLE_SHORT= # the shortened title used when space is limited

NUXT_SURREAL_INFO_TYPE= # the SurrealDB instance type. Ex: remote or embedded
# remote example: http://localhost:8000/rpc
# embedded example: rocksdb://./database/default.db
NUXT_SURREAL_INFO_URL=
NUXT_SURREAL_INFO_NAMESPACE= # the namespace you'd like to use. Ex: example
NUXT_SURREAL_INFO_DATABASE= # the database you'd like to use. Ex: development
NUXT_SURREAL_INFO_USERNAME= # your SurrealDB root username, when remote
NUXT_SURREAL_INFO_PASSWORD= # your SurrealDB root password, when remote

NUXT_SURREAL_ADMIN_EMAIL= # required on an empty database; email for the default account
NUXT_SURREAL_ADMIN_NAME= # required on an empty database; name for the default account
NUXT_SURREAL_ADMIN_PASSWORD= # required on an empty database; password for the default account

NUXT_DATA_PATH= # the path where media and embedded databases are saved

# OPTIONAL, only supply if needing to send emails
# You can use your personal gmail account as an SMTP server
# https://support.google.com/a/answer/176600?
NUXT_SMTP_HOST=
NUXT_SMTP_PORT=
NUXT_SMTP_USER=
NUXT_SMTP_PASS=
NUXT_SMTP_TITLE=
```

Use these canonical `NUXT_*` names in `.env`. Nuxt reads them at runtime; restart the app after changing a value. No rebuild is needed.

## 4. Start SurrealDB (Remote Mode Only)

If `NUXT_SURREAL_INFO_TYPE=remote`, start SurrealDB separately:

```bash
surreal start --user <username> --pass <password> <protocol>://<path_to_database_file>
```

If `NUXT_SURREAL_INFO_TYPE=embedded`, skip this step.

## 5. Run the App

Start the app:

```bash
yarn dev
```

If setup is correct, logs will show a successful connection message including namespace, database, and URL. Confirm startup completed by requesting `/api/health`; a healthy response has `app` and `database` set to `ready` and includes the running version.

```
Connecting to remote/embedded instance...
Connected to <namespace>:<database> @ <url>.
```

### Automated Integration Tests

Install the project dependencies, then run the integration smoke tests:

```bash
yarn install
yarn test
```

The test command builds and starts one Nuxt/Nitro server with an embedded SurrealDB database and media directory under a unique `.test-output-*` folder. It does not use the configured development or production database. The runner waits for `/api/health` to report both the app and database as ready, then stops the server and removes the temporary folder.

Add HTTP integration tests under `tests/` and import `fetch` from `tests/test-server.ts` to make requests against the shared server. The runner executes `health.test.ts` first, then `.test.ts` files in `tests/sequential/` one at a time in filename order, then tests in `tests/parallel/` if the earlier phases pass. Keep only setup or shared-state checks sequential, such as default-account login, example-user seeding, schema migration replay, and feed pagination; group independent tests by feature area in `tests/parallel/`. Sequential tests can store and retrieve named user sessions with `stashUser` and `grabUser`; each named user is stored separately under the temporary test-data folder and removed at teardown. Assert status and response data; clean up records created for a test unless later sequential checks intentionally depend on them. Parallel tests should use independent or unique test data and session keys.

## 6. Sync Database Schema

Schema and migrations are applied automatically on application startup by [server/plugins/01.startup.server.ts](../server/plugins/01.startup.server.ts). A fresh database receives [server/assets/schema.surql](../server/assets/schema.surql); later changes run from versioned files in `server/assets/migrations/`.

If startup succeeds, you do not need to run manual `surreal import` commands.

If startup fails, check the app logs and `/api/health`. A failed migration reports its attempted version there; after migrations complete, the health response reports the app version. Resolve the database, migration, or default account issue before retrying startup.

## 7. Add a Database Migration

Group related database changes that ship together into one `YYYY.M.patch.surql` migration rather than creating a new migration for every small schema change. Before a migration is deployed, consolidate its release's pending changes into that migration. After deployment, leave it unchanged and create a migration for the next release. Migrations must be safe to run repeatedly; when revising an undeployed migration, rerun it and the later migration suffix because the refreshed version timestamp controls startup ordering.

Wrap the migration and its version record in one transaction. Use idempotent schema operations, make data backfills update only rows that still need them, and upsert the file version only after its changes succeed:

```sql
BEGIN TRANSACTION;

-- Schema or data changes go here.

UPSERT migration SET version = 'YYYY.minor.patch', time = time::now()
WHERE version = 'YYYY.minor.patch';
COMMIT;
```

Test fresh startup, upgrade from the previous release, replay the consolidated migration, and replay a short migration suffix when one exists. Confirm replay does not duplicate version records or overwrite existing data. For changes to post deletion, also verify that `post.deleted` remains defined and works when a post with comments is deleted.

## 8. In-App Query Portal

ClassicForum includes a built-in query portal at `/developer/query` (see [app/pages/developer/query.vue](../app/pages/developer/query.vue)) so you can inspect and run queries against your database directly from the application.

- Access is always restricted to authenticated users with the `developer` role, including in development mode (see [app/pages/developer.vue](../app/pages/developer.vue) and [server/api/developer/database/query.ts](../server/api/developer/database/query.ts)).
- Queries that target the `developerQuery` table are blocked to preserve audit integrity (see [server/api/developer/database/query.ts](../server/api/developer/database/query.ts)).

## 9. Default Account

On an empty database, set all three `DEFAULT_USER_*` values before starting the app. Startup creates the default account with the `moderator`, `admin`, and `developer` roles.

Once the app is running:

1. Sign in with the default account credentials from `.env`.
2. Open `/profile` to confirm authentication is working.
3. Open `/developer/query` to confirm developer access.

If the database already contains an account, leave all three `DEFAULT_USER_*` values blank. Startup will not create another default account.

## 10. Troubleshooting

- **`Database URL was [...] Check environment variables.`**
    - Verify `NUXT_SURREAL_INFO_TYPE` and `NUXT_SURREAL_INFO_URL` are set correctly.
    - If `NUXT_SURREAL_INFO_TYPE=remote`, ensure `NUXT_SURREAL_INFO_URL` points to an RPC endpoint.

- **`Application startup failed.`**
    - Confirm database connectivity and credentials (`NUXT_SURREAL_INFO_USERNAME`, `NUXT_SURREAL_INFO_PASSWORD`) for remote mode.
    - Confirm namespace/database values match your target (`NUXT_SURREAL_INFO_NAMESPACE`, `NUXT_SURREAL_INFO_DATABASE`).
    - If no accounts exist, set all three `NUXT_SURREAL_ADMIN_*` values so startup can create the required default account.

- **Cannot access `/developer/query`**
    - The active account must include the `developer` role in all environments.

- **`Executing queries against the `developerQuery` table is not allowed.`**
    - This protects the internal query audit trail.
    - Use other read/write queries for diagnostics, but do not target the `developerQuery` table directly.

- **Login/registration appears to work but pages fail to load expected content**
    - Re-check migration startup logs and ensure schema/migrations executed successfully.

## 11. Pull Requests

Keep pull requests focused and use the repository template. It asks for a short summary, test status, and documentation impact.

### CI Checks

GitHub Actions runs on pull requests and pushes to `dev`. The `CI / Validate` job installs dependencies, runs Golar's app/shared typecheck, Nuxt's full typecheck, the production build, and the integration suite. The suite starts an isolated embedded database and checks application health before running its tests.

Run the same checks locally:

```bash
yarn install --frozen-lockfile
yarn typecheck:golar
yarn typecheck
yarn build
yarn test
```

Repository branch protection must require `CI / Validate` before merging; workflow files cannot enable that GitHub setting themselves.

## 12. Release And Versioning

ClassicForum uses `year.major.patch` versions, such as `2026.5.0`, to support a steady release and deployment cadence.

- The current application version is in `package.json`.
- The public Nuxt runtime version is read from `package.json`.
- The first number is the release year.
- The second number increments for a meaningful release line within that year.
- The third number increments for fixes, docs, and small follow-up deployments within that release line.
- At the start of a new year, begin again at `<year>.1.0`.

When preparing a release or deployment, update `package.json` and [CHANGELOG.md](../CHANGELOG.md) together. If work was not tagged at the time, group it into a clear release entry. Tagging and a full release checklist will be added when the release process needs them.

## It's Running

If everything is configured correctly, the site should be available in your browser and basic flows should work.
