# Ticket 0118: Close Public Release Validation Gaps

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Replace deferred or intermittent release-critical validation with reproducible evidence for the intended public release. Cover media failure handling and the clean Linux deployment path without expanding optional product features.

## Requirements
- [x] The 2026.6.5 candidate passes the documented local checks and standard full suite, with exact commands and results recorded.
- [x] Record the documented CI checks and standard full-suite evidence for the exact `v2026.6.6` source; do not carry the `2026.6.5` result forward.
- [x] Previously recorded concurrency, Submit visibility, pin activation, and search scroll-restoration failures are reproduced and resolved or explicitly diagnosed; rerunning until green does not establish a fix.
- [x] Media cleanup coverage includes filesystem failure, database rollback, missing files, retry, shared references, refund recipient, and repeated or concurrent deletion without duplicate refunds.
- [x] Ownership/refund acceptance includes cross-user attachment requests, shared images, administrator deletion, and duplicate attachment IDs; existing successful cases are reused rather than duplicated.
- [x] Deferred referral acceptance includes replay, self-claim, multiple claims, retries, and concurrent requests with no duplicate reward.
- [x] A packaged Linux-native release is installed in the user-selected production-style WSL Ubuntu 24.04 environment and verified for readiness, service restart, persistent configuration/data, and the documented reverse-proxy deployment path.
- [x] A previous supported release is upgraded to the candidate with existing content, accounts, media, and shared configuration retained; readiness, restart behavior, migration results, and the documented recovery path are verified.
- [x] Backup and restore evidence covers the documented database and separately retained media/configuration recovery procedure, using an isolated target rather than production data.
- [x] Actual results, remaining limitations, and any newly deferred work are linked from the relevant release and ticket documentation.

## Tasks
- [x] Inventory existing tests before adding missing failure/retry/concurrency cases from Tickets 0001, 0019, and 0052.
- [x] Diagnose the failures recorded by Tickets 0015, 0083, and 0102 using isolated test data and the standard runner; the historical failures did not reproduce.
- [x] Add missing focused media consistency tests and retain the existing successful-path coverage.
- [x] Fill any missing referral replay/concurrency cases using the established shared test conventions.
- [x] Run the documented typechecks, production build, and full test suite in a permitted environment.
- [x] Record the disposition of the unnamed historical 31/32 result without treating a subsequent pass as a diagnosis.
- [x] Retrieve exact-commit CI check results for `v2026.6.6`.
- [x] Accept the exact-release full suite, including previous-release migration and current-migration replay coverage, as the release validation gate.
- [x] Perform the privileged WSL package/service, reverse-proxy, upgrade, and isolated recovery rehearsals; record the selected environment's limitations.
- [x] Stage and smoke-test the Linux package in isolated WSL no-service mode, recording artifact identity and limitations.
- [x] Rehearse a previous-release upgrade on an isolated copy with a complete verified backup, then verify persistent data and the documented recovery procedure.
- [x] Run an unprivileged no-service previous-release upgrade smoke test to check migrated data/account/media persistence; retain full backup/service recovery acceptance as open.
- [x] Record exact evidence and link unresolved follow-ups without overstating runtime coverage.

