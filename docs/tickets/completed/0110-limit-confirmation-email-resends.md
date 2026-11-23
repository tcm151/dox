# Ticket 0110: Limit Confirmation Email Resends

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Prevent confirmation-email bombing, SMTP quota abuse, and unnecessary confirmation-record growth. Apply controls to the actual sending operation rather than only token redemption.

## Requirements
- [x] The confirmation-send route has documented account, recipient, and trusted-client-address limits.
- [x] Requests within the resend cooldown, including concurrent requests, cannot create and send an unlimited number of confirmations.
- [x] Already-confirmed accounts cannot repeatedly trigger unnecessary confirmation emails.
- [x] Rejected requests create neither a new confirmation nor an outbound email, and return a clear retry response.
- [x] Sending failures remain visible and leave resend and token state consistent with the documented retry policy.
- [x] Tests cover the send route, cooldown expiry, concurrency, already-confirmed accounts, trusted-proxy identity, and a delivery failure without sending real email.

## Tasks
- [x] Add route coverage and server-owned resend controls at the confirmation-send boundary.
- [x] Enforce account and recipient cooldowns consistently with confirmation-record creation.
- [x] Define whether resending replaces or reuses an outstanding confirmation.
- [x] Add isolated rate-limit and local-only delivery-failure regression tests.
- [x] Update the API and anti-spam documentation with limits and retry behavior.

## Notes
- Static review found protection for /api/profile/confirm but not /api/profile/confirm/send, which directly sends mail and creates a record for each authenticated request.
- Registration supplies a session before mailbox verification, so authentication alone does not prevent an attacker from targeting an unregistered recipient address.
- Notification-spool limits do not protect the direct confirmation-mail path.
- The original source-based finding was medium severity and prioritized High because it exposed an operator's email service to public abuse. Real provider delivery remains unverified.
- Related work: Tickets 0053 and 0064, and independent token validation in Ticket 0109.

## Relevant Files
- server/api/profile/confirm/send.ts
- server/utils/RateLimiter.ts
- server/middleware/protection.ts
- server/utils/email.ts
- scripts/test-server.mjs
- tests/sequential/04-rate-limits.server.test.ts
- tests/parallel/account.server.test.ts
- tests/parallel/link-preview.server.test.ts
- docs/API.md
- docs/Architecture.md

## Progress Log
- 2026-11-17: Implemented account, recipient, and trusted-client resend limits; pending confirmations are reused, confirmed accounts are rejected, and SMTP failure preserves token/cooldown state. `yarn typecheck`, `yarn test account.server.test.ts` (22/22), and `yarn test link-preview.server.test.ts` (38/38) passed. Full `yarn test` stopped at the unrelated 5-second timeout in `tests/sequential/10-feed-availability.server.test.ts`.
- 2026-11-17: Ticket created from the public-launch source review. No executable validation was performed.
