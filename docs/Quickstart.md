# Production Quickstart

Use this guide to install a forum release on a Linux server. Releases live in versioned folders such as `/root/forum/<version>`, while persistent data stays in `/root/forum/data`.

## Prerequisites

- A Linux VM or server with `systemd`.
- Root shell access.
- Node.js LTS installed and available as `node`.
- A forum release artifact already downloaded to the server, such as `forum-<version>.tar.gz`.

## Install The Artifact

Log in as root, then unpack the release under `/root`:

```bash
cd /root
tar -xzf forum-<version>.tar.gz
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
	data/
```

## Configure Environment

Each release includes `.env.example`. Create the shared `.env` beside the version folders, then review it before the first start:

```bash
cp -n .env.example ../.env
nano ../.env
```

The installer also creates `../.env` from `.env.example` if `../.env` is missing. It will not overwrite an existing shared config.

The default path uses embedded SurrealDB with data stored beside the versioned release folder:

```bash
DATA_PATH=../data
SURREAL_TYPE=embedded
SURREAL_URL=rocksdb://../data/database/default.db
```

Set these values before starting the service. Use unique credentials for all three `DEFAULT_USER_*` fields:

```bash
PORT=8001
BASE_URL=http://your-server-hostname-or-ip:8001
SITE_TITLE="Forum"
SITE_TITLE_SHORT="Forum"
DEFAULT_USER_EMAIL=
DEFAULT_USER_NAME=
DEFAULT_USER_PASSWORD=
```

If values contain spaces, wrap them in quotes.

The default account receives the `moderator`, `admin`, and `developer` roles. It is created only when no accounts exist. A fresh installation will not start without all three values because no one would be able to access the administration, moderation, or developer tools.

If an account already exists, leave all three values blank. The installer rejects partial configuration and known placeholder passwords.

If you use a reverse proxy or TLS, set `BASE_URL` to the public URL.

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
tar -xzf forum-<new-version>.tar.gz
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