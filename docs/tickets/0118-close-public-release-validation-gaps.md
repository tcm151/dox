# Ticket 0118: Close Public Release Validation Gaps

## Status
- State: In Progress
- Priority: Medium
- Next: Arrange an independent operator to complete the packaged Linux installation and record elapsed time and blockers.

## Dependencies
- [0108](completed/0108-enforce-media-category-and-cleanup-invariants.md): Final candidate evidence must include the corrected media lifecycle.
- [0109](completed/0109-validate-email-confirmation-token-records.md): Final candidate evidence must include genuine confirmation-token enforcement.
- [0110](completed/0110-limit-confirmation-email-resends.md): Final candidate evidence must include confirmation-send abuse protection.
- [0111](completed/0111-apply-personal-filters-to-dedicated-feeds.md): Validate the supported dedicated feeds after their personal-filter correction.
- [0112](completed/0112-bound-discovery-and-inbox-queries.md): Validate the final bounded public list/inbox contracts.
- [0113](completed/0113-isolate-account-preference-request-state.md): Validate the candidate after account-preference identity isolation is fixed.

## Goal
Replace deferred or intermittent release-critical validation with reproducible evidence for the intended public release. Cover media failure handling and the clean Linux deployment path without expanding optional product features.

## Requirements
- [ ] The intended release candidate passes the documented CI checks and standard full suite, with exact commands and results recorded.
- [x] Previously recorded concurrency, Submit visibility, pin activation, and search scroll-restoration failures are reproduced and resolved or explicitly diagnosed; rerunning until green does not establish a fix.
- [x] Media cleanup coverage includes filesystem failure, database rollback, missing files, retry, shared references, refund recipient, and repeated or concurrent deletion without duplicate refunds.
- [x] Ownership/refund acceptance includes cross-user attachment requests, shared images, administrator deletion, and duplicate attachment IDs; existing successful cases are reused rather than duplicated.
- [x] Deferred referral acceptance includes replay, self-claim, multiple claims, retries, and concurrent requests with no duplicate reward.
- [x] A packaged Linux-native release is installed in the user-selected production-style WSL Ubuntu 24.04 environment and verified for readiness, service restart, persistent configuration/data, and the documented reverse-proxy deployment path.
- [ ] An operator other than the guide's author completes packaged installation using only the published instructions; elapsed time and blockers are recorded, and any required assistance leads to corrected documentation and an independent unassisted recheck.
- [x] A previous supported release is upgraded to the candidate with existing content, accounts, media, and shared configuration retained; readiness, restart behavior, migration results, and the documented recovery path are verified.
- [x] Backup and restore evidence covers the documented database and separately retained media/configuration recovery procedure, using an isolated target rather than production data.
- [x] Actual results, remaining limitations, and any newly deferred work are linked from the relevant release and ticket documentation.

## Tasks
- [x] Inventory existing tests before adding missing failure/retry/concurrency cases from Tickets 0001, 0019, and 0052.
- [x] Diagnose the failures recorded by Tickets 0015, 0083, and 0102 using isolated test data and the standard runner; the historical failures did not reproduce.
- [x] Add missing focused media consistency tests and retain the existing successful-path coverage.
- [x] Fill any missing referral replay/concurrency cases using the established shared test conventions.
- [x] Run the documented typechecks, production build, and full test suite in a permitted environment.
- [ ] Identify the unnamed test failure reported by one combined validation run before treating candidate checks as fully diagnosed.
- [x] Perform the privileged WSL package/service, reverse-proxy, upgrade, and isolated recovery rehearsals; record the selected environment's limitations.
- [x] Stage and smoke-test the Linux package in isolated WSL no-service mode, recording artifact identity and limitations.
- [ ] Observe an independent operator following the guide, correct undocumented prerequisites or manual interventions, and repeat the check without assistance after documentation fixes.
- [x] Rehearse a previous-release upgrade on an isolated copy with a complete verified backup, then verify persistent data and the documented recovery procedure.
- [x] Run an unprivileged no-service previous-release upgrade smoke test to check migrated data/account/media persistence; retain full backup/service recovery acceptance as open.
- [x] Record exact evidence and link unresolved follow-ups without overstating runtime coverage.

