# Ticket 0035: Developer Info Diagnostics

## Status
- State: Todo
- Priority: Medium
- Next action: Decide safe public diagnostics fields

## Goal
Expand the developer info page with non-sensitive build, deployment, and runtime metadata that helps diagnose customer issues quickly.

## Done Looks Like
- [ ] Developer info shows useful support metadata such as app version, build time, commit/ref, deployment target, base URL, runtime mode, and relevant feature/config flags where safe.
- [ ] Sensitive values such as credentials, database URLs with secrets, SMTP settings, tokens, and raw private runtime config are never exposed in the browser.
- [ ] Missing metadata renders as a clear unavailable value instead of breaking the page.
- [ ] A compact support summary can be copied or read from the page for bug reports/customer troubleshooting.

## Tasks
- [ ] Audit existing runtime config, deployment script, and package metadata for safe fields to expose.
- [ ] Add public runtime config entries or build-time environment variables for version, build date, git commit/ref, deployment environment, deployment id, and base URL.
- [ ] Update the developer info page to group metadata into readable sections such as Application, Build, Deployment, and Runtime.
- [ ] Add a copyable support summary containing the most useful non-sensitive fields.
- [ ] Document which environment variables should be set by local, staging, and production deployments.
- [ ] Test the page with fully populated metadata and with missing optional values.

## Notes
- Current page only displays `config.public.version`.
- Prefer values that are easy to provide from CI/deploy scripts, such as `BUILD_DATE`, `GIT_COMMIT`, `GIT_REF`, `DEPLOY_ENV`, and `DEPLOY_ID`.
- Keep database details coarse-grained if shown at all, such as local/remote mode or namespace label, and avoid exposing connection URLs or credentials.
- Consider using monospace formatting for identifiers and adding a simple copy action for customer support workflows.

## Relevant Files
- app/pages/developer/info.vue
- nuxt.config.ts
- package.json
- deploy.sh

## Progress Log
- 2026-07-21: Ticket created.