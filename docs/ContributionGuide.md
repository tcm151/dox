# Contribution Guide

Follow these steps to build and run the site on your local machine.

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

Choose one mode and set `SURREAL_TYPE` accordingly.

## 3. Environment Variables

Create a `.env` file with these parameters:

```bash
PORT= # the port of your running Nuxt instance. Ex: 3000
BASE_URL= # the address of your running Nuxt instance. Ex: http://localhost

SITE_TITLE= # the title you'd like to be displayed in the browser tab
SITE_TITLE_SHORT= # the shortened title used when space is limited

SURREAL_TYPE= # the SurrealDB instance type. Ex: remote or embedded
# remote example: http://localhost:8000/rpc
# embedded example: rocksdb://./database/default.db
SURREAL_URL=
SURREAL_NAMESPACE= # the namespace you'd like to use. Ex: example
SURREAL_DATABASE= # the database you'd like to use. Ex: development
SURREAL_USERNAME= # your SurrealDB root username, when SURREAL_TYPE=remote
SURREAL_PASSWORD= # your SurrealDB root password, when SURREAL_TYPE=remote

DEFAULT_USER_EMAIL= # required on an empty database; email for the default account
DEFAULT_USER_NAME= # required on an empty database; name for the default account
DEFAULT_USER_PASSWORD= # required on an empty database; password for the default account

DATA_PATH= # the path where media and embedded databases are saved

# OPTIONAL, only supply if needing to send emails
# You can use your personal gmail account as an SMTP server
# https://support.google.com/a/answer/176600?
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SENDER_TITLE=
```

## 4. Start SurrealDB (Remote Mode Only)

If `SURREAL_TYPE=remote`, start SurrealDB separately:

```bash
surreal start --user <username> --pass <password> <protocol>://<path_to_database_file>
```

If `SURREAL_TYPE=embedded`, skip this step.

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

## 6. Sync Database Schema

Schema and migrations are applied automatically on application startup by [server/plugins/01.startup.server.ts](../server/plugins/01.startup.server.ts). A fresh database receives [server/assets/schema.surql](../server/assets/schema.surql); later changes run from versioned files in `server/assets/migrations/`.

If startup succeeds, you do not need to run manual `surreal import` commands.

If startup fails, check the app logs and `/api/health`. A failed migration reports its attempted version there; after migrations complete, the health response reports the app version. Resolve the database, migration, or default account issue before retrying startup.

## 7. Add a Database Migration

Create a new `YYYY.M.patch.surql` file in `server/assets/migrations/` using the next version after the latest migration. Do not edit a migration after release.

Wrap the migration and its version record in one transaction. Record the file version only after its changes succeed:

```sql
BEGIN TRANSACTION;

-- Schema or data changes go here.

CREATE ONLY migration SET version = 'YYYY.minor.patch';
COMMIT;
```

Test fresh startup, the upgrade from the previous version, and a repeated startup. For changes to post deletion, also verify that `post.deleted` remains defined and works when a post with comments is deleted.

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
    - Verify `SURREAL_TYPE` and `SURREAL_URL` are set correctly.
    - If `SURREAL_TYPE=remote`, ensure `SURREAL_URL` points to an RPC endpoint.

- **`Application startup failed.`**
    - Confirm database connectivity and credentials (`SURREAL_USERNAME`, `SURREAL_PASSWORD`) for remote mode.
    - Confirm namespace/database values match your target (`SURREAL_NAMESPACE`, `SURREAL_DATABASE`).
    - If no accounts exist, set all three `DEFAULT_USER_*` values so startup can create the required default account.

- **Cannot access `/developer/query`**
    - The active account must include the `developer` role in all environments.

- **`Executing queries against the `developerQuery` table is not allowed.`**
    - This protects the internal query audit trail.
    - Use other read/write queries for diagnostics, but do not target the `developerQuery` table directly.

- **Login/registration appears to work but pages fail to load expected content**
    - Re-check migration startup logs and ensure schema/migrations executed successfully.

## 11. Pull Requests

Keep pull requests focused and use the repository template. It asks for a short summary, test status, and documentation impact.

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
