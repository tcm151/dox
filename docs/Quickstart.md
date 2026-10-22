# Production Quickstart

Use this guide to install a forum release on a Linux server. Releases live in versioned folders such as `/root/forum/<version>`, while persistent data stays in `/root/forum/data`.

## Prerequisites

- A Linux VM or server with `systemd`.
- Root shell access.
- Node.js LTS installed and available as `node`.
- A Linux release artifact already downloaded to the server, such as `forum-<version>-linux-x64.tar.gz`.

## Install The Artifact

Log in as root, then unpack the release under `/root`:

```bash
cd /root
tar -xzf forum-<version>-linux-x64.tar.gz
cd /root/forum/<version>
```

The directory should contain the installer, environment example, and packaged server entrypoint:

```bash
ls -la installer.sh .env.example server/index.mjs
```

The installed layout is:

```text
/root/forum
	.env
	<version>/
		installer.sh
		.env.example
		server/
			node_modules/
	data/
```

Release archives include production dependencies and are specific to the OS and architecture they were built for. Build and stage a separate archive on each target platform, then install the matching archive.

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
NUXT_PUBLIC_BASE_URL=http://your-server-hostname-or-ip:8001
NUXT_PUBLIC_SITE_TITLE="Forum"
NUXT_PUBLIC_SITE_TITLE_SHORT="Forum"
NUXT_SURREAL_ADMIN_EMAIL=
NUXT_SURREAL_ADMIN_NAME=
NUXT_SURREAL_ADMIN_PASSWORD=
```

If values contain spaces, wrap them in quotes.

The default account receives the `moderator`, `admin`, and `developer` roles. It is created only when no accounts exist. A fresh installation will not start without all three values because no one would be able to access the administration, moderation, or developer tools.

If an account already exists, leave all three values blank. The installer rejects partial configuration and known placeholder passwords.

If you use a reverse proxy or TLS, set `NUXT_PUBLIC_BASE_URL` to the public URL. For a reverse proxy, set `NUXT_TRUSTED_PROXIES` to the proxy's exact source IP or narrow CIDR, such as `127.0.0.1,10.0.0.0/24`. Leave it blank when the app is not behind a trusted proxy.

The app uses forwarded client addresses only when the connecting socket belongs to a configured trusted proxy. Configure the proxy to replace incoming `X-Forwarded-For` with the address it observed, or append that observed address consistently. Do not expose the app port to untrusted peers if the proxy network is intended to be the only path to the app.

Nuxt reads the `NUXT_*` settings when the server starts, so changing them and restarting does not require a rebuild.

## Install And Start The Service

Run the packaged installer from `/root/forum/<version>`:

```bash
./installer.sh
```

The installer stops a running `forum` service if one exists, loads `.env`, creates the configured embedded database directories, writes `/etc/systemd/system/forum.service`, and runs:

```bash
systemctl daemon-reload
systemctl enable --now forum
```

The app now starts automatically when the server boots.

## Upgrade

Stop the running service before replacing app files:

```bash
cd /root/forum/<current-version>
./installer.sh stop
cd /root
tar -xzf forum-<new-version>-linux-x64.tar.gz
cd /root/forum/<new-version>
./installer.sh
```

The release artifact does not include a live `.env`, so your configured `/root/forum/.env` remains in place across version folders. The data remains in `/root/forum/data`.

## Service Commands

The installer also wraps common service operations:

```bash
./installer.sh status
./installer.sh stop
./installer.sh restart
./installer.sh run
```

Use `run` only when debugging in the foreground.

## Verify

Check the service:

```bash
./installer.sh status
```

Check the health endpoint:

```bash
curl http://127.0.0.1:8001/api/health
```

Follow logs if startup fails:

```bash
journalctl -u forum -f
```

After changing `.env`, restart the service:

```bash
./installer.sh restart
```