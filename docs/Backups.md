# Backup And Restore

Use this runbook to protect and restore ClassicForum application data. Test each restore procedure against an isolated target before relying on it for recovery. Keep backups encrypted or access-restricted, store a copy outside the host's failure domain, and record which app and SurrealDB versions produced them.

## Embedded SurrealDB

In the packaged Linux quickstart, the shared configuration is `/root/forum/.env`, and `NUXT_DATA_PATH=../data` resolves from the versioned app directory to `/root/forum/data`. That directory contains the embedded RocksDB database and uploaded image/audio files. The installer backup command includes only the configured RocksDB database directory; it does not include `.env`, media, or other files. Back up uploaded media separately if the recovery plan requires it. If the deployment uses a different database URL, adapt the restore path accordingly.

### Create A Backup

Run as root from the versioned release directory:

```bash
cd /root/forum/<current-version>
./installer.sh backup
```

The command supports embedded SurrealDB deployments only. It stops the service before copying a live RocksDB store, then restores its prior active/inactive state. It writes a timestamped archive containing only the configured RocksDB database directory, plus a SHA-256 checksum. By default, backups go in a `backups/` directory beside the shared `.env`; set `BACKUP_DIR` to choose another directory. The archive and checksum are mode `600`, and the backup directory is mode `700`. Treat the archive as sensitive because it contains database contents.

Verify the checksum and archive using the paths printed by the command:

```bash
cd /root/forum/backups
sha256sum -c classicforum-db-<timestamp>-<pid>.tar.gz.sha256
gzip -t classicforum-db-<timestamp>-<pid>.tar.gz
tar -tzf classicforum-db-<timestamp>-<pid>.tar.gz
```

Remote SurrealDB is not included. Use the [remote database backup procedure](#remote-surrealdb) instead. Copy the archive and checksum to protected storage on another host. Keep the matching release artifact available; a data backup does not include application binaries or bundled dependencies.

### Restore A Backup

Choose a compatible release. Run the restore command as root from its versioned directory. With no archive argument, it restores the newest timestamped backup in `BACKUP_DIR` or the default `backups/` directory beside the shared `.env`. An archive path can be supplied to select a specific restore point:

```bash
cd /root/forum/<restore-version>
./installer.sh restore
# Or: ./installer.sh restore /root/forum/backups/classicforum-db-<timestamp>-<pid>.tar.gz
```

Before changing the database, the command verifies the SHA-256 checksum, gzip stream, archive paths, and configured database directory. It stops an active service for the restore and starts it again only if it was active beforehand. It does not install or enable a systemd service. The restored database takes the ownership of the existing database, or its parent directory if the database does not yet exist. The existing `.env` and media remain in place. If a database already exists, it is preserved as `<database-path>.before-restore-<timestamp>-<pid>` for rollback.

Confirm the health response reports the app and database as `ready`. Then sign in and check representative records and uploaded media. Startup applies pending app migrations, so use a release compatible with the restored database and review its migrations before starting it.

If verification fails, stop the service. Move the failed database directory aside, move the preserved `.before-restore-<timestamp>-<pid>` directory back to the configured database path, then restart the service. Preserve the failed restore and logs for diagnosis; do not delete migration records or modify the only backup.

### Test A Restore In Isolation

Test restores with a temporary copy of the database and a copied release, never the live data directory. For the WSL-specific setup, see the [WSL environment skill](../.github/skills/wsl-environment/SKILL.md).

## Remote SurrealDB

Back up the remote database independently from the app host. The SurrealDB CLI export/import commands use the server's HTTP endpoint (for example, `https://db.example.internal:8000`), not ClassicForum's `/rpc` URL. Authenticate with a protected root-level credential; this matches the current ClassicForum database client, which authenticates using only a username and password. Keep credentials out of shell history and command-line arguments.

Set `SURREAL_USER` and `SURREAL_PASS` through a secret manager or a non-echoing prompt, then export the selected namespace and database:

```bash
export DB_ENDPOINT=https://db.example.internal:8000
export DB_NAMESPACE=forum
export DB_DATABASE=production
surreal db export --endpoint "$DB_ENDPOINT" --namespace "$DB_NAMESPACE" --database "$DB_DATABASE" \
  "/secure-backup-path/classicforum-$(date -u +%Y%m%dT%H%M%SZ).surql"
unset SURREAL_USER SURREAL_PASS
```

Restrict permissions on the export and copy it to protected off-host storage. Consult the upstream [backup and recovery guide](https://surrealdb.com/docs/manage/self-hosted/backups-and-recovery.md) for storage-level backups and version-specific limitations. A SurrealQL export does not replace backups of the database host's configuration, certificates, or other operational state.

To restore, first back up the current target. Prefer importing into a separate namespace/database and validating it before switching ClassicForum's `NUXT_SURREAL_INFO_NAMESPACE` or `NUXT_SURREAL_INFO_DATABASE`. Then import the archive:

```bash
surreal db import --endpoint "$DB_ENDPOINT" --namespace "$DB_NAMESPACE" --database "$DB_DATABASE" \
  /secure-backup-path/classicforum-<timestamp>.surql
```

Imports can apply statements before a later error; they are not an all-or-nothing restore. Follow the upstream [import guidance](https://surrealdb.com/docs/surrealdb/cli/import), inspect the command result, and verify records, schema, app startup, health, login, and media before directing production traffic to the restored database.

## Recovery Checks

- If the service does not start, inspect `journalctl -u forum` and confirm the restored `.env`, data path, database URL, and file ownership match the selected release.
- If `/api/health` is not ready, inspect app startup/migration errors and SurrealDB logs; preserve the current database before retrying a restore.
- If records load but images/audio are missing in embedded mode, verify the archive included the configured media directories under `NUXT_DATA_PATH`.
- If remote import reports errors, assume the target may be partially changed. Restore into a clean target or recover from the pre-restore backup instead of retrying blindly.
- Do not remove the pre-restore snapshot until account login, representative content, media, and health checks pass.

For the app's deployment layout and health endpoint, see the [Production Quickstart](Quickstart.md). For database-mode and credential details, see the [SurrealDB guide](SurrealDB.md).
