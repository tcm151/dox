# Ticket 0019: Referral Redemption Hardening

## Status
- State: Todo
- Priority: High
- Next action: Audit current referral claim path for replay and race conditions

## Goal
Harden referral redemption for idempotency and abuse resistance while keeping user feedback clear.

## Done Looks Like
- [ ] Referral claims are idempotent under retries/concurrency.
- [ ] Abuse paths (replay/self-claim/multiple claims) are blocked.
- [ ] User sees clear success/failure reasons.

## Tasks
- [ ] Review referral claim state transitions and constraints.
- [ ] Add missing validation and conflict handling.
- [ ] Add tests for replay/race scenarios.

## Notes

## Relevant Files
- [app/pages/store.vue](../../app/pages/store.vue)
- [server/api/profile/referral.ts](../../server/api/profile/referral.ts)
- [server/utils/auth.ts](../../server/utils/auth.ts)
- [shared/types/index.ts](../../shared/types/index.ts)

## Progress Log
- 2026-04-13: Ticket created.


