# Ticket 0023: Structured Request Logging

## Status
- State: Todo
- Priority: Medium
- Next action: Define minimum log fields and redaction rules

## Goal
Add structured request logging for key API actions to improve debugging and incident response.

## Done Looks Like
- [ ] Server logs include structured fields for request context.
- [ ] Sensitive data is redacted by default.
- [ ] Error correlation is possible across request lifecycle.

## Tasks
- [ ] Define logging schema and redaction policy.
- [ ] Implement logging in middleware and high-risk handlers.
- [ ] Validate output in local/dev and production-like runs.

## Notes

## Relevant Files
- [server/plugins/errorHandler.ts](../../server/plugins/errorHandler.ts)
- [server/middleware/protection.ts](../../server/middleware/protection.ts)
- [server/api/[...].ts](../../server/api/[...].ts)
- [server/utils/database.ts](../../server/utils/database.ts)

## Progress Log
- 2026-04-13: Ticket created.


