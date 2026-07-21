# Ticket 0029: Production Quickstart Doc

## Status
- State: In Progress
- Priority: High
- Next action: Validate service install on a clean Linux host

## Goal
Create a single production quickstart guide for a Linux VM with embedded mode as the default path. Operators are expected to configure their own reverse proxy/TLS and provide the correct `BASE_URL` for that setup.

## Done Looks Like
- [x] Quickstart doc exists with end-to-end deploy steps.
- [x] Embedded SurrealDB is presented as default deployment mode.
- [x] Reverse proxy/TLS responsibility and `BASE_URL` expectations are documented.
- [ ] Service install has been validated on a clean Linux host.

## Tasks
- [x] Draft quickstart with prerequisites and deployment commands.
- [x] Include env guidance and verification checks.
- [ ] Validate guide on a clean host and adjust gaps.

## Notes
- Keep this practical and copy-paste friendly.
- Warning: do not package a live `.env`; upgrades rely on shared `/root/forum/.env` remaining outside versioned release folders.
- Installer commands: `install` default, `run`, `status`, `stop`, and `restart`.
- Installer stops a running `forum` service before install work and writes a systemd unit pointing at the current version folder.
- Operators configure their own reverse proxy/TLS and must set `BASE_URL` to the public URL for that setup.
- Revisit friendlier messages for `status` and `restart` before the service has been installed.
- Revisit safer `.env` parsing later if the installer grows beyond this simple deployment path.

## Current Decisions
- The release staging script creates `releases/forum-<version>.tar.gz` and removes local `.output` after archive creation.
- Archives extract to `forum/<version>`, which maps to `/root/forum/<version>` on the target host.
- Built `.output` contents are flattened into the versioned release folder, so the server entrypoint is `<version>/server/index.mjs`.
- Persistent data defaults to `/root/forum/data`, beside the versioned release folders.
- Packaged releases include `.env.example`; the installer may create shared `/root/forum/.env` if missing, but upgrades must preserve operator config.

## Relevant Files
- docs/ContributionGuide.md
- docs/Quickstart.md
- scripts/installer.sh
- scripts/release.env
- scripts/stage-release.mjs
- .gitignore
- package.json

## Progress Log
- 2026-07-21: Streamlined release staging to archive directly from a reorganized `.output` folder and remove local `.output` after archive creation.
- 2026-07-21: Moved live config to shared `/root/forum/.env`, persistent data to `/root/forum/data`, and packaged only `.env.example` for upgrades.
- 2026-07-21: Flattened release artifacts into `forum/<version>` so the built server entrypoint lives at the versioned release root.
- 2026-07-21: Updated the packaged installer and quickstart for root-home artifact deployment as an auto-starting systemd service.
- 2026-07-21: Added a packaged installer script and initial production quickstart draft for staged release artifacts.
- 2026-04-13: Ticket created.
