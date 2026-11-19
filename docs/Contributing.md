# Contributing

Follow these steps to build and run the site on your local machine.

For suspected vulnerabilities, use the private reporting process in [SECURITY.md](../SECURITY.md); do not report them in public issues.

## 1. Setup Repository

Clone the repo from GitHub. Use Node.js 24 LTS or newer and `yarn`.

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
# Developer > Info captures build time and Git revision/ref automatically; no extra metadata variables are required.

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

The test command builds and starts one Nuxt/Nitro server with an embedded SurrealDB database and media directory under a unique `.test-output-*` folder. It does not use the configured development or production database. The runner waits for `/api/health` to report both the app and database as ready, then stops the server and removes the temporary folder. Add `--keep-output` to retain the folder, including Playwright traces and screenshots, for debugging; the runner prints the retained path as `[test artifacts]`. It also contains temporary database, media, and session data. Run `yarn test --cleanup` to remove all root-level `.test-output-*` folders left by test or exploration runs. This standalone command also deletes retained databases, media, sessions, and browser artifacts.

The compiled test server is cached under the ignored `.nuxt/test-runner/` directory using a fingerprint of application, server, shared, public, and build configuration inputs. Source or dependency changes invalidate the cache; each run still gets a fresh database and media directory.

Add sequential setup tests under `tests/sequential/` using `*.setup.test.ts`. Put tests that change shared settings, roles, or seeded records in `tests/sequential/`; keep independent tests under `tests/parallel/`. Name server-only Vitest tests `*.server.test.ts`, browser-only Playwright tests `*.browser.test.ts`, and full-stack UI-to-server Playwright flows `*.integration.test.ts`. An integration test is run once in a real browser against the isolated server; it is not duplicated across runners. Keep shared helpers in `tests/utils/`; `test-server.ts` provides API access and named sessions, while `browser-fixtures.ts` provides authenticated pages and the seeded example server. All phases share one isolated app, database, and media directory. Sequential files run serially; parallel server and browser phases can run up to two files concurrently. Parallel tests must use unique test data, assert against their own markers, and clean up records they create.

Run the full suite with `yarn test` (no arguments). Use `--server` to run sequential and parallel server tests without Playwright, or `--browser` to run the required setup fixtures and both sequential and parallel browser suites without the Vitest server suites. `--sequential` runs the ordered sequential server and browser suites. To run one parallel test file, use `--file <filename>`; the runner starts the isolated app and runs only the required `*.setup.test.ts` fixtures before the selected file, skipping all other sequential tests. Sequential tests can only be run with `--sequential` or the full suite, preserving their order. Use `--sequential` for the ordered sequential suite:

```bash
yarn test --cleanup
yarn test --server
yarn test --browser
yarn test --sequential
yarn test --file posts.server.test.ts
yarn test --file posts.server.test.ts --keep-output
yarn test --file registration.integration.test.ts
yarn test --inspect .test-output-<run>/browser-results/<test>/trace.zip
yarn test --inspect .test-output-<run>/browser-results/<test>/trace.zip --report trace-report.md
```

Each run reports total, app startup (with cache status), setup, server tests, browser phase, and cleanup. Browser files appear only in a slow-file summary when a file takes at least ten seconds.

If a failure needs more detail, rerun a parallel test file with `--file <filename> --keep-output`. Read the phase and failing test from the console output, then inspect `phase-*-summary.json` in the printed `.test-output-*` folder. For browser failures, inspect the matching folder under `browser-results/`: `error-context.md` has the failure and page snapshot, `test-failed-*.png` shows the page, and `trace.zip` contains the interaction and network timeline. Use `yarn test --inspect <path-to-trace.zip>` to print the failure, recent browser actions, API requests, and console warnings/errors without request headers. Add `--report <path>` to save the same summary. You can also open a trace with `yarn playwright show-trace <path-to-trace.zip>`. Retained folders are not removed automatically; delete them when debugging is complete.

Playwright uses Chromium, installed locally with `yarn playwright install chromium` and in CI by the workflow. Parallel browser files run with up to two workers; sequential browser files use one worker. The `authenticatedPage` fixture reuses the isolated admin session seeded by setup; tests of login behavior should use an unauthenticated `page` and exercise the UI. The `exampleServer` fixture exposes named user sessions and representative feed content. Assert visible markup, navigation, and user interactions rather than implementation-only component details. The app and temporary data are cleaned up after the run.

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

On an empty database, set all three `NUXT_SURREAL_ADMIN_*` values before starting the app. Startup creates the default account with the `moderator`, `admin`, and `developer` roles.

Once the app is running:

1. Sign in with the default account credentials from `.env`.
2. Open `/profile` to confirm authentication is working.
3. Open `/developer/query` to confirm developer access.

If the database already contains an account, leave all three `NUXT_SURREAL_ADMIN_*` values blank. Startup will not create another default account.

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

The `Pipeline` workflow runs on pull requests and pushes to `dev`, with typechecks, a production build, and integration tests. Push the final release commit to `dev` and wait for `Pipeline` to pass for that exact commit before tagging it. The separate `Release` workflow runs on `v*` tags, verifies the successful `Pipeline` run for the same commit, checks the package version, stages the Linux x64 archive, creates a SHA-256 file, and publishes both assets to the GitHub Release. Follow the [release skill](../.github/skills/release/SKILL.md) and [ticket 0127](tickets/0127-publish-a-verifiable-pilot-release.md). Commit all intended source changes before the dated changelog update; that changelog commit must be the release commit, and no source changes may follow its successful `Pipeline` run before tagging. If the commit changes, push it to `dev` and wait for `Pipeline` again. Do not build or upload release assets manually in the normal workflow. Track external operator, live-service, and production-deployment checks separately, and do not claim they passed based on CI.

Run the same checks locally:

```bash
yarn install --frozen-lockfile
yarn typecheck:golar
yarn typecheck
yarn build
yarn test
```

Repository branch protection must require `Pipeline / Pipeline` before merging; workflow files cannot enable that GitHub setting themselves.

## 12. Release And Versioning

ClassicForum uses `year.major.patch` versions, such as `2026.5.0`, to support a steady release and deployment cadence.

- The current application version is in `package.json`.
- The public Nuxt runtime version is read from `package.json`.
- The first number is the release year.
- The second number increments for a meaningful release line within that year.
- The third number increments for fixes, docs, and small follow-up deployments within that release line.
- At the start of a new year, begin again at `<year>.1.0`.

After a patch is complete, review changes since the latest tag and update `package.json` and [CHANGELOG.md](../CHANGELOG.md) together when the application version changes. Keep the release entry accurate to committed, verified changes. Push the final changelog commit to `dev`, wait for successful `Pipeline` CI on that exact commit, and then tag and push it. A `v*` tag triggers the separate `Release` workflow, which requires that prior `Pipeline` success before publishing. Verify the resulting GitHub Release after it completes. Production deployment remains separate and requires a fresh backup and explicit approval.

## It's Running

If everything is configured correctly, the site should be available in your browser and basic flows should work.
