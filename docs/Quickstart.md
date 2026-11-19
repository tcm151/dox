# Production Quickstart

Use this guide to install a Linux release. Examples use `/srv/forum/<version>` for the app, with shared configuration and data under `/srv/forum`. All `/srv/forum/*` paths are placeholders; replace `/srv/forum` with your actual install location. The archive contains `forum/<version>`.

## Prerequisites

- A Linux VM or server with `systemd`.
- Root shell access.
- Node.js LTS installed and available as `node`.
- `flock` from util-linux for serializing installer changes.
- A Linux release artifact already downloaded to the server, such as `forum-<version>-linux-x64.tar.gz`.

## Install The Artifact

Download the Linux x64 archive and its `.sha256` file from the [latest GitHub release](https://github.com/tcm151/dox/releases/latest). From the directory containing both files, verify the archive before unpacking:

```bash
sha256sum -c forum-<version>-linux-x64.tar.gz.sha256
```

Log in as root, then unpack the release under your chosen parent directory (shown as `/srv` below):

```bash
cd /srv
tar -xzf /path/to/forum-<version>-linux-x64.tar.gz
cd /srv/forum/<version>
```

The directory should contain the installer, environment example, and packaged server entrypoint:

```bash
ls -la installer.sh .env.example server/index.mjs
```

The installed layout is:

```text
/srv/forum
	.env
	<version>/
		installer.sh
		.env.example
		server/
			node_modules/
	data/
```

Release archives include production dependencies and are specific to the OS and architecture they were built for. Build and stage a separate archive on each target platform, then install the matching archive.

See [Hosting](Hosting.md) for the candidate environment, current limits, and capacity measurements that remain outstanding.

## Configure Environment

Each release includes `.env.example`. Create the shared `.env` beside the version folders, then review it before the first start:

```bash
cp -n .env.example ../.env
nano ../.env
```

The installer also creates `../.env` from `.env.example` if `../.env` is missing. It will not overwrite an existing shared config.

The default path uses embedded SurrealDB with data stored beside the versioned release folder:

```bash
NUXT_DATA_PATH=../data
NUXT_SURREAL_INFO_TYPE=embedded
NUXT_SURREAL_INFO_URL=rocksdb://../data/database/default.db
```

Set these values before starting the service. Use unique credentials for all three `NUXT_SURREAL_ADMIN_*` fields:

```bash
PORT=8001
NUXT_PUBLIC_BASE_URL=https://forum.example.com
NUXT_PUBLIC_SITE_TITLE="Forum"
NUXT_PUBLIC_SITE_TITLE_SHORT="Forum"
NUXT_SURREAL_ADMIN_EMAIL=
NUXT_SURREAL_ADMIN_NAME=
NUXT_SURREAL_ADMIN_PASSWORD=
```

If values contain spaces, wrap them in quotes.

The default account receives the `moderator`, `admin`, and `developer` roles. It is created only when no accounts exist. A fresh installation will not start without all three values because no one would be able to access the administration, moderation, or developer tools.

If an account already exists, leave all three values blank. The installer rejects partial configuration and known placeholder passwords.

Choose an unused `PORT` and set `NUXT_PUBLIC_BASE_URL` to the public URL for your instance. The example assumes a TLS-terminating reverse proxy; without one, include the app's port in the URL. For a reverse proxy, use the externally visible scheme, hostname, and port (normally HTTPS on port 443), and set `NUXT_TRUSTED_PROXIES` to the proxy's exact source IP or narrow CIDR, such as `127.0.0.1,10.0.0.0/24`. Leave it blank when the app is not behind a trusted proxy.

The app uses forwarded client addresses only when the connecting socket belongs to a configured trusted proxy. Configure the proxy to replace incoming `X-Forwarded-For` with the address it observed, or append that observed address consistently. Do not expose the app port to untrusted peers if the proxy network is intended to be the only path to the app.

Nuxt reads the `NUXT_*` settings when the server starts, so changing them and restarting does not require a rebuild.

## Install And Start The Service

Run the packaged installer from your versioned release directory, for example `/srv/forum/<version>`:

```bash
./installer.sh install
```

The installer creates and starts `forum.service`, which starts automatically when the server boots. To use a different systemd unit name for this instance, prefix the install and every later installer command with the same value, for example `SERVICE_NAME=classicforum ./installer.sh install` and `SERVICE_NAME=classicforum ./installer.sh service status`. The default is `forum`.

For a disposable release copy that should not create or manage a systemd service, use `./installer.sh install --no-service`. This still validates the configuration and prepares data paths; start the copy in the foreground with `./installer.sh run`.

## Upgrade

Starting a new release applies any pending database migrations. Back up the database before the upgrade. For embedded SurrealDB, run the backup from the current release and verify the checksum using the path printed by the command:

```bash
cd /srv/forum/<current-version>
./installer.sh backup
cd /srv/forum/backups
sha256sum -c classicforum-db-<timestamp>-<pid>.tar.gz.sha256
```

The installer backup includes only the RocksDB database directory, not `.env` or uploaded media. See [Backup And Restore](Backups.md) for remote database backups and media protection.

List stable Linux x64 releases, inspect installed versions, then upgrade to the latest or a selected version from the current release directory:

```bash
cd /srv/forum/<current-version>
./installer.sh versions --available
./installer.sh versions --installed
./installer.sh versions --previous
./installer.sh upgrade
./installer.sh upgrade 2026.6.3
```

`versions --available` lists stable releases with both Linux x64 assets. `versions --installed` lists package directories on this deployment, and `versions --previous` lists those older than the service's configured release. `upgrade` selects the latest stable release; pass a version from the available list to select another. Upgrades refuse downgrades or overwriting an existing version. The command resolves the deployment root from the current installer location, verifies the downloaded checksum and archive paths, extracts the archive's `forum/<version>` directory, and moves that version beside the current release. It reuses the shared `.env`, service name, and Node.js executable, then checks that the app and database report ready at the expected version. The temporary download is removed after installation; previous release directories are kept.

Install, upgrade, and cleanup use a shared deployment lock so they cannot modify the release tree concurrently. If another operation holds the lock, wait for it to finish and retry.

For a custom systemd unit, pass the same `SERVICE_NAME` used during installation to each service or cleanup command, for example `SERVICE_NAME=classicforum ./installer.sh service status` or `SERVICE_NAME=classicforum ./installer.sh cleanup`.

`cleanup` removes older installed release folders, while protecting the release containing the invoked installer and the service's configured release. It retains one previous release by default and prompts before deleting. Use `--keep N` to retain a different number of rollback copies; pass `--yes` for non-interactive cleanup:

```bash
./installer.sh versions --previous
./installer.sh cleanup --keep 1
./installer.sh cleanup --keep 1 --yes
```

Review `versions --previous` before running cleanup. Cleanup only considers version-named directories that contain both `installer.sh` and `server/index.mjs`. Use the same `SERVICE_NAME` for cleanup when the unit is customized.

`upgrade` does not back up the database or media. Back up the database using the procedure appropriate to its mode before upgrading. The release artifact does not include a live `.env`, so `/srv/forum/.env` remains in place across version folders. The data remains in `/srv/forum/data`.

### Manual Version-Pinned Upgrade

To install a specific, already-downloaded release, unpack it alongside the existing release while the current service continues running. When `install` runs, it validates the release and configuration, then stops the current service, points the systemd unit at the new version, and starts it:

```bash
cd /srv
tar -xzf /path/to/forum-<new-version>-linux-x64.tar.gz
cd /srv/forum/<new-version>
./installer.sh install
```

Keep the old release folder and verified database backup until the new release passes its health check.

After installation, verify the service and health endpoint:

```bash
./installer.sh service status
curl --fail-with-body http://127.0.0.1:8001/api/health
```

Use the configured port in the health URL. Confirm the response reports both `app` and `database` as `ready`. If activation or readiness fails, the installer reports the systemd working directory and does not automatically roll back because startup may already have applied database migrations. Inspect `journalctl -u forum` (replace `forum` with your configured service name); do not start an older app against a database already migrated by the new release. Stop the service and restore a compatible pre-upgrade backup first, following [Backup And Restore](Backups.md#restore-a-backup).

## Service Commands

The installer also wraps common service operations. If you chose a custom `SERVICE_NAME`, set it for these commands too:

```bash
./installer.sh service status
./installer.sh service start
./installer.sh service stop
./installer.sh service restart
./installer.sh run
```

Use `run` only when debugging in the foreground.

## Verify

Check the service:

```bash
./installer.sh service status
```

Check the health endpoint:

```bash
curl http://127.0.0.1:8001/api/health
```

Replace port `8001` with the configured `PORT` value.

For backup and restore procedures covering embedded and remote databases, see [Backups](Backups.md).

The installer and app logs are stored beside the shared `.env` and append across runs. Installer commands also keep output in the terminal and systemd journal:

```bash
# App logs
tail -f ../logs/forum.log

# Installer logs
tail -f ../logs/installer.log
```

After changing `.env`, restart the service:

```bash
./installer.sh service restart
```