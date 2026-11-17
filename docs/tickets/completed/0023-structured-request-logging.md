# Ticket 0023: Structured Request Logging

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Add structured request logging for key API actions to improve debugging and incident response.

## Requirements
- [x] Handled API errors include structured request context and a correlation ID.
- [x] Sensitive data is redacted by default and request bodies are not logged.
- [x] Developers can correlate an API error hint with its persisted error detail.

## Tasks
- [x] Inventory the current developer errors page and error persistence path.
- [x] Define a minimal request log schema that builds on the current `error` record shape.
- [x] Define redaction rules for headers, request bodies, query parameters, and `error.data`.
- [x] Add a request/correlation ID in middleware and include it in persisted error records.
- [x] Capture duration and normalized route metadata for handled errors.
- [x] Add a small developer errors page affordance for request/correlation ID lookup.
- [x] Consider a separate `requestLog` table; keep the existing `error` record as the only logging surface for now.
- [x] Validate output in local/dev integration tests and browser flows.

## Notes
- This ticket covers handled API errors; successful-request logging remains a separate future scope.
- A separate `requestLog` table was considered and is not needed for the current error-logging scope.
- Production-like deployment validation remains an operational follow-up; this ticket was verified in local/dev.

### Existing Foundation
- [x] Developer-only error viewer exists at `/developer/errors`.
- [x] Errors are persisted through the Nitro error handler into the `error` table.
- [x] Error records include status, description, time, user, stack, error data, and a request context object.
- [x] Request context currently captures path, method, IP, origin, host, referer, and user agent.
- [x] Developer error page can filter by status code, date range, and result limit, or look up a request ID and expand its matching error.

### Deferred Beyond This Ticket
- Successful requests are not logged. Revisit them separately if high-risk action audit logs are needed; introduce a new table only if the existing error record cannot support that use case.

### Suggested Small Expansions
- Start with the current `error` table instead of introducing a new logging surface immediately.
- Promote commonly queried fields out of the flexible `request` object over time: request ID, method, path, IP, user agent, duration, and route/action name.
- Keep request body logging off by default; allow only explicit, redacted metadata for high-risk handlers.
- Treat successful request logging as a follow-up slice for sensitive actions such as authentication, media upload/delete, moderation actions, and admin changes.

## Relevant Files
- server/plugins/errorHandler.ts
- server/middleware/protection.ts
- server/api/developer/error/index.ts
- app/components/system/Hints.client.vue
- app/utils/hints.ts
- app/pages/developer/errors.vue
- server/api/[...].ts
- server/utils/DatabaseQuery.ts
- server/assets/schema.surql
- shared/types/index.ts

## Progress Log
- 2026-10-27: Closed the handled-error logging scope after local integration and browser validation. Confirmed request-ID lookup, linked hint navigation, automatic hint dismissal on arrival, redaction, and persistent manual dismissal. Decided against a separate request-log table for now; production-like deployment validation remains an operational follow-up. `yarn test` passes (7/7 phases).
- 2026-10-27: Made error hints persistent until manually dismissed with an accessible X control. Browser validation confirmed a local validation error survives the configured hint timeout and dismisses on click; integration tests pass (7/7 phases). Production-like validation remains open.
- 2026-10-27: Added exact request-ID lookup to the developer error API and page, including auto-expansion and request context details. API-backed error hints carry the response correlation ID and link to the matching detail for developers. Integration suite passes (7/7 phases); local browser confirmed the linked hint and expanded detail. Test error records were removed; production-like validation remains open.
- 2026-10-27: Resumed with request correlation and redaction for handled errors. Added a typed request context, server-generated request IDs, duration and query-free paths, redaction for error text/data and retained headers, and integration coverage. `yarn test` passes (7/7 phases); developer-page lookup and production-like validation remain open.
- 2026-10-23: Paused while other work is prioritized; resume with request correlation fields and explicit redaction rules.
- 2026-07-21: Reviewed current developer errors page and error persistence path. Existing implementation already provides developer-only persisted error inspection with basic request context; remaining work should be scoped as small structured logging and correlation improvements.
- 2026-04-13: Ticket created.
