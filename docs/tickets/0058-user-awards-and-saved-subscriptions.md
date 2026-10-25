# Ticket 0058: User Awards and Saved Subscriptions

## Status
- State: In Progress
- Priority: Medium
- Next: Define ranking rules and feed integration for saved-user content

## Goal
Give user records the same award and save engagement fields as other voteable records. Let users award other users and save them as a stronger subscription than following, with a distinct effect that is explicitly defined.

## Requirements
- [x] New and existing user records expose `positive`, `misleading`, `negative`, `awards`, and `saves` arrays.
- [x] Authenticated users can award another user with self-award, duplicate-award, and insufficient-token protections; the recipient receives the token credit and a notification linking to their profile.
- [x] Authenticated users can save and unsave another user, and the profile clearly reflects saved state and save count.
- [ ] Saved users' content receives a sorting or popularity boost distinct from the existing following-feed filter; implement the ranking behavior after the engagement fundamentals are in place.
- [x] Integration coverage verifies user engagement defaults, award balance and notification behavior, and save/unsave access and state.

## Tasks
- [x] Update the shared user contract and fresh database schema; add a forward migration for existing databases.
- [x] Add authenticated user award, save, and unsave API routes with validation and appropriate idempotency.
- [x] Add profile controls and display for award/save actions and state.
- [x] Add focused integration tests for the user engagement behavior.
- [ ] Add the saved-user sorting/popularity boost after the data, API, profile, and test fundamentals are in place.

## Notes
- Following currently affects inclusion in the authenticated following feed; saved-user behavior must add a distinct effect.
- Decision: saved users' content should receive a sorting/popularity boost. Defer the exact ranking rules and feed integration until the engagement fundamentals are complete.
- Content award handlers transfer 256 tokens and create a notification. The notification schema accepts user contexts, and inbox context navigation opens the corresponding profile.
- `votes.saves` is present in content schemas but does not currently have an API action or UI.

## Relevant Files
- shared/types/index.ts
- server/assets/schema.surql
- server/assets/migrations/
- server/api/user/[id]/follow.ts
- server/api/post/[id]/award.ts
- server/api/thread/[id]/award.ts
- app/components/system/previews/UserPreview.vue
- app/utils/session.ts
- app/pages/inbox.vue
- tests/sequential/

## Progress Log
- 2026-10-24: Completed the user awards and saved-subscription schema, migration, routes, profile controls, and integration coverage. Saved-user ranking remains deferred pending explicit rules and feed integration.
- 2026-10-24: Ticket created.
