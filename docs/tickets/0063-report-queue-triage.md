# Ticket 0063: Complete Report Queue Triage

## Status
- State: Planned
- Priority: Medium
- Next: Audit current report queue actions and document their states

## Goal
Make moderator report triage complete, predictable, and documented for the existing report surfaces.

## Requirements
- [ ] Moderators can distinguish pending, reviewed, and resolved reports.
- [ ] Report actions and their authorization rules are documented.
- [ ] The documented workflow matches the behavior exposed by the moderator UI and API.

## Tasks
- [ ] Audit report queue actions, states, and role checks.
- [ ] Fill any missing triage actions or state transitions.
- [ ] Document the moderator report workflow and verify it against the implementation.

## Notes
- Moderation action audit records and appeals are tracked separately in Tickets 0005 and 0033.

## Relevant Files
- app/pages/moderator.vue
- app/pages/topic/[topic]/reports.vue
- server/api/topic/[topic]/reports.ts
- docs/Architecture.md

## Progress Log
- 2026-10-25: Ticket created.