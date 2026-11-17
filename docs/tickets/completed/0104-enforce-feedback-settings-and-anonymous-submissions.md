# Ticket 0104: Enforce Feedback Settings and Anonymous Submissions

## Status
- State: Completed
- Priority: Medium
- Next: None

## Dependencies
- [0100](0100-strict-appsettings-schema.md): The AppSettings feedback fields and validator must agree before the feedback workflow relies on them.

## Goal
Honor the feedback controls at the submission API and support anonymous submissions when enabled, as promised by the admin setting.

## Requirements
- [x] The submit API rejects both authenticated and anonymous submissions when feedback is disabled.
- [x] Authenticated users can submit feedback when enabled; anonymous users can submit only when `allowAnonymous` is enabled.
- [x] Feedback records and admin views handle a missing author without misattribution or errors.
- [x] Anonymous submissions are rate-limited using the resolved client address and cannot trust forwarded headers from untrusted peers.
- [x] Tests cover enabled/disabled states, both identity modes, rate limits, and existing authenticated behavior.

## Tasks
- [x] Enforce `misc.feedback.enabled` and `allowAnonymous` in the submission API.
- [x] Make feedback authors optional in the shared type, schema, and a replay-safe migration; update admin display for anonymous records.
- [x] Add appropriate rate limiting for anonymous submissions.
- [x] Add focused API and settings tests for authenticated, anonymous, and disabled cases.

## Notes
- The AppSettings fields must be booleans; Ticket 0100 owns that contract correction.
- Anonymous feedback records omit `user`; existing author references are preserved.
- Include the schema change in the unreleased `2026.6.3` migration.
- Feedback submissions are limited to five per minute per resolved client IP.

## Relevant Files
- app/components/system/Feedback.client.vue
- app/pages/contact.vue
- app/pages/admin/feedback.vue
- app/pages/admin/settings.vue
- server/api/feedback/submit.ts
- server/assets/schema.surql
- server/assets/migrations/
- server/middleware/protection.ts
- server/utils/RateLimiter.ts
- server/utils/clientAddress.ts
- shared/types/index.ts
- tests/parallel/feedback.server.test.ts
- tests/sequential/12-feedback-settings.server.test.ts

## Progress Log
- 2026-11-17: Completed settings enforcement, anonymous submissions, author-safe admin display, and rate limiting. `yarn test --server` passed (182/182), `yarn typecheck` passed, and the `2026.6.2` to `2026.6.3` migration/replay probe preserved existing authors and allowed authorless records.
- 2026-11-17: Confirmed anonymous records omit `user` and the schema change joins unreleased migration `2026.6.3`; began implementation.
- 2026-11-13: Ticket created.