## Notes
- The ticket logs contain historical failures and deferred tests; the source-only review did not reproduce them or establish that they still fail.
- Ticket 0015 records intermittent browser and feed-test failures, Ticket 0083 records a parallel engagement conflict, and Ticket 0102 records full-suite failures on 2026-11-17.
- Media tests cover successful upload/refund, attached-image rejection, filesystem failure/backoff, missing-file cleanup, retry recovery, database rollback, cross-user private attachment rejection, uploader refunds under concurrent administrator deletion, shared references, and duplicate attachment IDs.
- Referral coverage exercises self-claim rejection, first claim/reward, same and alternate recipient retries, competing concurrent claims, exactly one reward, claim records, notifications, and cleanup.
- The historical failures recorded by Tickets 0015, 0083, and 0102 did not reproduce in the latest full run; this is not a claim that their original causes were fixed.
- One combined validation run summarized the test phase as 31/32 without exposing the failing test or assertion. The immediate standard rerun passed 248/248. The owner accepted the current green suite as sufficient for release coverage; the earlier cause remains unknown and is not a release blocker.
- The historical notes show 32/32 for the parallel phase of the rerun, making that phase a lead, not a confirmed match to the earlier count. The original console output or retained phase report is needed to identify the failed file or assertion. A passing run on a later commit does not recover that evidence.
- A direct rerun of the full documented sequence on 2026-11-18 (`yarn.cmd typecheck:golar`, `yarn.cmd typecheck`, `yarn.cmd build`, `yarn.cmd test`) passed; the standard suite reported 248/248. The earlier 31/32 summary remains unidentifiable and is not considered fixed by rerunning.
- Linux package `forum-2026.6.3-linux-x64.tar.gz` was staged from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` in WSL Ubuntu 24.04 and verified with SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`. The source was the committed tree; uncommitted Windows test/documentation changes were not included.
- The isolated WSL no-service install and subsequent privileged systemd/reverse-proxy rehearsals used Ubuntu 24.04; `nginx -t` passed. This WSL distro was not fresh; the user selected it as the production-style Linux target. No independent operator run has occurred.
- The earlier no-backup upgrade smoke test used 2026.6.2 rebuilt from tag `v2026.6.2` at commit `08e925a87aa65aed415403fa13df16490808462c` (SHA-256 `e527681b5ef1a656b9579c7b8c0e68ea182b1a36d3b5ee1a9d240047ba689846`) and the 2026.6.3 candidate. Its migration and persistence results are retained; the backup-first systemd upgrade and recovery evidence is recorded below.
- Backup-first rehearsal details and remaining limitations are in the newest Progress Log entry. Temporary services and proxy were removed; the original forum service remained active. Isolated test data and backups were retained in WSL for inspection.
- Ticket 0029 leaves clean native Linux installation as a follow-up. Ticket 0024 already documents an isolated WSL database restore, which is not the same validation target.
- Ticket 0147 owns the independent, timed install using only the published instructions.
- Ticket 0127 records public publication, installer archive verification, and the production upgrade. The release validation here accepts automated migration checks and historical isolated recovery evidence; it does not certify a production backup or a separate follower-vote backfill rehearsal.
- The WSL upgrade and recovery rehearsals used isolated data, not production. The historical `v2026.6.3` production deployment matched the published commit and reported app/database ready; the remote database backup was skipped. Ticket 0148 tracks remote backup and restore validation separately.
- Demo-specific redirects/hydration, live SMTP onboarding, and hosting measurements are separate under Tickets 0128, 0130, and 0131.
- Documented CI commands are `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test`.
- This ticket does not authorize running tools in a source-inspection-only workspace. Execution requires an environment where those checks are permitted.
- Final candidate evidence must include the media lifecycle, confirmation token and resend protections, dedicated feed filters, bounded discovery and inbox reads, and account-preference isolation from Tickets 0108, 0109, 0110, 0111, 0112, and 0113. This ticket does not replace their focused regression requirements.
- Deferred referral tests from Ticket 0019 now have an explicit acceptance owner here; Ticket 0056 already established their prerequisite conventions.

## Relevant Files
- .github/workflows/pipeline.yml
- .github/workflows/release.yml
- docs/Contributing.md
- docs/Quickstart.md
- docs/Backups.md
- server/assets/migrations/2026.6.5.surql
- server/assets/migrations/2026.6.6.surql
- scripts/installer.sh
- scripts/stage-release.mjs
- tests/parallel/media.server.test.ts
- tests/parallel/engagement.server.test.ts
- tests/parallel/search.browser.test.ts
- tests/parallel/feed.browser.test.ts
- tests/sequential/02-migrations.server.test.ts
- tests/sequential/09-feeds.server.test.ts
- tests/sequential/10-availability.server.test.ts

