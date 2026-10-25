# SurrealDB

This guide links to the official SurrealDB documentation and records the configuration details specific to ClassicForum. Use the upstream documentation for general installation, operation, security, and database administration; check it against the SurrealDB version you deploy.

## SurrealDB Documentation

- [What is SurrealDB?](https://surrealdb.com/docs/surrealdb/introduction)
- [Running SurrealDB](https://surrealdb.com/docs/running/overview.md), including [installation](https://surrealdb.com/docs/explore/cli/install.md), [starting a server](https://surrealdb.com/docs/reference/cli/db/commands/start.md), and [deployment models](https://surrealdb.com/docs/manage/self-hosted/deployment-models.md)
- [Authentication](https://surrealdb.com/docs/surrealdb/security/authentication) and [permissions](https://surrealdb.com/docs/learn/security/authorization/permissions-and-row-level-security.md)
- [RPC protocol](https://surrealdb.com/docs/reference/rest-api/rpc-protocol.md)
- [Backups and recovery](https://surrealdb.com/docs/manage/self-hosted/backups-and-recovery.md), [database export](https://surrealdb.com/docs/surrealdb/cli/export), and [database import](https://surrealdb.com/docs/surrealdb/cli/import)
- [Full documentation index](https://surrealdb.com/docs/llms.txt)

## ClassicForum Database Modes

ClassicForum supports an embedded database and a separately operated remote database. Embedded SurrealDB is the default and simplest single-host deployment. See the [Production Quickstart](Quickstart.md) for packaged installation and service setup, or the [Contribution Guide](ContributionGuide.md) for development configuration.

For the embedded mode, the environment selects the in-process engine and a persistent RocksDB path:

```dotenv
NUXT_SURREAL_INFO_TYPE=embedded
NUXT_SURREAL_INFO_URL=rocksdb://../data/database/default.db
```

For remote mode, point the app at an HTTP(S) RPC endpoint that ends in `/rpc` and select the namespace and database:

```dotenv
NUXT_SURREAL_INFO_TYPE=remote
NUXT_SURREAL_INFO_URL=https://db.example.internal:8000/rpc
NUXT_SURREAL_INFO_NAMESPACE=forum
NUXT_SURREAL_INFO_DATABASE=production
NUXT_SURREAL_INFO_USERNAME=
NUXT_SURREAL_INFO_PASSWORD=
```

The app host must be able to resolve and reach the endpoint. Restrict database network access to trusted clients and protect credentials as secrets. The production installer requires a username and password in remote mode and validates that the URL ends in `/rpc`.

### Authentication Scope

ClassicForum currently supplies only the SurrealDB username and password when authenticating. This uses a root-level SurrealDB system user; `NUXT_SURREAL_INFO_NAMESPACE` and `NUXT_SURREAL_INFO_DATABASE` select the app's working namespace and database but do not reduce the credential's privilege scope. Keep the RPC service private and use a unique, strongly protected credential. Namespace- or database-scoped credentials are not configurable through the current app settings.

`NUXT_SURREAL_ADMIN_EMAIL`, `NUXT_SURREAL_ADMIN_NAME`, and `NUXT_SURREAL_ADMIN_PASSWORD` are separate: they create the initial ClassicForum account when its database is empty. They are not SurrealDB server credentials. Configure all three for a fresh app database, or leave all three blank when an app account already exists.

### Startup and Health

ClassicForum loads database settings when the app process starts. Changing them requires an app restart, not a rebuild. On startup, the app applies its schema and pending migrations before reporting ready. Avoid concurrent app starts against the same database while a deployment may apply migrations.

Check `GET /api/health` after starting the app. A healthy response reports both the app and database as `ready`; a `503` means startup or a required health check has failed. Inspect both app and database logs before retrying. See [Architecture](Architecture.md#runtime-topology-and-lifecycle) for the startup and health-check behavior.

For procedures to back up and restore the app data, see [Backups](Backups.md).
