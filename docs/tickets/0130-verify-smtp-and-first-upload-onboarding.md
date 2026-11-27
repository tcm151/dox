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
- [ ] Verify and fix the Login popup reset-request identifier and the confirmation link's incoming-query handling before signing off on the live flows.
- [ ] Exercise opted-in scheduled delivery and controlled failures without bypassing the worker's normal limits.
- [ ] Complete the confirmed-account image journey and clean up owned test content.
- [ ] Fix confirmed gaps in focused changes or link blocking work, then document operator SMTP troubleshooting and the actual results.

## Notes
- Completed Ticket 0008 explicitly leaves live SMTP unverified. Simulated successful sends do not establish provider delivery or usable public links.
- Automated account and email-spool tests cover confirmation-send failure, concurrency limits, retry state, and terminal delivery failure using isolated test fixtures; they do not prove real provider delivery.
- Confirmation security and resend limits remain under Tickets 0109 and 0110; media invariants remain under Ticket 0108.
- The Login popup closes and clears `username` before the confirmation callback reads it for the reset request. Keep the functional regression here; Ticket 0123 is deferred and is not required for a focused fix.
- The confirmation sender still links to `/profile?confirmation=...`, but the profile middleware reads the previous route's `from.query`, not the incoming URL. The new `/profile/confirm` child is not the emailed destination and also reads `from.query`. Verify direct entry in the intended account state before claiming confirmation works.
- Pilot publication is complete in Ticket 0127. Live SMTP can also be validated on an unpublished candidate; the published release does not establish that email-dependent workflows are pilot-ready.
- The reset email template also renders a `{{reportLink}}` pointing at `/profile/reset-password?report=<id>`, but the reset page only reads the `id` query and shows the normal empty form for report links. Verify or scope the report path while validating live reset delivery.
- Live delivery and deployment access require an execution-enabled environment and explicit authorization; this ticket does not authorize using other users' accounts or mailboxes.

## Relevant Files
- server/utils/email.ts
- server/utils/EmailSpool.ts
- server/api/profile/confirm/
- server/api/profile/password/
- server/api/image/upload.ts
- app/components/system/Login.client.vue
- app/pages/profile.vue
- app/pages/profile/confirm.vue
- tests/sequential/05-email-spool.server.test.ts
- tests/sequential/21-account.browser.test.ts
- tests/parallel/account.server.test.ts
- docs/Quickstart.md

## Progress Log
- 2026-11-27: Source-traced the reset email template while fixing 0140: it emails both an `id` reset link and a `report` link the reset page never handles. The signed-out reset fix is implemented under 0140 but awaits a test run.
- 2026-11-27: Traced the Login popup and confirmation-link handoff in source. Neither direct confirmation nor actual message delivery was tested; Ticket 0140 still gates signed-out reset completion.
- 2026-11-23: Recorded signed-out password reset as a completion prerequisite. SMTP setup and other onboarding checks can proceed in parallel.
- 2026-11-18: Production inspection confirmed version `2026.6.3` at the published tag/commit and app/database readiness. It did not inspect SMTP configuration or exercise mail delivery or uploads; deployment mode and provider profile remain unknown.
- 2026-11-18: Reviewed the account and spool tests and reran `yarn.cmd test` (248/248 passed). These checks cover simulated SMTP failure and spool transitions only; live provider delivery, approved recipient mailbox, and confirmed-account onboarding remain unverified.
- 2026-11-17: Ticket created. SMTP, account actions, uploads, and publication were not executed.
