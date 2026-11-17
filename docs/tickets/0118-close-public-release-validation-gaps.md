# Ticket 0118: Close Public Release Validation Gaps

## Status
- State: Planned
- Priority: Medium
- Next: Reproduce the most recently recorded full-suite failures in an execution-enabled environment.

## Dependencies
- [0108](completed/0108-enforce-media-category-and-cleanup-invariants.md): Final candidate evidence must include the corrected media lifecycle.
- [0109](completed/0109-validate-email-confirmation-token-records.md): Final candidate evidence must include genuine confirmation-token enforcement.
- [0110](completed/0110-limit-confirmation-email-resends.md): Final candidate evidence must include confirmation-send abuse protection.
- [0111](completed/0111-apply-personal-filters-to-dedicated-feeds.md): Validate the supported dedicated feeds after their personal-filter correction.
- [0112](0112-bound-discovery-and-inbox-queries.md): Validate the final bounded public list/inbox contracts.
- [0113](0113-isolate-account-preference-request-state.md): Validate the candidate after account-preference identity isolation is fixed.

## Goal
Replace deferred or intermittent release-critical validation with reproducible evidence for the intended public release. Cover media failure handling and the clean Linux deployment path without expanding optional product features.

## Requirements
- [ ] The intended release candidate passes the documented CI checks and standard full suite, with exact commands and results recorded.
- [ ] Previously recorded concurrency, Submit visibility, pin activation, and search scroll-restoration failures are reproduced and resolved or explicitly diagnosed; rerunning until green does not establish a fix.
- [ ] Media cleanup coverage includes filesystem failure, database rollback, missing files, retry, shared references, refund recipient, and repeated or concurrent deletion without duplicate refunds.
- [ ] Ownership/refund acceptance includes cross-user attachment requests, shared images, administrator deletion, and duplicate attachment IDs; existing successful cases are reused rather than duplicated.
- [ ] Deferred referral acceptance includes replay, self-claim, multiple claims, retries, and concurrent requests with no duplicate reward.
- [ ] A packaged Linux-native release is installed on a clean supported Linux host and verified for readiness, service restart, persistent configuration/data, and the documented reverse-proxy deployment path.
- [ ] An operator other than the guide's author completes packaged installation using only the published instructions; elapsed time and blockers are recorded, and any required assistance leads to corrected documentation and an independent unassisted recheck.
- [ ] A previous supported release is upgraded to the candidate with existing content, accounts, media, and shared configuration retained; readiness, restart behavior, migration results, and the documented recovery path are verified.
- [ ] Backup and restore evidence covers the documented database and separately retained media/configuration recovery procedure, using an isolated target rather than production data.
- [ ] Actual results, remaining limitations, and any newly deferred work are linked from the relevant release and ticket documentation.

## Tasks
- [ ] Inventory existing tests before adding missing failure/retry/concurrency cases from Tickets 0001, 0019, and 0052.
- [ ] Diagnose the failures recorded by Tickets 0015, 0083, and 0102 using isolated test data and the standard runner.
- [ ] Add missing focused media consistency tests and retain the existing successful-path coverage.
- [ ] Fill any missing referral replay/concurrency cases using the established shared test conventions.
- [ ] Run the documented typechecks, production build, and full test suite in a permitted environment.
- [ ] Perform the clean Linux package/service rehearsal and isolated recovery exercise.
- [ ] Observe an independent operator following the guide, correct undocumented prerequisites or manual interventions, and repeat the check without assistance after documentation fixes.
- [ ] Rehearse a previous-release upgrade on an isolated copy with a complete verified backup, then verify persistent data and the documented recovery procedure.
- [ ] Record exact evidence and link unresolved follow-ups without overstating runtime coverage.

## Notes
- The ticket logs contain historical failures and deferred tests; the source-only review did not reproduce them or establish that they still fail.
- [0015](completed/0015-search-filters-url-sync.md) records intermittent browser and feed-test failures, [0083](completed/0083-audit-existing-messaging-workflows.md) records a parallel engagement conflict, and [0102](completed/0102-enforce-feed-availability-settings.md) records full-suite failures on 2026-11-17.
- Existing media tests cover successful upload/refund and referenced-image behavior; inspect them before filling the deferred cases in [0001](completed/0001-media-delete-atomicity.md) and [0052](completed/0052-image-attachment-ownership-and-refunds.md).
- [0029](completed/0029-production-quickstart-doc.md) leaves clean native Linux installation as a follow-up. [0024](completed/0024-backup-restore-runbook.md) already documents an isolated WSL database restore, which is not the same validation target.
- Keep independent installation and upgrade/recovery acceptance in this ticket instead of opening a duplicate deployment-validation ticket. Compare observed setup time with the roadmap's 30-minute target without claiming success when assistance was required.
- [0127](0127-publish-a-verifiable-pilot-release.md) owns public publication and independent download verification. Candidate installation/upgrade checks can run on a staged archive before publication; record the exact source identity and digest so evidence remains tied to the delivered artifact.
- Demo-specific redirects/hydration, live SMTP onboarding, and hosting measurements are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0130](0130-verify-smtp-and-first-upload-onboarding.md), and [0131](0131-document-pilot-hosting-requirements-and-limits.md).
- Documented CI commands are `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`.
- This ticket does not authorize running tools in a source-inspection-only workspace. Execution requires an environment where those checks are permitted.
- Preliminary reproduction and test preparation can proceed while prerequisites are open; final candidate acceptance must include their fixes. This ticket does not replace their focused regression requirements.
- Deferred referral tests from [0019](completed/0019-referral-redemption-hardening.md) now have an explicit acceptance owner here; [0056](completed/0056-basic-api-test-coverage-and-conventions.md) already established their prerequisite conventions.

## Relevant Files
- .github/workflows/ci.yml
- docs/ContributionGuide.md
- docs/Quickstart.md
- docs/Backups.md
- scripts/installer.sh
- scripts/stage-release.mjs
- tests/parallel/media.server.test.ts
- tests/parallel/engagement.server.test.ts
- tests/parallel/search.browser.test.ts
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-17: Added final-candidate prerequisites and explicit transferred ownership/refund and referral validation. Preliminary investigations can proceed independently; no tests or release acceptance were performed.
- 2026-11-17: Added independent guide-following and previous-release upgrade/persistence acceptance from the marketing review and linked the separate publication, demo, SMTP, and hosting work. All validation remains open; no executable checks were run.
- 2026-11-17: Ticket created to track existing release-validation gaps. No builds, tests, app startup, or deployment validation were performed during the review.
