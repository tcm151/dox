# Ticket 0085: Topic Archive And Lock Controls

## Status
- State: Paused
- Priority: Medium
- Next: Confirm archive/restore requirements before implementation

## Goal
Give administrators a validated topic lock/unlock workflow with consistent server-side enforcement and clear state in the UI. Keep archive/restore work deferred until its authorization and behavior are confirmed.

## Requirements
- [x] Only admins can lock and unlock topics using validated actions.
- [ ] Authorized users can archive and restore topics using validated actions.
- [x] Locked topics remain discoverable and readable but cannot be assigned to new content; existing content remains usable.
- [ ] Archived topics are omitted from active discovery and topic selection, remain readable by direct link, and reject new content and discussion activity.
- [x] Topic lifecycle state is visible to users, and existing content remains accessible.
- [x] Tests cover role authorization, state transitions, and enforcement on affected write paths.

## Tasks
- [x] Define lock semantics, allowed roles, and behavior for existing content and topic discovery.
- [x] Add an explicit topic status (`active`, `locked`) to the schema, shared type, and confirmed 2026.6.2 migration.
- [x] Add admin-only topic lock/unlock APIs and controls with audit records.
- [ ] Define and implement archive/restore controls and role-gated APIs after scope confirmation.
- [x] Add user-facing locked state and admin topic-list status.
- [x] Prevent assigning locked topics to new content while keeping existing content usable; add focused tests.

## Notes
- Topic lifecycle state currently uses only `active` and `locked`; archive status and controls are deferred.
- Do not add a separate `topicLocked` field or topic-scoped moderation lock.
- Only administrators can lock or unlock topics. Archive/restore authorization is separate and remains to be confirmed when that scope resumes.
- Locking keeps a topic visible and prevents assigning it to new content; it does not lock content that already uses it.
- Archiving, when implemented, hides a topic from active discovery and selection while preserving direct-link reading.
- Restoring an archived topic returns its status to `active`.
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
- 2026-11-11: Completed and verified admin-only topic locking, audit logging, UI indicators, and assignment enforcement. Archive/restore remain deferred.
- 2026-11-11: Confirmed lifecycle behavior and the 2026.6.2 migration target with the user.
- 2026-11-11: Started refinement after deferring topic renaming; investigating current topic behavior and write paths.
- 2026-11-11: Ticket created.
