# Ticket 0110: Limit Confirmation Email Resends

## Status
- State: Planned
- Priority: High
- Next: Define resend cooldowns and budgets for the account, recipient, and client address.

## Goal
Prevent confirmation-email bombing, SMTP quota abuse, and unnecessary confirmation-record growth. Apply controls to the actual sending operation rather than only token redemption.

## Requirements
- [ ] The confirmation-send route has documented account, recipient, and trusted-client-address limits.
- [ ] Requests within the resend cooldown, including concurrent requests, cannot create and send an unlimited number of confirmations.
- [ ] Already-confirmed accounts cannot repeatedly trigger unnecessary confirmation emails.
- [ ] Rejected requests create neither a new confirmation nor an outbound email, and return a clear retry response.
- [ ] Sending failures remain visible and leave resend and token state consistent with the documented retry policy.
- [ ] Tests cover the send route, cooldown expiry, concurrency, already-confirmed accounts, trusted-proxy identity, and a delivery failure without sending real email.

## Tasks
- [ ] Add route coverage and server-owned resend controls at the confirmation-send boundary.
- [ ] Enforce account and recipient cooldowns consistently with confirmation-record creation.
- [ ] Define whether resending replaces or reuses an outstanding confirmation.
- [ ] Add isolated rate-limit and mocked-delivery regression tests.
- [ ] Update the API and anti-spam documentation with limits and retry behavior.

## Notes
- Static review found protection for /api/profile/confirm but not /api/profile/confirm/send, which directly sends mail and creates a record for each authenticated request.
- Registration supplies a session before mailbox verification, so authentication alone does not prevent an attacker from targeting an unregistered recipient address.
- Notification-spool limits do not protect the direct confirmation-mail path.
- This is a source-based medium-severity security finding, prioritized High because it exposes an operator's email service to public abuse. Delivery impact requires configured SMTP; runtime behavior was not verified.
- Related work: [0053](completed/0053-trusted-proxy-rate-limit-client-addresses.md), [0064](completed/0064-anti-spam-defaults.md), and independent token validation in [0109](0109-validate-email-confirmation-token-records.md).

## Relevant Files
- server/api/profile/confirm/send.ts
- server/utils/RateLimiter.ts
- server/middleware/protection.ts
- server/utils/email.ts
- tests/sequential/04-rate-limits.server.test.ts
- tests/parallel/account.server.test.ts
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the public-launch source review. No executable validation was performed.
