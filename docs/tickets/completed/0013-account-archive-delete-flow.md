# Ticket 0013: Account Archive/Delete Flow

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Provide a user-controlled account exit flow while preserving forum integrity and moderation traceability.

## Requirements
- [x] User can choose between retaining authored content and removing authored content from settings.
- [x] Content retention and full deletion behavior is implemented and documented.
- [x] Password and username confirmation are required, and account/session state is invalidated after deletion.

## Tasks
- [x] Define the retention and full-deletion rules.
- [x] Implement separate authenticated API handlers with confirmations and safeguards.
- [x] Add the deletion settings page with warnings and irreversible-action prompts.

## Notes
- Retained content and preserved report/moderation attribution use the reserved `user:deleted` owner, displayed as `deleted`.
- Full deletion redacts content with replies, quotes, or comments and deletes unreferenced authored records. Historical votes are preserved unchanged.
- Validation: focused account-deletion tests passed (5/5); the full suite passed (101/101); `yarn build` passed. `yarn typecheck` remains blocked by the unrelated unresolved `@@/shared/utils/moderation` import in `app/components/lists/ReportQueueItem.vue`.

## Relevant Files
- app/pages/settings/delete.vue
- server/api/profile/account/delete.ts
- server/api/profile/account/wipe.ts
- server/utils/repos/AccountManager.ts
- server/utils/defaultAccount.ts
- server/assets/schema.surql
- server/assets/migrations/2026.6.2.surql
- app/components/system/tags/UserTag.vue
- app/components/system/previews/UserPreview.vue
- tests/parallel/account.server.test.ts

## Progress Log
- 2026-11-09: Implemented and validated the retention and full-deletion workflows; documented the resulting content and vote contracts.
- 2026-04-13: Ticket created.
