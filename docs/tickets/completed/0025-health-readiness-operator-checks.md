# Ticket 0025: Health/Readiness Operator Checks

## Status
- State: Done
- Priority: High
- Next action: None

## Goal
Define and document health/readiness checks so deployments can detect degraded startup/runtime conditions early.

## Done Looks Like
- [x] Health/readiness endpoint behavior is clearly defined.
- [x] Operator check steps are documented for local and server environments.
- [x] Startup migration failure state is reflected in readiness behavior.

## Tasks
- [x] Specify health and readiness semantics.
- [x] Implement/update endpoint(s) and server checks as needed.
- [x] Add docs for operator verification workflow.

## Notes
- `GET /api/health` returns the full app health report.
- `GET /api/health` returns `200` only when startup migrations completed and a cheap SurrealDB query succeeds.
- `GET /api/health` returns `503` while migrations are not complete or when the database check fails.
- The response body includes `app`, `database`, `version`, `timeStarted`, `lastChecked`, and `uptime` without exposing database credentials or error internals.

### Operator Verification
- Local check: `curl -i http://localhost:3000/api/health`
- Server check: `curl -i https://<host>/api/health`
- Expected healthy result: `/api/health` returns `200` with `app: "ready"` and `database: "ready"`.
- Expected degraded result: `/api/health` returns `503` if migrations are still running, migrations failed, or SurrealDB cannot be queried.
- If a migration failure prevents Nitro from starting, readiness appears as connection refusal or upstream `502/503` from the process manager/proxy rather than a JSON response.

## Relevant Files
- nuxt.config.ts
- server/plugins/01.migrations.server.ts
- server/api/health.ts
- server/utils/health.ts
- docs/Architecture.md
- docs/Roadmap.md

## Progress Log
- 2026-07-21: Marked ticket complete and moved it to completed tickets.
- 2026-07-21: Combined health and readiness behavior into a single `/api/health` app health report endpoint.
- 2026-07-21: Added MVP health endpoint, migration readiness state, and operator check docs.
- 2026-04-13: Ticket created.