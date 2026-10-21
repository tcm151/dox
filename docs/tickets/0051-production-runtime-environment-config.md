# Ticket 0051: Production Runtime Environment Config

## Status
- State: Planned
- Priority: High
- Next: Map the documented environment variables to supported production runtime config overrides.

## Goal
Make installed releases use the operator's environment configuration at startup instead of retaining build-machine defaults. The same release archive must work with different database, storage, email, and default account settings without rebuilding.

## Requirements
- [ ] A packaged release reads database, media path, SMTP, public URL, site title, and default account values from the deployment environment.
- [ ] Both systemd startup and the installer's foreground run command use the same configuration rules.
- [ ] Editing deployment settings and restarting applies the new values without a rebuild.
- [ ] Missing required values fail with useful errors, and private credentials stay out of browser payloads and logs.
- [ ] Environment templates and setup guides match the implemented variable names, with migration guidance for existing shared `.env` files.

## Tasks
- [ ] Choose matching `NUXT_*` overrides or an explicit runtime mapping for the existing variable names.
- [ ] Update runtime config defaults and consumers so build-time values do not override deployment choices.
- [ ] Update the installer, release template, development template, and setup docs together.
- [ ] Verify a single packaged release under two deployment configurations and confirm database, storage path, public URL, and default account settings follow each environment.
- [ ] Cover fresh-account setup, existing installations, missing configuration, and restart behavior without logging secrets.

## Notes
- `nuxt.config.ts` uses names such as `SURREAL_URL`, `DATA_PATH`, and `DEFAULT_USER_PASSWORD` as runtime config defaults. Those expressions are evaluated during the build.
- The installer exports the same plain names, but Nuxt's automatic production overrides require `NUXT_*` names matching the runtime config structure. No explicit alias mapping currently exists.
- [Nuxt runtime config documentation](https://nuxt.com/docs/4.x/guide/going-further/runtime-config#environment-variables) describes this distinction.
- [Ticket 0029](0029-production-quickstart-doc.md) needs this fixed before clean-host release validation can be completed.

## Relevant Files
- nuxt.config.ts
- scripts/installer.sh
- scripts/release.env
- scripts/stage-release.mjs
- docs/.env.example
- docs/Quickstart.md
- docs/ContributionGuide.md
- server/plugins/01.migrations.server.ts
- server/utils/database.ts
- server/utils/media.ts

## Progress Log
- 2026-10-21: Ticket created.
