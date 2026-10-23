# Ticket 0019: Referral Redemption Hardening

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Harden referral redemption for idempotency and abuse resistance while keeping user feedback clear.

## Requirements
- [x] Referral claims are idempotent under retries/concurrency.
- [x] Abuse paths (replay/self-claim/multiple claims) are blocked.
- [x] User sees clear success/failure reasons.

## Tasks
- [x] Review referral claim state transitions and constraints.
- [x] Add missing validation and conflict handling.
- [x] Defer replay/race test coverage until the basic test-suite pattern is established in Ticket 0056.

## Notes
- Referral-specific replay and concurrency tests are deferred; follow-up test work should use the patterns established in Ticket 0056.

## Relevant Files
- app/pages/store.vue
- server/api/profile/referral.ts
- server/utils/auth.ts
- server/utils/repos/ReferralManager.ts
- server/assets/schema.surql
- server/assets/migrations/2026.5.4.surql
- shared/types/index.ts

## Progress Log
- 2026-10-23: Closed the implementation scope; referral-specific replay and concurrency tests are deferred until Ticket 0056 establishes basic test conventions.
- 2026-10-23: Deferred referral-specific tests until the basic suite is expanded and establishes a reusable pattern; see Ticket 0056.
- 2026-10-23: Completed claim-flow audit and validation/conflict handling; replay and concurrency tests are the remaining task.
- 2026-10-23: Audited current claims; the dev database has no duplicate claimants. Implemented claimant-wide uniqueness, transactional rewards, validation, and Store redemption feedback.
- 2026-04-13: Ticket created.
