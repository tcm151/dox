# Ticket 0071: Move Reports To History-Based Workflows

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Replace the existing report resolution and appeal storage model with the agreed complaints and history schema. Adapt reporting APIs, moderator workflows, owner appeal views, and audit behavior while preserving the existing authorization and content-moderation guarantees.

## Requirements
- [x] The fresh-install schema and shared TypeScript contract match the report structure: `subject`, computed `owner` and `topics`, `moderator`, `time`, `complaints`, `status`, and append-only `history` entries with `action`, optional `message`, `user`, `time`, and flexible `changes`.
- [x] Report statuses are `pending`, `removed`, `appealed`, `denied`, and `closed`, with documented transitions and content effects. `denied` represents a rejected appeal and leaves content quarantined; `closed` represents an approved report or an accepted appeal and leaves content active.
- [x] Every report workflow action appends a history entry without modifying earlier entries. History records appeal submissions and decisions, moderator decisions, reopen actions, and topic removals; `action` remains unconstrained by a schema allow-list, and `changes` carries action-specific details. Complaint submissions are recorded only in `complaints`.
- [x] `moderator` identifies the moderator responsible for the current resolved outcome: it is set for a removal or final decision, retained while an appeal is pending, updated to the appeal reviewer when the appeal is decided, and cleared when a report is reopened to `pending`.
- [x] Complaint submission, report decisions, appeal transitions, and topic removal retain current role checks, topic-membership checks, ownership protections, and distinct-moderator appeal review. The one-appeal-per-report behavior is preserved.
- [x] Report queues, API responses, moderator views, and the owner appeal page use the new status/history contract and no longer depend on the legacy `resolution` or `appeal` fields.
- [x] Workflow state changes, subject content status changes, history entries, and corresponding report audit records are persisted atomically where they form one action. Existing notifications and their intended recipients remain correct.
- [x] Tests cover the status transitions, moderator assignment semantics, history contents and immutability, appeal recusal, topic-scoped authorization, content quarantine/restoration, and relevant notifications.
- [x] No report data backfill is required. The unreleased `2026.6.1` migration upgrades initialized `2026.6.0` databases without rewriting a released migration.

## Tasks
- [x] Define and document the full status/action/content-status/moderator transition matrix, including whether each terminal state can be reopened.
- [x] Update the report table schema and select the forward-migration strategy; preserve top-level `time` as report creation time and stop refreshing it when later complaints are added.
- [x] Update shared report types and all API queries/responses to expose owner, complaints, status, moderator, and history consistently.
- [x] Refactor `ReportManager` and report routes to append history entries for approvals, removals, appeal submission/review, reopening, and topic removal. Complaint submission is represented only in `complaints`.
- [x] Adapt report queue, moderator report pages, owner appeal page, notifications, and moderation composables to read and display history-based decisions.
- [x] Update report audit logging so it reflects the new workflow without creating duplicate or contradictory audit events.
- [x] Update report workflow documentation and add or revise focused integration tests for the new contract.
- [x] Run the schema/migration sandbox checks, report tests, typecheck, and full test suite.

## Notes
- The target schema keeps `time`; its meaning is report creation time. Each complaint and history entry has its own event time.
- History entries use the agreed fields: `action`, optional `message`, `user`, `time`, and flexible `changes`. The schema does not constrain `action` to a fixed enum.
- Preserve the existing product behavior from [Ticket 0033](0033-moderation-appeals-mvp.md) and [Ticket 0063](completed/0063-report-queue-triage.md), except where this ticket explicitly replaces the storage contract or statuses.
- Review the in-progress `2026.6.1` migration before implementation. Consolidate only if it is still the intended unreleased target; otherwise add a forward migration without rewriting a released migration.

## Relevant Files
- server/assets/schema.surql
- server/assets/migrations/2026.6.1.surql
- shared/types/index.ts
- shared/utils/moderation.ts
- server/utils/ReportManager.ts
- server/api/report/
- server/api/topic/[topic]/reports/
- server/api/moderator/reports.ts
- server/api/profile/appeals/
- app/components/lists/ReportQueue.vue
- app/components/lists/ReportQueueItem.vue
- app/pages/moderator/reports.vue
- app/pages/topic/[topic]/reports.vue
- app/pages/appeal/[id].vue
- tests/parallel/reports.test.ts
- docs/Architecture.md

## Progress Log
- 2026-10-29: Completed the history-based report schema, backend workflows, queues, owner appeal view, transition documentation, and integration coverage. `yarn typecheck`, `yarn test` (59/59), the `.6.0` migration sandbox, and `git diff --check` pass.
- 2026-10-29: Ticket created.
