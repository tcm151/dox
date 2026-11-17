# Ticket 0109: Validate Email Confirmation Token Records

## Status
- State: Planned
- Priority: High
- Next: Add a regression case that submits a session ID as an email-confirmation ID.

## Goal
Grant the confirmed trait only after redeeming a genuine, unexpired, unused email-confirmation record. Reject record-type substitution without changing account or session state.

## Requirements
- [ ] Confirmation accepts only IDs from the accountConfirmation table.
- [ ] Missing, malformed, wrong-table, expired, used, or accountless confirmation records cannot grant the confirmed trait.
- [ ] A valid confirmation grants the trait to its linked account's user and consumes the confirmation atomically.
- [ ] Repeated or concurrent redemption cannot produce inconsistent confirmation state.
- [ ] Regression tests prove that a newly issued session cannot be used to bypass mailbox verification and unlock confirmed-only features.

## Tasks
- [ ] Validate the confirmation ID's record type before querying it.
- [ ] Explicitly check record existence, account linkage, unused state, and expiry.
- [ ] Keep confirmation consumption and the user update in one transaction.
- [ ] Add valid-token, wrong-table, missing-record, expiry, replay, and concurrency cases.
- [ ] Update the confirmation API contract and security-relevant test inventory.

## Notes
- Static review found that the handler binds an arbitrary record ID and follows its account.user relationship. A session has that relationship without the confirmation-specific expired and used fields.
- The reported impact is bypassing mailbox ownership verification, not administrator access or another account's takeover.
- This is a source-based high-severity security finding; database execution and the exploit were not runtime-verified.
- Related baseline coverage is tracked by completed [0022](completed/0022-contract-tests-high-risk-routes.md). Resend abuse is separate under [0110](0110-limit-confirmation-email-resends.md).

## Relevant Files
- server/api/profile/confirm/index.ts
- server/assets/schema.surql
- server/api/image/upload.ts
- tests/parallel/account.server.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. No executable validation was performed.
