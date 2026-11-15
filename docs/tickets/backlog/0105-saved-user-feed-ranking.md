# Ticket 0105: Saved-User Feed Ranking

## Status
- State: Planned
- Priority: Medium
- Next: Define how saved-user content ranks relative to the selected following-feed sort mode.

## Dependencies
- [0058](../0058-user-awards-and-saved-subscriptions.md): User save relationships and profile controls must be available first.

## Goal
Define and implement a distinct ranking effect for content from users the viewer has saved, separate from following-feed eligibility.

## Requirements
- [ ] Document how saved-user rank interacts with each supported following-feed sort mode.
- [ ] Apply saved-user ranking without changing the existing following-feed inclusion rules.
- [ ] Preserve deterministic ordering and pagination across pages.
- [ ] Cover ranking precedence, pagination, and unaffected non-following feeds with focused tests.

## Tasks
- [ ] Agree on the ranking policy, including whether saved-user status is primary ordering or a tie-breaker.
- [ ] Implement the policy in the following-feed query while preserving stable tie-breaking.
- [ ] Add isolated tests for saved and unsaved authors across supported sort modes and pages.

## Notes
- Ticket 0058 covers user awards and saved subscriptions; this follow-up is intentionally deferred.
- Do not assume saved-user status outranks the selected hot or top sort until the policy is agreed.

## Relevant Files
- server/utils/feedPagination.ts
- tests/sequential/09-feeds.server.test.ts

## Progress Log
- 2026-11-14: Ticket created from the deferred ranking scope in Ticket 0058.
