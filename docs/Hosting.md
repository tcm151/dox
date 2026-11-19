# Hosting

Hosting profile, limits, and measurement plan. No capacity guarantees.

## Evidence To Date

- WSL validation candidate: Linux x64 package `2026.6.3`, built from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a`; SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`. This is not the published archive.
- Environment: WSL2 Ubuntu 24.04. This was not a fresh host and is not equivalent to independent installation on a clean server.
- Database: embedded SurrealDB with RocksDB. Remote SurrealDB is an advanced configuration and was not part of this deployment baseline.
- Operations exercised: isolated install, systemd service restart, reverse-proxy health checks, previous-release upgrade, and database recovery. Details and limits are tracked in [Ticket 0118](tickets/0118-close-public-release-validation-gaps.md).
- Published release asset: GitHub lists the `v2026.6.3` Linux x64 archive at commit `20c02b9b5b83645ed7165838ca29dd6e3272b77c`, with SHA-256 `994e14da79db8cad6f1465687ed273fa5b470f96a00203b03ba9f8ef5d9d5aa1`. This release-asset digest does not verify which archive was installed on production.
- Production: Developer Info reports version `2026.6.3`, ref `v2026.6.3`, commit `20c02b9b5b83645ed7165838ca29dd6e3272b77c`, and build date `2026-11-18T22:15:01.408Z`. The local `v2026.6.3` tag resolves to the same commit. The health endpoint reported app and database `ready` at `2026-11-19T01:18:21.590Z`. Host OS/architecture, Node.js version, database mode, production artifact checksum, and workload measurements remain unknown.
- The WSL Node.js version was not recorded.
- CPU, memory, disk growth, concurrent-user capacity, and backup-storage measurements have not been collected. No capacity or cost estimate is currently supported by evidence.

Release support follows published scope; host details and capacity remain unverified.

## Profile For The Next Measurement

Use one Linux x64 host with Ubuntu 24.04, Node.js 24 LTS, one service, and embedded SurrealDB. `/srv/forum/*` paths are examples; use the actual install location. Terminate TLS at a reverse proxy, trust only its source address, and do not expose app or database ports directly to untrusted networks.

This is a candidate measurement profile, not a minimum requirement. Record the actual CPU model/count, memory, storage type/capacity, filesystem, OS image, Node.js version, package version, commit, and database mode for every run. Do not treat results from this profile as evidence for remote-database deployments, other operating systems, or other architectures.

## Current Limits And Responsibilities

| Area | Current behavior | Operator note |
| --- | --- | --- |
| Images | Enabled by default; default per-file upload limit is 10 MB and is configurable. Upload requires a confirmed account. | Image processing may change stored size. Upload token charges are calculated from the processed bytes in 2 KiB units. The `media.tokens.enabled` setting is reserved and does not disable upload token accounting. |
| Audio | Default limit is 100 MB, but audio publishing is disabled by default and marked unfinished in the admin UI. | Do not treat audio as part of the pilot-supported workflow. |
| Video | Disabled by default; publishing is unfinished and has no supported end-to-end workflow. | The configured size field is not evidence that video upload or playback is supported. |
| Email | SMTP is optional. The scheduled spool defaults to 100 emails per day, batches of 10, and 3 retries after the initial attempt; one worker runs every 10 minutes. | Provider delivery and a real mailbox have not been verified. Configure SMTP and test delivery independently before relying on transactional mail. |
| Storage and recovery | `NUXT_DATA_PATH` contains uploaded media and, for embedded mode, the database. The installer database backup excludes media and `.env`. | Back up the database, media, and `.env` separately, and keep a protected off-host copy. See [Backup And Restore](Backups.md). |
| Public indexing | The app emits an indexable robots directive by default; `robots.txt` disallows `/admin/`, `/developer/`, and `/settings/`. | This does not guarantee crawler access or search-engine indexing. External indexing has not been checked, and no search visibility claim is made. |

Defaults describe source behavior, not capacity. Hosting and backup costs are operator-specific; no estimates have been validated. Content import is outside this baseline; plan it separately. Hosting, off-host backups, and recovery remain operator responsibilities.

## Bounded Measurement Plan

Run only on a disposable, authorized host with test accounts and content. Do not direct this test at production or send email to real recipients.

1. Record the profile details above and the exact release archive checksum. Note proxy configuration and whether database and media are on the same filesystem.
2. Install a fresh embedded-mode deployment. Record host memory, available disk, and service/app/database versions before startup. After a 5-minute warmup, sample CPU and resident memory every minute for 15 minutes with no user traffic.
3. Seed 5 test accounts, 100 text posts or threads, and 20 images split across representative 0.25 MB, 1 MB, and 5 MB files. With 5 concurrent test sessions, browse feeds and detail pages and upload one additional image per session over a 10-minute interval.
4. Sample CPU and resident memory once per minute during the workload. Record request errors and health status. Measure database and media directory sizes before and after the workload; record free disk space and filesystem type.
5. Create a database backup using the documented embedded procedure. Separately archive the media directory and `.env`; record each archive size, elapsed time, checksum result, and total storage needed for one restore point.
6. Publish the exact host, dataset, durations, observations, and any failures. Repeat the run before comparing results. Label observations as measurements, not minimum requirements or capacity guarantees.

The workload is an initial bounded comparison fixture, not a claim that it represents every small community. Adjust it only by recording the change and keeping runs comparable. Live SMTP, remote SurrealDB, media-heavy usage, multiple app workers, and other host sizes remain outside this baseline.