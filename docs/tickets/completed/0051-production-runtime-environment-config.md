# Ticket 0051: Production Runtime Environment Config

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Make installed releases use the operator's environment configuration at startup instead of retaining build-machine defaults. The same release archive must work with different database, storage, email, and default account settings without rebuilding.

## Requirements
- [x] A packaged release reads database, media path, SMTP, public URL, site title, and default account values from canonical deployment environment variables.
- [x] Both systemd startup and the installer's foreground run command use the same configuration rules.
- [x] Editing deployment settings and restarting applies the new values without a rebuild.
- [x] Missing required values fail with useful errors, and private credentials stay out of browser payloads and logs.
- [x] Environment templates and setup guides use the implemented variable names for fresh deployments; migration of prior shared `.env` files is out of scope.

## Tasks
- [x] Use canonical `NUXT_*` overrides for all Nuxt runtime config values; do not support legacy plain-name aliases.
- [x] Use empty runtime config defaults and runtime metadata so build-time environment values do not override deployment choices.
- [x] Update the installer, release template, development template, and setup docs together.
- [x] Bundle production dependencies into OS- and architecture-specific release archives using the existing Yarn lockfile.
- [x] Verify a single packaged release under two deployment configurations and confirm database, storage path, public URL, and default account settings follow each environment.
- [x] Cover fresh-account setup, missing configuration, and restart behavior without logging secrets.

## Notes
- `nuxt.config.ts` must not use deployment environment values as runtime config defaults because those expressions are evaluated during the build.
- Canonical runtime variables follow the nested config structure: for example, `NUXT_SURREAL_INFO_URL`, `NUXT_DATA_PATH`, and `NUXT_SURREAL_ADMIN_PASSWORD`.
- The installer accepts only canonical `NUXT_*` settings, validates required values, and uses the same config loading path for systemd and foreground runs. This release targets fresh deployments; prior plain-name `.env` migration is out of scope.
- Release staging installs production dependencies from `yarn.lock` into `server/node_modules`; archives are named for the build OS and architecture. Build a separate artifact for each target platform.
- Linux-native artifact execution was explicitly deferred by the operator and remains a separate follow-up; Windows x64 packaged runtime checks were completed.
- [Nuxt runtime config documentation](https://nuxt.com/docs/4.x/guide/going-further/runtime-config#environment-variables) describes this distinction.
- [Ticket 0029](0029-production-quickstart-doc.md) documents the packaged deployment workflow; clean Linux-host validation remains a follow-up.

## Relevant Files
- nuxt.config.ts
- scripts/installer.sh
- scripts/release.env
- scripts/stage-release.mjs
- docs/.env.example
- docs/Quickstart.md
- docs/ContributionGuide.md
- server/plugins/01.startup.server.ts
- server/utils/database.ts
- server/utils/media.ts

## Progress Log
- 2026-10-22: Marked complete after Windows x64 packaged runtime validation with two isolated configurations, restart, missing-config handling, and secret-exposure checks. Linux-native artifact execution was explicitly deferred as a separate follow-up.
- 2026-10-22: Review found that the freshly resolved `@surrealdb/node` peer `@surrealdb/node-native` was not included in staged production dependencies, and that the installer's default `PORT` was not exported to Node. Added the native engine dependency and staging assertion, exported the fallback port, and preserved an explicit `NODE_BIN` in the generated service. The rebuilt Windows x64 artifact passed embedded startup, health, and `/feed` checks on the default port. Linux artifact execution remains open.
- 2026-10-22: The Windows x64 packaged release passed two isolated deployment configurations through the bundled installer. Both databases and data paths were distinct, each admin login succeeded, and each configured title rendered. Restarting one deployment after changing its title applied the change without rebuilding; a missing `NUXT_DATA_PATH` failed with an actionable message. The configured password was absent from rendered HTML and startup logs. Linux-native artifact execution remains open.
- 2026-10-21: Source review confirmed canonical runtime overrides, shared systemd/foreground launch flow, and restart-time config loading without rebuild. Production dependencies are bundled per build platform; Linux artifact and two-environment checks remain open.
- 2026-10-21: Switched the installer and templates to canonical Nuxt runtime variables only. Fresh deployments are in scope; legacy `.env` migration is not. Packaged two-environment validation remains open.
- 2026-10-21: Ticket created.