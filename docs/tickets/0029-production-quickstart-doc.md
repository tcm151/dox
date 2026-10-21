# Ticket 0029: Production Quickstart Doc

## Status
- State: In Progress
- Priority: High
- Next: Resolve the runtime environment mismatch in Ticket 0051 before clean-host install validation.

## Dependencies
- [0051](0051-production-runtime-environment-config.md): Packaged releases must apply deployment settings before the clean-host install can be validated.
- [0053](0053-trusted-proxy-rate-limit-client-addresses.md): The remaining proxy setup guidance needs the supported trusted-proxy configuration.

## Goal
Create a single production quickstart guide for a Linux VM with embedded mode as the default path. Operators are expected to configure their own reverse proxy/TLS and provide the correct `BASE_URL` for that setup.

## Requirements
- [x] Quickstart doc exists with end-to-end deploy steps.
- [x] Embedded SurrealDB is presented as default deployment mode.
- [x] Reverse proxy/TLS responsibility and `BASE_URL` expectations are documented.
- [ ] Packaged releases apply the documented deployment environment values without rebuilding.
- [ ] Service install has been validated on a clean Linux host.

## Tasks
- [x] Draft quickstart with prerequisites and deployment commands.
- [x] Include env guidance and verification checks.
- [ ] Verify the runtime configuration fix from Ticket 0051 using the shared deployment `.env`, not the build machine's settings.
- [ ] Validate guide on a clean host and adjust gaps.
- [ ] Add trusted-proxy configuration guidance when Ticket 0053 defines the supported setup.

## Notes
- Clean-host release validation depends on [Ticket 0051](0051-production-runtime-environment-config.md). Editing the shared `.env` must affect the packaged app before the install can be considered validated.
- [Ticket 0053](0053-trusted-proxy-rate-limit-client-addresses.md) covers reverse-proxy client addresses so unrelated users do not share one authentication rate limit.
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
- 2026-10-21: Linked runtime environment loading and trusted-proxy rate limiting from the application review; runtime configuration is a prerequisite for clean-host validation.
- 2026-09-28: Made startup reject empty databases without complete default account credentials and aligned setup documentation with that requirement.
- 2026-09-28: Removed predictable default account credentials from environment templates and added installer validation.
- 2026-07-21: Streamlined release staging to archive directly from a reorganized `.output` folder and remove local `.output` after archive creation.
- 2026-07-21: Moved live config to shared `/root/forum/.env`, persistent data to `/root/forum/data`, and packaged only `.env.example` for upgrades.
- 2026-07-21: Flattened release artifacts into `forum/<version>` so the built server entrypoint lives at the versioned release root.
- 2026-07-21: Updated the packaged installer and quickstart for root-home artifact deployment as an auto-starting systemd service.
- 2026-07-21: Added a packaged installer script and initial production quickstart draft for staged release artifacts.
- 2026-04-13: Ticket created.
