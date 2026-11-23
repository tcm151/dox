# Ticket 0130: Verify SMTP And First-Upload Onboarding

## Status
- State: In Progress
- Priority: Medium
- Next: Configure an isolated candidate deployment with an approved test recipient and authorized SMTP profile.

## Dependencies
- [0140](0140-restore-password-reset-flow.md): End-to-end password recovery requires the emailed reset link to open and work for a signed-out user.

## Goal
Verify the real operator/user journey from configured outbound mail to account confirmation, password recovery, and a first image publication. Complement existing API and spool tests with evidence that the supported deployment can deliver usable messages.

## Requirements
- [ ] An ordinary owned test account receives a real confirmation message, follows its correct public-origin link, and obtains confirmed status.
- [ ] The login password-reset flow delivers a usable message for the intended identifier after the login form closes; reset completion and session invalidation retain their documented behavior.
- [ ] An eligible opted-in notification is delivered through the scheduled spool, while opted-out users receive no notification email and transactional mail remains independent of that preference.
- [ ] An unconfirmed account is denied the confirmed-only upload action and the confirmed account can complete an allowed image upload/publication within configured media/token limits.
- [ ] Missing/invalid SMTP configuration and a controlled delivery failure produce explicit operational evidence without false success claims or exposing credentials/tokens.
- [ ] Results identify the candidate version, deployment mode, redacted SMTP/provider setup, public-origin configuration, queue timing, and remaining limitations.
- [ ] Routine automated tests remain deterministic and do not send mail to real users; live delivery uses only approved recipients and owned content.

## Tasks
- [x] Review existing account, media, and email-spool coverage before defining the live checklist.
- [ ] Validate transactional messages and link origins behind the intended reverse proxy/TLS setup.
- [ ] Exercise opted-in scheduled delivery and controlled failures without bypassing the worker's normal limits.
- [ ] Complete the confirmed-account image journey and clean up owned test content.
- [ ] Fix confirmed gaps in focused changes or link blocking work, then document operator SMTP troubleshooting and the actual results.

## Notes
- Completed Ticket 0008 explicitly leaves live SMTP unverified. Simulated successful sends do not establish provider delivery or usable public links.
- Automated account and email-spool tests cover confirmation-send failure, concurrency limits, retry state, and terminal delivery failure using isolated test fixtures; they do not prove real provider delivery.
- Confirmation security and resend limits remain under Tickets 0109 and 0110; media invariants remain under Ticket 0108.
- Coordinate the separate cleared-username password-reset regression with Ticket 0123, rather than duplicating its event-bus refactor.
- An unpublished candidate can be tested before Ticket 0127. Do not require public publication to begin validation or treat unverified email-dependent workflows as pilot-ready.
- Live delivery and deployment access require an execution-enabled environment and explicit authorization; this ticket does not authorize using other users' accounts or mailboxes.

## Relevant Files
- server/utils/email.ts
- server/utils/EmailSpool.ts
- server/api/profile/confirm/
- server/api/profile/password/
- server/api/image/upload.ts
- app/components/system/Login.client.vue
- tests/sequential/05-email-spool.server.test.ts
- tests/parallel/account.browser.test.ts
- docs/Quickstart.md

## Progress Log
- 2026-11-23: Recorded signed-out password reset as a completion prerequisite. SMTP setup and other onboarding checks can proceed in parallel.
- 2026-11-18: Production inspection confirmed version `2026.6.3` at the published tag/commit and app/database readiness. It did not inspect SMTP configuration or exercise mail delivery or uploads; deployment mode and provider profile remain unknown.
- 2026-11-18: Reviewed the account and spool tests and reran `yarn.cmd test` (248/248 passed). These checks cover simulated SMTP failure and spool transitions only; live provider delivery, approved recipient mailbox, and confirmed-account onboarding remain unverified.
- 2026-11-17: Ticket created. SMTP, account actions, uploads, and publication were not executed.