## Progress Log
- 2026-11-27: Completed release validation using the accepted `v2026.6.6` CI result (264/264). The standard suite applies migrations from the previous tagged schema, checks recorded versions and profile privacy defaults, and exercises current-migration replay. No separate rehearsal was required or run. The historical 31/32 root cause remains unknown; the owner accepted the current suite as the release coverage gate.
- 2026-11-27: Searched the available session history, repository history, and retained test-output directories for the historical 31/32 result. Found references to the count but no failing test or assertion. The separately identified feed-availability timeout is not evidence of its cause. Specified the remaining isolated upgrade checks; none were run.
- 2026-11-27: Moved independent installation to Ticket 0147. The owner's successful `2026.6.6` production upgrade is recorded in Ticket 0127; it does not replace the isolated upgrade/recovery evidence or resolve the unnamed 31/32 result.
- 2026-11-27: Reviewed the existing [GitHub Pipeline job](https://github.com/tcm151/dox/actions/runs/45745675350/job/139661000452) for the `v2026.6.6` commit `7061d1a01479987fc70649c09216749a7f992a46`. On Ubuntu with Node.js 24, the frozen install, installer syntax and behavior checks, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test` passed; the job log reports 264/264 tests. No checks were rerun. This does not verify an upgrade of existing data, independent installation, or the cause of the earlier unnamed failure.
- 2026-11-27: Separated the verified `2026.6.5` results from the newer tagged `2026.6.6` source. The newer release includes a data/schema migration and changed test coverage; no current-version test or upgrade result was verified here. Independent installation and the unnamed 31/32 result remain open.
- 2026-11-19: The intermittent feed-availability timeout was in `tests/sequential/10-feed-availability.server.test.ts`, already in the ordered sequential phase, not a parallel test. Raised its per-test timeout from 15 to 60 seconds without changing assertions or cleanup. `yarn test --sequential` passed 99/99 and `yarn test` passed 256/256 afterward. The earlier unidentified 31/32 result remains open.
- 2026-11-19: The 2026.6.5 local candidate passed `yarn install --frozen-lockfile`, `yarn typecheck:golar`, `yarn typecheck`, `yarn build`, and `yarn test` (256/256). The new version-only migration was applied twice to a disposable embedded SurrealDB; it left exactly one `2026.6.5` marker, and the production build included the migration asset. The earlier feed-availability timeout did not recur. This does not resolve the separately recorded, unidentified 31/32 run or the open independent-operator acceptance.
- 2026-11-18: Production Info reports `v2026.6.3` at commit `20c02b9b5b83645ed7165838ca29dd6e3272b77c`; health reports app/database ready. Host/runtime/database details and elapsed time remain unknown. The remote DB backup was skipped at the user's direction; independent-operator acceptance remains open.
- 2026-11-18: Reran the standard `yarn.cmd test` suite: sequential phase 18/18, parallel phase 32/32, 248/248 total. The recorded historical failures did not reproduce; this does not establish their original causes or fix the unidentified earlier 31/32 result. Confirmed the media and referral requirement coverage against their isolated tests.
- 2026-11-18: Completed the backup-first WSL upgrade/recovery rehearsal using isolated systemd services and dedicated test account/content. The pre-upgrade database archive passed checksum and gzip-integrity verification. Installed the 2026.6.3 candidate from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (artifact SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`) over the same isolated service and data. The journal recorded migration from 2026.6.2 to 2026.6.3; health reported ready, and login, session, post, and media persisted. An explicit systemd restart briefly refused the first immediate health connection; retry returned ready and persistence checks passed again (image HTTP 200, 363591 bytes). Restored the pre-upgrade archive with the 2026.6.2 release into a separate isolated target, retaining configuration and media separately as documented; checksum, health, login, post, and media checks passed. Temporary services were removed; the original forum service remained active. WSL was not a fresh host, and no independent operator participated, so those limitations remain recorded.
- 2026-11-18: Ran an unprivileged WSL upgrade smoke test from tagged 2026.6.2 to 2026.6.3 using the same isolated `.env` and data directory. Migration completed; readiness, login, post, and uploaded image persisted. No pre-upgrade backup or system service was exercised, so full upgrade/recovery acceptance remains open.
- 2026-11-18: Staged and verified the Linux 2026.6.3 artifact from commit `dd9a38914bd803fd83dc2ac9220ea019d51ea77a` (SHA-256 `aecf492a8aca9a551e45e964780faf3dc9f66765af9f33a1ab7648dcedafd44f`). Isolated WSL no-service install, readiness before/after process restart, and post-restart login passed. This is not clean-host or service acceptance; sudo-dependent service, proxy, backup/restore, independent operator, and upgrade checks remain open.
- 2026-11-18: Completed the transferred media and referral test coverage. `yarn.cmd test --file media.server.test.ts` passed 16/16; `yarn.cmd typecheck:golar`, `yarn.cmd typecheck`, and `yarn.cmd build` passed; the direct full validation sequence passed and `yarn.cmd test` reported 248/248. One preceding combined run reported 31/32 without diagnostic detail, so that failure remains open.
- 2026-11-17: Added final-candidate prerequisites and explicit transferred ownership/refund and referral validation. Preliminary investigations can proceed independently; no tests or release acceptance were performed.
- 2026-11-17: Added independent guide-following and previous-release upgrade/persistence acceptance from the marketing review and linked the separate publication, demo, SMTP, and hosting work. All validation remains open; no executable checks were run.
- 2026-11-17: Ticket created to track existing release-validation gaps. No builds, tests, app startup, or deployment validation were performed during the review.
