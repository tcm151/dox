# Ticket 0006: Implement Shadow Quarantine Flow

## Status
- State: Deferred
- Priority: High
- Next: Define trigger rules and review-first versus automatic enforcement behavior

## Goal
Add a moderation safety flow that limits visibility and interaction for suspicious first-time users, with an admin-configurable choice between review-first and automatic quarantine.

## Requirements
- [ ] Suspicious first-time accounts can be placed into quarantine state.
- [ ] Quarantined behavior is enforced in key write/read surfaces.
- [ ] Moderators/admins can review and clear quarantine status.
- [ ] Admins can choose whether a trigger creates a pending review case before enforcement or immediately quarantines the user until a moderator/admin clears it.

## Tasks
- [ ] Define the account quarantine state, trigger conditions, enforcement mode behavior, and safe default.
- [ ] Add the enforcement mode to admin moderation settings and validate it server-side.
- [ ] Enforce state checks in relevant API handlers.
- [ ] Add moderation UI to review and resolve quarantined accounts.
- [ ] Test both enforcement modes, authorization, quarantine clearing, and visibility behavior.

## Notes
- In review-first mode, a trigger creates a pending case and does not restrict the user until a reviewer confirms quarantine. In automatic mode, quarantine begins immediately and remains until an authorized reviewer clears it.
- Decide whether review-first has a time limit and how changing the configured mode affects existing cases.

## Relevant Files
- app/pages/admin.vue
- app/pages/admin/users.vue
- app/pages/admin/settings.vue
- app/utils/settings.ts
- server/api/user/register.ts
- server/api/user/index.ts
- server/api/admin/settings/[id]/update.ts
- server/utils/auth.ts
- server/utils/SettingsManager.ts
- server/utils/repos/UserManager.ts
- shared/types/index.ts
- server/assets/schema.surql
- tests/parallel/settings.server.test.ts

## Progress Log
- 2026-04-13: Ticket created.