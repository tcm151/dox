# Backup And Restore

Use this runbook to protect and restore ClassicForum application data. Test each restore procedure against an isolated target before relying on it for recovery. Keep backups encrypted or access-restricted, store a copy outside the host's failure domain, and record which app and SurrealDB versions produced them.

## Embedded SurrealDB

In the packaged Linux quickstart, the shared configuration is `/root/forum/.env`, and `NUXT_DATA_PATH=../data` resolves from the versioned app directory to `/root/forum/data`. That directory contains the embedded RocksDB database and uploaded image/audio files. If the deployment uses a different `NUXT_DATA_PATH` or database URL, adapt the commands to include the configured locations.

### Create A Backup

Stop the service before copying embedded database files so the backup does not capture a changing RocksDB store. Run as root:

```bash
cd /root/forum/<current-version>
./installer.sh stop

backup_dir=/root/forum/backups
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
install -d -m 700 "$backup_dir"
tar -czf "$backup_dir/classicforum-$timestamp.tar.gz" -C /root/forum data .env
chmod 600 "$backup_dir/classicforum-$timestamp.tar.gz"
gzip -t "$backup_dir/classicforum-$timestamp.tar.gz"
tar -tzf "$backup_dir/classicforum-$timestamp.tar.gz"
sha256sum "$backup_dir/classicforum-$timestamp.tar.gz" > "$backup_dir/classicforum-$timestamp.tar.gz.sha256"
```

Restart the service after the archive has been verified. The installer accepts `install` (the default), `run`, `status`, `stop`, and `restart`:

```bash
./installer.sh restart
```

Copy the archive and checksum to protected storage on another host. Keep the matching release artifact available; a data backup does not include application binaries or bundled dependencies.

### Restore A Backup

Choose the release version intended to open the backup and stop the service. Extract to a staging directory first and verify the archive before replacing live data:

```bash
cd /root/forum/<restore-version>
./installer.sh stop

archive=/root/forum/backups/classicforum-<timestamp>.tar.gz
sha256sum -c "$archive.sha256"
gzip -t "$archive"
restore_dir=$(mktemp -d /root/forum-restore.XXXXXX)
tar -xzf "$archive" -C "$restore_dir"
test -d "$restore_dir/data/database"
test -f "$restore_dir/.env"
```

Keep the current state so the restore can be rolled back if verification fails, then install the archived data and configuration:

```bash
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
mv /root/forum/data "/root/forum/data.before-restore-$timestamp"
cp -a "$restore_dir/data" /root/forum/data
cp -a /root/forum/.env "/root/forum/.env.before-restore-$timestamp"
install -o root -g root -m 600 "$restore_dir/.env" /root/forum/.env

./installer.sh restart
./installer.sh status
curl --fail-with-body http://127.0.0.1:8001/api/health
```

Confirm the health response reports the app and database as `ready`. Then sign in and check representative records and uploaded media. Startup applies pending app migrations, so use a release compatible with the restored database and review its migrations before starting it.

If verification fails, stop the service. Move the failed restored data aside, move `data.before-restore-<timestamp>` back to `/root/forum/data`, restore `.env.before-restore-<timestamp>` to `/root/forum/.env`, and restart. Preserve the failed restore and logs for diagnosis; do not delete migration records or modify the only backup.

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
