# Ticket 0104: Enforce Feedback Settings and Anonymous Submissions

## Status
- State: Planned
- Priority: Medium
- Next: Define the anonymous feedback record shape and migration behavior.

## Dependencies
- [0100](0100-strict-appsettings-schema.md): The AppSettings feedback fields and validator must agree before the feedback workflow relies on them.

## Goal
Honor the feedback controls at the submission API and support anonymous submissions when enabled, as promised by the admin setting.

## Requirements
- [ ] The submit API rejects both authenticated and anonymous submissions when feedback is disabled.
- [ ] Authenticated users can submit feedback when enabled; anonymous users can submit only when `allowAnonymous` is enabled.
- [ ] Feedback records and admin views handle a missing author without misattribution or errors.
- [ ] Anonymous submissions are rate-limited using the resolved client address and cannot trust forwarded headers from untrusted peers.
- [ ] Tests cover enabled/disabled states, both identity modes, rate limits, and existing authenticated behavior.

## Tasks
- [ ] Enforce `misc.feedback.enabled` and `allowAnonymous` in the submission API.
- [ ] Make feedback authors optional in the shared type, schema, and a replay-safe migration; update admin display for anonymous records.
- [ ] Add appropriate rate limiting for anonymous submissions.
- [ ] Add focused API and settings tests for authenticated, anonymous, and disabled cases.

## Notes
- The AppSettings fields must be booleans; Ticket 0100 owns that contract correction.
- The feedback table currently requires a user record, so anonymous support needs a separate data-shape migration.

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

## Progress Log
- 2026-11-13: Ticket created.