# Ticket 0069: Standardize Moderation And Report UI States

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Align moderation and report result states with the existing awaited datasource and list conventions, so empty messages render only after data is available.

## Requirements
- [x] Moderation and report pages await datasource results and do not show empty messages while required data is unavailable.
- [x] Empty results use existing page-specific messages and filter-sensitive copy.
- [x] Existing datasource error notifications and page actions remain in place without adding a shared async-state component.

## Tasks
- [x] Audit moderation and report list pages for empty-state guard consistency.
- [x] Guard empty-state messages on data availability in affected list pages.
- [x] Verify with Vue/TypeScript typecheck and whitespace checks.

## Notes
- Loading remains handled by the existing awaited datasource pattern; no separate loading component is needed.
- Datasource errors continue to use existing global hints.
- Messaging UI workflow completeness is tracked separately in Ticket 0067.

## Relevant Files
- app/pages/admin/logs.vue
- app/pages/moderator/topics.vue
- app/pages/moderator/requests.vue
- app/pages/moderator/reports.vue
- app/components/lists/ReportQueue.vue
- app/pages/topic/[topic]/tools/reports.vue
- app/utils/data.ts

## Progress Log
- 2026-11-11: Completed after confirming awaited datasource loading and guarding empty states until data is available; typecheck and diff check passed.
- 2026-10-25: Ticket created.