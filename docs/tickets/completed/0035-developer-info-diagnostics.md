# Ticket 0035: Developer Info Diagnostics

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Expand the developer info page with non-sensitive build, deployment, and runtime metadata that helps diagnose customer issues quickly.

## Requirements
- [x] Developer info shows useful automatically available support metadata such as app version, build time, commit/ref, current base URL, and runtime mode.
- [x] Sensitive values such as credentials, database URLs with secrets, SMTP settings, tokens, and raw private runtime config are never exposed in the browser.
- [x] Missing metadata renders as a clear unavailable value instead of breaking the page.
- [x] A compact support summary can be copied or read from the page for bug reports/customer troubleshooting.

## Tasks
- [x] Audit existing runtime config, deployment script, and package metadata for safe fields to expose.
- [x] Capture build date and Git revision/ref automatically, reusing package version and browser origin without requiring extra environment variables.
- [x] Present the metadata in one readable table with an explicit public-field allowlist.
- [x] Add a copyable support summary containing the most useful non-sensitive fields.
- [x] Document the automatic metadata sources and public/private configuration boundary; no diagnostics environment variables are required.
- [x] Test populated metadata, unavailable-value handling, and safe base URL formatting.

## Notes
- The package version comes from `package.json`; build time and Git revision/ref are captured automatically during Nuxt configuration.
- The base URL is derived from the browser origin. Git metadata is unavailable when building from a source archive without `.git`.
- No database connection details or private runtime settings are displayed.

## Relevant Files
- app/pages/developer/info.vue
- app/utils/developer-info.ts
- nuxt.config.ts
- package.json
- deploy.sh
- docs/Architecture.md
- docs/Contributing.md
- tests/parallel/developer-info.browser.test.ts

## Progress Log
- 2026-11-15: Added automatically tracked version/build/Git/runtime diagnostics in one table with a copyable summary; the user reviewed the table layout and requested automatic base URL display, no category column, transparent row headers, and left-aligned cells.
- 2026-07-21: Ticket created.
