# Ticket 0085: Topic Lock Controls

## Status
- State: Completed
- Priority: Medium
- Next: None

## Goal
Give administrators a validated topic lock/unlock workflow with consistent server-side enforcement and clear state in the UI.

## Requirements
- [x] Only admins can lock and unlock topics using validated actions.
- [x] Locked topics remain discoverable and readable but cannot be assigned to new content; existing content remains usable.
- [x] Topic lifecycle state is visible to users, and existing content remains accessible.
- [x] Tests cover role authorization, state transitions, and enforcement on affected write paths.

## Tasks
- [x] Define lock semantics, allowed roles, and behavior for existing content and topic discovery.
- [x] Add an explicit topic status (`active`, `locked`) to the schema, shared type, and confirmed 2026.6.2 migration.
- [x] Add admin-only topic lock/unlock APIs and controls with audit records.
- [x] Add user-facing locked state and admin topic-list status.
- [x] Prevent assigning locked topics to new content while keeping existing content usable; add focused tests.

## Notes
- Topic lifecycle state uses only `active` and `locked`; archive/restore are outside this ticket's scope.
- Do not add a separate `topicLocked` field or topic-scoped moderation lock.
- Only administrators can lock or unlock topics.
- Locking keeps a topic visible and prevents assigning it to new content; it does not lock content that already uses it.
- Existing item-level moderation locks remain unchanged.
- The user confirmed that the in-progress 2026.6.2 migration is the target for this change.

## Relevant Files
- app/pages/topic/[topic]/
- app/pages/admin/topics.vue
- server/api/topic/[topic]/
- server/utils/ModerationManager.ts
- server/assets/schema.surql
- tests/parallel/topics.server.test.ts
- tests/parallel/topics.browser.test.ts
- shared/types/index.ts

## Progress Log
- 2026-11-11: Completed the lock-only scope; archive/restore are outside this ticket.
- 2026-11-11: Completed and verified admin-only topic locking, audit logging, UI indicators, and assignment enforcement. Archive/restore remain deferred.
- 2026-11-11: Confirmed lifecycle behavior and the 2026.6.2 migration target with the user.
- 2026-11-11: Started refinement after deferring topic renaming; investigating current topic behavior and write paths.
- 2026-11-11: Ticket created.
