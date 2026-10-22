# Ticket 0029: Production Quickstart Doc

## Status
- State: Completed
- Priority: High
- Next: None

## Dependencies
- [0051](0051-production-runtime-environment-config.md): Packaged runtime configuration was validated before completing the quickstart scope.
- [0053](0053-trusted-proxy-rate-limit-client-addresses.md): Trusted-proxy configuration and setup guidance are complete.

## Goal
Create a single production quickstart guide for a Linux VM with embedded mode as the default path. Operators are expected to configure their own reverse proxy/TLS and provide the correct `BASE_URL` for that setup.

## Requirements
- [x] Quickstart doc exists with end-to-end deploy steps.
- [x] Embedded SurrealDB is presented as default deployment mode.
- [x] Reverse proxy/TLS responsibility and `BASE_URL` expectations are documented.
- [x] Packaged releases apply the documented deployment environment values without rebuilding.

## Tasks
- [x] Draft quickstart with prerequisites and deployment commands.
- [x] Include env guidance and verification checks.
- [x] Verify the runtime configuration fix from Ticket 0051 using the shared deployment `.env`, not the build machine's settings.
- [x] Add trusted-proxy configuration guidance from Ticket 0053.

## Notes
- Runtime configuration was validated using the packaged Windows x64 release under two isolated deployment configurations; see [Ticket 0051](0051-production-runtime-environment-config.md).
- [Ticket 0053](0053-trusted-proxy-rate-limit-client-addresses.md) implements trusted-proxy client addresses and its setup guidance is included in the quickstart.
- Follow-up: Validate the Linux-native release artifact and service installation on a clean Linux host when that environment is available.
- Keep this practical and copy-paste friendly.
- Warning: do not package a live `.env`; upgrades rely on shared `/root/forum/.env` remaining outside versioned release folders.
- Installer commands: `install` default, `run`, `status`, `stop`, and `restart`.
- Installer stops a running `forum` service before install work and writes a systemd unit pointing at the current version folder.
- Operators configure their own reverse proxy/TLS and must set `BASE_URL` to the public URL for that setup.
- Revisit friendlier messages for `status` and `restart` before the service has been installed.
- Revisit safer `.env` parsing later if the installer grows beyond this simple deployment path.

### Current Decisions
- The release staging script creates `releases/forum-<version>.tar.gz` and removes local `.output` after archive creation.
- Archives extract to `forum/<version>`, which maps to `/root/forum/<version>` on the target host.
- Built `.output` contents are flattened into the versioned release folder, so the server entrypoint is `<version>/server/index.mjs`.
- Persistent data defaults to `/root/forum/data`, beside the versioned release folders.
- Packaged releases include `.env.example`; the installer may create shared `/root/forum/.env` if missing, but upgrades must preserve operator config.
- Packaged default account credentials are blank by default. Fresh installations must configure all three `DEFAULT_USER_*` values or startup fails; existing installations with an account may leave all three blank. Partial values and known placeholder passwords are rejected.

## Relevant Files
- docs/ContributionGuide.md
- docs/Quickstart.md
- scripts/installer.sh
- scripts/release.env
- scripts/stage-release.mjs
- .gitignore
- package.json

## Progress Log
- 2026-10-22: Completed the quickstart scope after validating packaged runtime configuration through Ticket 0051 and adding trusted-proxy guidance from Ticket 0053. Deferred clean Linux-host installation validation as a separate follow-up because that environment is not currently available.
- 2026-10-21: Linked runtime environment loading and trusted-proxy rate limiting from the application review; runtime configuration is a prerequisite for clean-host validation.
- 2026-09-28: Made startup reject empty databases without complete default account credentials and aligned setup documentation with that requirement.
- 2026-09-28: Removed predictable default account credentials from environment templates and added installer validation.
- 2026-07-21: Streamlined release staging to archive directly from a reorganized `.output` folder and remove local `.output` after archive creation.
- 2026-07-21: Moved live config to shared `/root/forum/.env`, persistent data to `/root/forum/data`, and packaged only `.env.example` for upgrades.
- 2026-07-21: Flattened release artifacts into `forum/<version>` so the built server entrypoint lives at the versioned release root.
- 2026-07-21: Updated the packaged installer and quickstart for root-home artifact deployment as an auto-starting systemd service.
- 2026-07-21: Added a packaged installer script and initial production quickstart draft for staged release artifacts.
- 2026-04-13: Ticket created.
