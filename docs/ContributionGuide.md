# Contribution Guide

Follow these steps to build and run the site on your local machine.

## 1. Setup Repository

Clone the repo from GitHub into your development environment. You should use a recent Node.js LTS release and yarn.

I recommend using [nvm-windows](https://github.com/coreybutler/nvm-windows) to manage your Node.js installations. You can install yarn globally with:

```bash
npm install --global yarn
```

## 2. Choose Your Database Mode

OpenForum supports two SurrealDB modes:

- **remote**: connect to an external SurrealDB server over RPC.
- **embedded**: run SurrealDB from inside the app process via a local engine.

Choose one mode and set `SURREAL_TYPE` accordingly.

## 3. Environment Variables

You will need to populate a `.env` file with a few specific parameters the app uses. Here is a template of the values you can provide.

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

DEFAULT_USER_EMAIL= # the email of the default user created on startup
DEFAULT_USER_NAME= # the name of the default user created on startup
DEFAULT_USER_PASSWORD= # the password of the default user created on startup

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

If setup is correct, logs will show a successful connection message including namespace, database, and URL.

```
Connecting to remote/embedded instance...
Connected to <namespace>:<database> @ <url>.
Database migrations completed successfully.
```

## 6. Sync Database Schema

Schema and migrations are applied automatically on application startup by [server/plugins/01.migrations.server.ts](../server/plugins/01.migrations.server.ts), which executes both [server/assets/schema.surql](../server/assets/schema.surql) and [server/assets/migrations.surql](../server/assets/migrations.surql).

If startup succeeds, you do not need to run manual `surreal import` commands.

If startup fails, check your app logs for `Failed to apply database migrations on application startup.` and resolve database connectivity or query issues first.

## 7. In-App Query Portal

OpenForum includes a built-in query portal at `/developer/query` (see [app/pages/developer/query.vue](../app/pages/developer/query.vue)) so you can inspect and run queries against your database directly from the application.

- In development mode, this route is available automatically.
- Outside development mode, the current user must have the `developer` role (see [app/pages/developer.vue](../app/pages/developer.vue) and [server/api/developer/database/query.ts](../server/api/developer/database/query.ts)).

## 8. First User Setup

Once the app is running:

1. Open `/register` and create your first account.
2. Open your profile at `/profile` to confirm authentication is working.
3. (Recommended for local development) grant your account elevated roles so you can access admin/developer tooling.

Example query in `/developer/query`:

```sql
UPDATE user:<your-user-id> SET
    roles = array::union(roles, ["admin", "developer"]);
```

If you are not in development mode and cannot access `/developer/query` yet, use the Surreal CLI (`surreal sql`) to run the same update directly.

## 9. Troubleshooting

- **`Database URL was [...] Check environment variables.`**
    - Verify `SURREAL_TYPE` and `SURREAL_URL` are set correctly.
    - If `SURREAL_TYPE=remote`, ensure `SURREAL_URL` points to an RPC endpoint.

- **`Failed to apply database migrations on application startup.`**
    - Confirm database connectivity and credentials (`SURREAL_USERNAME`, `SURREAL_PASSWORD`) for remote mode.
    - Confirm namespace/database values match your target (`SURREAL_NAMESPACE`, `SURREAL_DATABASE`).

- **Cannot access `/developer/query`**
    - In development mode this route should be available automatically.
    - Outside development mode, the active account must include the `developer` role.

- **Login/registration appears to work but pages fail to load expected content**
    - Re-check migration startup logs and ensure schema/migrations executed successfully.

## It's Running

If everything is configured correctly, the site should be available in your browser and basic flows should work.
