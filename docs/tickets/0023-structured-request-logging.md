# Ticket 0023: Structured Request Logging

## Status
- State: In Progress
- Priority: Medium
- Next action: Add request correlation fields and explicit redaction rules to the existing error logging path

## Goal
Add structured request logging for key API actions to improve debugging and incident response.

## Done Looks Like
- [ ] Server logs include structured fields for request context.
- [ ] Sensitive data is redacted by default.
- [ ] Error correlation is possible across request lifecycle.

## Existing Foundation
- [x] Developer-only error viewer exists at `/developer/errors`.
- [x] Errors are persisted through the Nitro error handler into the `error` table.
- [x] Error records include status, description, time, user, stack, error data, and a request context object.
- [x] Request context currently captures path, method, IP, origin, host, referer, and user agent.
- [x] Developer error page can filter by status code, date range, and result limit.

## Current Gap
The existing implementation is an error inspection tool, not a full structured request logging pipeline. It only records requests that become handled errors, and most request metadata lives inside a flexible `request` object. There is no request ID, duration, lifecycle event, explicit redaction policy, or way to correlate an error with related request activity.

## Tasks
- [x] Inventory the current developer errors page and error persistence path.
- [ ] Define a minimal request log schema that builds on the current `error` record shape.
- [ ] Define redaction rules for headers, request bodies, query parameters, and `error.data`.
- [ ] Add a request/correlation ID in middleware and include it in persisted error records.
- [ ] Capture duration and normalized route metadata for handled errors.
- [ ] Add a small developer errors page affordance for request/correlation ID lookup.
- [ ] Consider a separate `requestLog` table for selected high-risk successful actions after the error path is structured.
- [ ] Validate output in local/dev and production-like runs.

## Suggested Small Expansions
- Start with the current `error` table instead of introducing a new logging surface immediately.
- Promote commonly queried fields out of the flexible `request` object over time: request ID, method, path, IP, user agent, duration, and route/action name.
- Keep request body logging off by default; allow only explicit, redacted metadata for high-risk handlers.
- Treat successful request logging as a follow-up slice for sensitive actions such as authentication, media upload/delete, moderation actions, and admin changes.

## Notes
- The current developer errors page already covers much of the debugging workflow for failed requests.
- The main missing pieces for the original ticket intent are lifecycle correlation, stronger structure, and redaction guarantees.

## Relevant Files
- server/plugins/errorHandler.ts
- server/middleware/protection.ts
- server/api/[...].ts
- server/utils/database.ts
- server/assets/schema.surql
- shared/types/index.ts
- app/pages/developer/errors.vue
- server/api/developer/error/index.ts

## Progress Log
- 2026-07-21: Reviewed current developer errors page and error persistence path. Existing implementation already provides developer-only persisted error inspection with basic request context; remaining work should be scoped as small structured logging and correlation improvements.
- 2026-04-13: Ticket created.


