# Ticket 0033: Moderation Appeals Workflow MVP

## Status
- State: Completed
- Priority: High
- Next: None

## Goal
Add a basic appeals workflow so moderated users can request review and moderators can resolve appeals with status tracking.

## Requirements
- [x] Only the owner of moderated content can submit an appeal on its report.
- [x] The optional appeal stores its reason and submission time, with an optional reviewer; submitting it changes the report status to `appealed`, and the report status and resolution record the outcome and decision note.
- [x] A moderator other than the original decision-maker reviews the appeal.
- [x] An accepted appeal restores the content and marks the report `approved`; a rejected appeal leaves the removal in place and returns the report status to `removed`.
- [x] Owners and moderators can see appeal status and decision details, and the owner can reach the appeal flow from the removal notification.
- [x] Report queues respect ownership and appeal recusal: moderators do not see their own reports or appeals they must recuse themselves from; admins can see all reports but cannot act on their own content.

## Tasks
- [x] Add the optional appeal shape and transitions to report types, schema, and migration.
- [x] Implement owner submission and moderator review workflows with distinct-reviewer authorization.
- [x] Build moderator appeal triage and owner appeal status/submission page, linked from notifications.

## Notes
- Keep initial process simple and auditable.
- Store appeal data as an optional field on `report`; do not create a separate appeal table.
- Use report status and resolution for the appeal outcome and decision note; do not duplicate them in `report.appeal`.
- The accepted/rejected outcomes and inclusion in the in-progress `2026.6.1` migration are confirmed.
- These completion-time storage/status decisions were superseded by [0071](0071-history-based-report-workflows.md). Use its history-based contract for current implementation; the older results below remain historical evidence.

## Relevant Files
- app/components/lists/ReportQueue.vue
- app/pages/appeal/[id].vue
- app/pages/inbox.vue
- app/pages/moderator.vue
- app/pages/topic/[topic]/tools/reports.vue
- server/api/report/index.ts
- server/api/topic/[topic]/reports.ts
- server/api/profile/appeals/[id].ts
- server/api/report/send.ts
- server/utils/ReportManager.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.1.surql
- shared/types/index.ts

## Progress Log
- 2026-10-28: Closed out the appeal flow with report queue ownership/recusal rules and a computed `{ id, name }` author field shared by report responses. Report tests pass (53/53); Nuxt typecheck and `git diff --check` pass.
- 2026-10-28: Completed the appeal workflow and notification entry point. Submission sets report status to `appealed`; acceptance marks it `approved` and rejection returns it to `removed`. Report tests pass (52/52) and Nuxt typecheck passes.
- 2026-10-27: Confirmed appeals are optional report data, only the content owner may submit, and review must be by a moderator other than the original decision-maker. Accepted appeals restore content and mark the report `approved`; rejected appeals leave the removal in place.
- 2026-10-27: Confirmed only the moderated content owner may appeal; include the appeals schema in the in-progress `2026.6.1` migration.
- 2026-10-27: Initial exploration after the audit-log MVP identified appeal eligibility and outcomes as policy decisions to confirm before implementation.
- 2026-04-13: Ticket created.