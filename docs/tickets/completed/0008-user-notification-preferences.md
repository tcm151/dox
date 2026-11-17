# Ticket 0008: Add User Notification Preferences

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Let users control notification behavior from settings without requiring moderator/admin intervention.

## Requirements
- [x] In-app notification and UI preferences are persisted and loaded in settings.
- [x] In-app notification creation respects its preference toggle.
- [x] Email notification preferences are persisted and respected by eligible notification delivery.
- [x] The scheduled single-worker spool processes pending/retrying emails, applies daily and batch limits, and transitions delivery status using the configured retry count.
- [x] Eligible notification emails are queued only when allowed by user preferences; transactional account emails remain unaffected.
- [x] Admins can configure the spool daily limit, batch limit, and retry count in app settings, with the configured limits enforced by delivery.
- [x] Email notification defaults are documented and sensible for self-hosted communities.

## Tasks
- [x] Persist in-app notification and UI preference fields with defaults.
- [x] Build settings controls for in-app notification options.
- [x] Gate in-app notification creation on its preference.
- [x] Add the initial email spool table and scheduled worker.
- [x] Align the email spool attempt-count field across the canonical schema and migration.
- [x] Persist spool defaults in app settings and expose daily, batch, and retry controls in admin settings.
- [x] Read app-configured spool limits in the worker and enforce daily, batch, and retry limits.
- [x] Add sequential coverage for spool settings persistence and daily/batch limit selection.
- [x] Add email notification preference fields and defaults.
- [x] Build settings controls for email notification options.
- [x] Queue eligible email notifications and apply user preferences before delivery.
- [x] Document the opt-in default and test preference-gated notification queueing.
- [x] Add tests for successful delivery, retrying failures, and terminal-failure transitions.

## Notes
- In-app notifications default to enabled for new users and existing users migrated to user settings.
- Preference-gated notifications are written in a separate transaction from their originating actions.
- Email notification preference defaults to off for new users and existing users migrated to user settings.
- `NotificationManager` independently gates in-app creation and notification-email queueing on their respective preferences.
- Email spool defaults are stored in `appSettings.email.spool`: daily limit 100, batch limit 10, and maximum retries 3.
- Keep SMTP credentials in environment configuration, not app settings. Account confirmation and password-reset emails are transactional and should not be disabled by notification preferences.
- The worker is scheduled every 10 minutes and currently assumes one worker; multi-worker claiming/leases are deferred.
- The thread-reply integration test verifies the email preference default and independent in-app/email queueing behavior.
- The email spool tests cover successful delivery, retry scheduling, and terminal failure after the configured retry count. Live SMTP delivery is not exercised by the integration suite; [0130](../0130-verify-smtp-and-first-upload-onboarding.md) tracks real confirmation/reset/notification delivery and first-upload onboarding.
- `tests/utils/test-database-query.ts` provides configurable query handlers and captures SQL and bindings for reusable tests.

## Relevant Files
- app/pages/settings/preferences.vue
- app/pages/admin/settings.vue
- app/utils/settings.ts
- app/utils/userSettings.ts
- server/api/settings/[id]/index.ts
- server/api/profile/settings/index.ts
- server/api/profile/settings/update.ts
- server/api/profile/notifications/index.ts
- server/utils/repos/UserSettingsManager.ts
- server/utils/SettingsManager.ts
- server/utils/EmailSpool.ts
- server/utils/email.ts
- server/plugins/01.startup.server.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.2.surql
- server/assets/templates/notification.html
- tests/sequential/05-email-spool.server.test.ts
- tests/sequential/07-notifications.server.test.ts
- tests/utils/test-database-query.ts

## Progress Log
- 2026-11-17: Linked remaining live SMTP verification to Ticket 0130 without reopening the completed preference/spool scope or claiming new runtime evidence.
- 2026-11-09: Added coverage for successful sends, retry scheduling, and terminal failure, and extracted a reusable `DatabaseQuery` test stub beside the shared test setup. `yarn typecheck` passed; `yarn test tests/parallel/reports.test.ts` passed (22/22). The full `yarn test` run reported failures in parallel report, moderation, search, and thread tests (74/81 passed); live SMTP delivery remains unverified.
- 2026-11-09: Added email notification preferences (default off), settings controls and validation, and preference-gated notification email queueing. The thread-reply integration test covers the enabled/disabled cases independently of in-app notifications. `yarn typecheck` and `yarn test` pass (78/78). Retry/failure transition tests and live SMTP verification remain.
- 2026-11-09: Added app-configurable spool defaults and admin controls, injected the settings manager into the scheduled worker, enforced daily/batch/retry limits, and added spool settings tests. The schema and migration now agree on the attempt-count field; `yarn typecheck` and `yarn test` pass (77/77). Notification preference fields and queue integration remain.
- 2026-11-09: Added the initial email spool table and scheduled worker with scheduled/retrying selection and sent/retry/failed status transitions.
- 2026-10-27: Persisted and tested in-app preferences; email preference support and default documentation remain. Notification writes use separate transactions by design.
- 2026-04-13: Ticket created.
