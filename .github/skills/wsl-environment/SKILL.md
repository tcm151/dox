---
name: wsl-environment
description: "Use when setting up or managing the ClassicForum WSL environment, building Linux releases, testing the installer, or operating the local production-style deployment example."
---

# WSL Linux Testing

Use WSL to build Linux releases and test packaged deployments.

## 1. Open WSL

From a PowerShell terminal, check the installed distributions and open Ubuntu:

```powershell
wsl --list --verbose
wsl --distribution Ubuntu-24.04
```

Use the interactive Linux prompt for Linux commands. If WSL asks for a password, prompt the developer; never send passwords through chat. Confirm the distro and user if unsure:

```bash
whoami
cat /etc/os-release
```

## 2. Check The Workspace

Keep the native repository clone under `~/projects/` and deployment examples outside it under `~/deployments/`:

```bash
cd ~/projects/dox
git status --short
git rev-parse --short HEAD
command -v node
node --version
yarn --version
```

The WSL clone is separate from the Windows checkout. Review its branch, commit, version, and working tree before building; Windows-only uncommitted changes are not included. Keep Linux source, build output, and test data in the WSL filesystem under `/home/`; use `/mnt/c` only when deliberately exchanging files with Windows.

Use a recent Node.js LTS release and Yarn as described in the [Contribution Guide](../../../docs/ContributionGuide.md). In Ubuntu, use `nvm` rather than `nvm-windows` to manage Node.js. If `node` is missing or resolves under `/mnt/c`, install Linux Node with [nvm](https://github.com/nvm-sh/nvm#installing-and-updating), then set up the project runtime:

```bash
nvm install --lts
nvm alias default 'lts/*'
npm install --global yarn@1.22.22
```

## 3. Build A Linux Release

Build from the native Linux clone, not from `/mnt/c`:

```bash
cd ~/projects/dox
yarn install
yarn stage:release
sha256sum -c releases/forum-<version>-linux-x64.tar.gz.sha256
```

Use the archive and checksum names printed by the staging command. Copy a release to the Windows checkout only when needed. Keep deployment data under `~/deployments/`, not inside `~/projects/`.

## 4. Manage A Test Deployment

Keep each example in `~/deployments/<example-name>`, with its release, environment file, and data separated from the source checkout. Use an embedded database and example-specific ports. Bind the app and Nginx to loopback; never connect a local example to the production database.

From the packaged release directory, use the installer for the app service and `systemctl` for Nginx:

```bash
sudo ./installer.sh status
sudo systemctl status <proxy-service> --no-pager
sudo ./installer.sh start
sudo systemctl start <proxy-service>
curl --fail-with-body http://127.0.0.1:<proxy-port>/api/health
sudo ./installer.sh stop
sudo systemctl stop <proxy-service>
```

Leave the services stopped between test sessions. Preserve example data and environment files; never print or commit `.env` contents.

## 5. Test A Backup Restore

Use a unique temporary directory under `~/deployments/backup-*`. Keep any persistent example unchanged.

From a stopped, isolated WSL deployment, create a database-only backup. Keep the default `forum.service` inactive throughout this test:

```bash
release_dir=/path/to/forum/<version>
cd "$release_dir"
sudo ./installer.sh backup
```

Copy the release and printed archive into the default sibling layout:

```bash
test_dir="$HOME/deployments/backup-restore-test-$(date -u +%Y%m%dT%H%M%SZ)-$$"
test_release_dir="$test_dir/$(basename "$release_dir")"
archive=/path/to/classicforum-db-<timestamp>-<pid>.tar.gz

mkdir -p "$test_dir/backups" "$test_dir/data"
cp -a "$release_dir" "$test_release_dir"
cp "$release_dir/.env.example" "$test_dir/.env"
cp "$archive" "$archive.sha256" "$test_dir/backups/"
chmod 600 "$test_dir/.env"
```

Use the archive and checksum printed by `backup`; it contains only the RocksDB database directory. Configure the test `.env` with absolute paths under `$test_dir` for `NUXT_DATA_PATH` and `rocksdb://`; the database directory name must match the archive (usually `default.db`). Set an unused loopback port and `NITRO_HOST=127.0.0.1`. Keep the namespace/database identifiers needed by the snapshot, restrict credentials, and do not display the file. Confirm `forum.service` is inactive before restoring so the test cannot interrupt another deployment.

The installer finds the `.env` and backup directory from the default layout, so no path overrides are needed:

```bash
cd "$test_release_dir"
./installer.sh install --no-service
sudo ./installer.sh restore
./installer.sh run
```

`install --no-service` prepares the copied release without touching systemd. `restore` selects the latest archive from the default `backups/` directory, verifies it, preserves the test database before replacing it, and matches the restored database ownership to the existing database or its parent directory. Check `/api/health`, then verify representative records and media. Stop the foreground process before removing only the temporary test directory.

For the recovery procedure and rollback checks, see [Backup And Restore](../../../docs/Backups.md). For the packaged service layout, see [Production Quickstart](../../../docs/Quickstart.md).

## 6. Stop WSL

Stop test processes and services before closing WSL. From PowerShell, `wsl --terminate Ubuntu-24.04` stops that distribution; `wsl --shutdown` stops every running distribution and should be used only when intended. Do not stop WSL during a build, backup, restore, or database operation.