## Notes
- The ticket logs contain historical failures and deferred tests; the source-only review did not reproduce them or establish that they still fail.
- [0015](completed/0015-search-filters-url-sync.md) records intermittent browser and feed-test failures, [0083](completed/0083-audit-existing-messaging-workflows.md) records a parallel engagement conflict, and [0102](completed/0102-enforce-feed-availability-settings.md) records full-suite failures on 2026-11-17.
- Media tests cover successful upload/refund, attached-image rejection, filesystem failure/backoff, missing-file cleanup, retry recovery, database rollback, cross-user private attachment rejection, uploader refunds under concurrent administrator deletion, shared references, and duplicate attachment IDs.
- Referral coverage exercises self-claim rejection, first claim/reward, same and alternate recipient retries, competing concurrent claims, exactly one reward, claim records, notifications, and cleanup.
- The historical failures recorded by [0015](completed/0015-search-filters-url-sync.md), [0083](completed/0083-audit-existing-messaging-workflows.md), and [0102](completed/0102-enforce-feed-availability-settings.md) did not reproduce in the latest full run; this is not a claim that their original causes were fixed.
- One combined validation run summarized the test phase as 31/32 without exposing the failing test or assertion. The immediate standard rerun passed 248/248; identify the earlier failure before treating the run history as fully diagnosed.
- A direct rerun of the full documented sequence on 2026-11-18 (`yarn.cmd typecheck:golar`, `yarn.cmd typecheck`, `yarn.cmd build`, `yarn.cmd test`) passed; the standard suite reported 248/248. The earlier 31/32 summary remains unidentifiable and is not considered fixed by rerunning.
- Linux package `forum-2026.6.3-linux-x64.tar.gz` was staged from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` in WSL Ubuntu 24.04 and verified with SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`. The source was the committed tree; uncommitted Windows test/documentation changes were not included.
- The isolated WSL no-service install and subsequent privileged systemd/reverse-proxy rehearsals used Ubuntu 24.04; `nginx -t` passed. This WSL distro was not fresh; the user selected it as the production-style Linux target. No independent operator run has occurred.
- The earlier no-backup upgrade smoke test used 2026.6.2 rebuilt from tag `v2026.6.2` at commit `08e925a87aa65aed415403fa13df16490808462c` (SHA-256 `e527681b5ef1a656b9579c7b8c0e68ea182b1a36d3b5ee1a9d240047ba689846`) and the 2026.6.3 candidate. Its migration and persistence results are retained; the backup-first systemd upgrade and recovery evidence is recorded below.
- Backup-first rehearsal details and remaining limitations are in the newest Progress Log entry. Temporary services and proxy were removed; the original forum service remained active. Isolated test data and backups were retained in WSL for inspection.
- [0029](completed/0029-production-quickstart-doc.md) leaves clean native Linux installation as a follow-up. [0024](completed/0024-backup-restore-runbook.md) already documents an isolated WSL database restore, which is not the same validation target.
- Keep independent installation and upgrade/recovery acceptance in this ticket instead of opening a duplicate deployment-validation ticket. Compare observed setup time with the roadmap's 30-minute target without claiming success when assistance was required.
- [0127](0127-publish-a-verifiable-pilot-release.md) owns public publication and independent download verification. Candidate installation/upgrade checks can run on a staged archive before publication; record the exact source identity and digest so evidence remains tied to the delivered artifact.
- The WSL upgrade and recovery rehearsals used isolated data, not the existing production deployment. Ticket 0127 tracks applying the published package after a fresh backup and explicit approval.
- The WSL upgrade and recovery rehearsals used isolated data, not production. The published `v2026.6.3` build is now installed at `forum.tcmdev.ca`; Developer Info matches the published commit and health reports app/database ready. The remote database backup was skipped at the user's direction. Archive provenance and persisted-data comparison remain under [0127](0127-publish-a-verifiable-pilot-release.md); the production-owner installation does not satisfy independent-operator acceptance.
- Demo-specific redirects/hydration, live SMTP onboarding, and hosting measurements are separate under [0128](0128-verify-demo-navigation-and-hydration.md), [0130](0130-verify-smtp-and-first-upload-onboarding.md), and [0131](0131-document-pilot-hosting-requirements-and-limits.md).
- Documented CI commands are `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`.
- This ticket does not authorize running tools in a source-inspection-only workspace. Execution requires an environment where those checks are permitted.
- Preliminary reproduction and test preparation can proceed while prerequisites are open; final candidate acceptance must include their fixes. This ticket does not replace their focused regression requirements.
- Deferred referral tests from [0019](completed/0019-referral-redemption-hardening.md) now have an explicit acceptance owner here; [0056](completed/0056-basic-api-test-coverage-and-conventions.md) already established their prerequisite conventions.

