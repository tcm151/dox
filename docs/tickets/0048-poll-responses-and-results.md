# Ticket 0048: Poll Responses and Results

## Status
- State: Todo
- Priority: Medium
- Next action: Specify the authenticated response command and idempotency rules for each poll mode.

## Goal
Allow users to answer polls safely and show accurate results under concurrent requests, closure, expiration, and response changes.

## Done Looks Like
- [ ] Authenticated users can submit only responses permitted by the poll's configured mode and limits.
- [ ] Duplicate retries are idempotent and concurrent submissions do not lose or double-count responses.
- [ ] Closed or expired polls reject mutations while preserving readable results.
- [ ] Result visibility follows the policy defined in Ticket 0047 without exposing voter identities unintentionally.
- [ ] Radio, checkbox, and any retained free-text mode have focused success and failure coverage.

## Tasks
- [ ] Choose a response storage model that supports uniqueness, privacy, moderation, and efficient result aggregation.
- [ ] Add response schema and migrations without storing unbounded voter arrays on the poll record.
- [ ] Implement authenticated submit, replace, or withdraw operations according to the documented mode semantics.
- [ ] Implement result queries and percentages with explicit zero-response behavior.
- [ ] Enforce closure, expiration, option validity, and per-user selection limits in the mutation transaction.
- [ ] Add abuse controls and moderation handling for free-text responses if that mode remains in scope.
- [ ] Test retries, concurrent updates, changed responses, expiration boundaries, permissions, and result privacy.

## Notes
- Depends on Ticket 0047.
- Poll responses are distinct from the generic positive, misleading, and negative content votes and should not reuse that API contract.
- Prefer a relation or dedicated response record over growing user arrays inside each poll option.

## Relevant Files
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- server/api/vote/[id]/positive.ts
- server/middleware/protection.ts

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-09-28: Ticket created.