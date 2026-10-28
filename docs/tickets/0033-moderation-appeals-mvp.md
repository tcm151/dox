# Ticket 0033: Moderation Appeals Workflow MVP

## Status
- State: In Progress
- Priority: High
- Next: Implement optional report appeals and distinct-moderator review

## Goal
Add a basic appeals workflow so moderated users can request review and moderators can resolve appeals with status tracking.

## Requirements
- [ ] Only the owner of moderated content can submit an appeal on its report.
- [ ] Appeal data is optional on the report and tracks status, reason, reviewer, resolution note, and timestamps.
- [ ] A moderator other than the original decision-maker reviews the appeal.
- [ ] An accepted appeal restores the content and resolves the report; a rejected appeal leaves the removal in place.
- [ ] Users and moderators can see appeal status and review history.

## Tasks
- [ ] Add the optional appeal shape and transitions to report types, schema, and migration.
- [ ] Implement owner submission and moderator review workflows with distinct-reviewer authorization.
- [ ] Build moderator appeal triage and display appeal status/history to the content owner.

## Notes
- Keep initial process simple and auditable.
- Store appeal data as an optional field on `report`; do not create a separate appeal table.
- The accepted/rejected outcomes and inclusion in the in-progress `2026.6.1` migration are confirmed.

## Relevant Files
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue
- server/api/topic/[topic]/reports.ts
- server/api/report/send.ts
- server/utils/ReportManager.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.1.surql
- shared/types/index.ts

## Progress Log
- 2026-10-27: Confirmed appeals are optional report data, only the content owner may submit, and review must be by a moderator other than the original decision-maker. Accepted appeals restore content and resolve the report; rejected appeals leave the removal in place.
- 2026-10-27: Confirmed only the moderated content owner may appeal; include the appeals schema in the in-progress `2026.6.1` migration.
- 2026-10-27: Initial exploration after the audit-log MVP identified appeal eligibility and outcomes as policy decisions to confirm before implementation.
- 2026-04-13: Ticket created.