## Relevant Files
- .github/workflows/pipeline.yml
- .github/workflows/release.yml
- docs/Contributing.md
- docs/Quickstart.md
- docs/Backups.md
- scripts/installer.sh
- scripts/stage-release.mjs
- tests/parallel/media.server.test.ts
- tests/parallel/engagement.server.test.ts
- tests/parallel/search.browser.test.ts
- tests/parallel/feed.browser.test.ts

## Progress Log
- 2026-11-18: Production Info reports `v2026.6.3` at commit `20c02b9b5b83645ed7165838ca29dd6e3272b77c`; health reports app/database ready. Host/runtime/database details and elapsed time remain unknown. The remote DB backup was skipped at the user's direction; independent-operator acceptance remains open.
- 2026-11-18: Reran the standard `yarn.cmd test` suite: sequential phase 18/18, parallel phase 32/32, 248/248 total. The recorded historical failures did not reproduce; this does not establish their original causes or fix the unidentified earlier 31/32 result. Confirmed the media and referral requirement coverage against their isolated tests.
- 2026-11-18: Completed the backup-first WSL upgrade/recovery rehearsal using isolated systemd services and dedicated test account/content. The pre-upgrade database archive passed checksum and gzip-integrity verification. Installed the 2026.6.3 candidate from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (artifact SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) over the same isolated service and data. The journal recorded migration from 2026.6.2 to 2026.6.3; health reported ready, and login, session, post, and media persisted. An explicit systemd restart briefly refused the first immediate health connection; retry returned ready and persistence checks passed again (image HTTP 200, 363591 bytes). Restored the pre-upgrade archive with the 2026.6.2 release into a separate isolated target, retaining configuration and media separately as documented; checksum, health, login, post, and media checks passed. Temporary services were removed; the original forum service remained active. WSL was not a fresh host, and no independent operator participated, so those limitations remain recorded.
- 2026-11-18: Ran an unprivileged WSL upgrade smoke test from tagged 2026.6.2 to 2026.6.3 using the same isolated `.env` and data directory. Migration completed; readiness, login, post, and uploaded image persisted. No pre-upgrade backup or system service was exercised, so full upgrade/recovery acceptance remains open.
- 2026-11-18: Staged and verified the Linux 2026.6.3 artifact from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`). Isolated WSL no-service install, readiness before/after process restart, and post-restart login passed. This is not clean-host or service acceptance; sudo-dependent service, proxy, backup/restore, independent operator, and upgrade checks remain open.
- 2026-11-18: Completed the transferred media and referral test coverage. `yarn.cmd test --file media.server.test.ts` passed 16/16; `yarn.cmd typecheck:golar`, `yarn.cmd typecheck`, and `yarn.cmd build` passed; the direct full validation sequence passed and `yarn.cmd test` reported 248/248. One preceding combined run reported 31/32 without diagnostic detail, so that failure remains open.
- 2026-11-17: Added final-candidate prerequisites and explicit transferred ownership/refund and referral validation. Preliminary investigations can proceed independently; no tests or release acceptance were performed.
- 2026-11-17: Added independent guide-following and previous-release upgrade/persistence acceptance from the marketing review and linked the separate publication, demo, SMTP, and hosting work. All validation remains open; no executable checks were run.
- 2026-11-17: Ticket created to track existing release-validation gaps. No builds, tests, app startup, or deployment validation were performed during the review.
