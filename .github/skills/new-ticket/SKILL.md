---
name: new-ticket
description: "Create, update, or complete ClassicForum tickets in docs/tickets."
argument-hint: "Short ticket title or problem statement"
---

# New Ticket

## Workflow

1. Get the ticket title or problem. If the goal is unclear, ask for the goal, priority, and one or two acceptance criteria.
2. Find the highest existing four-digit ticket number across all ticket folders:
   - `docs/tickets/*.md`
   - `docs/tickets/backlog/*.md`
   - `docs/tickets/completed/*.md`
3. Use the next number, padded to four digits, with a lowercase kebab-case slug from the title.
4. Create it at `docs/tickets/NNNN-slug.md`, unless the user asks for `backlog` or another folder.
5. Read `docs/tickets/_template.md` before creating or editing a ticket. Keep its section order and field names. Replace placeholders with ticket details; leave guidance comments in the template.
6. Use `Planned` for new root tickets, `In Progress` once work starts, and `Deferred` for backlog tickets. Set `High`, `Medium`, or `Low` priority (default `Medium`) and give one concrete `Next` action.
7. Link only unfinished prerequisites: `- [NNNN](relative-ticket-path.md): Reason`. Omit `Dependencies` if none remain and check for unknown IDs, self-dependencies, and cycles. Put related or parallel work in `Notes` using plain ticket numbers (e.g. `Ticket 0142`).
8. Write a short `Goal`, testable `Requirements`, actionable `Tasks`, concise `Notes`, and relevant file paths.
9. Use indented sub-task checkboxes under a task when it has independently trackable steps; keep simple tasks flat. Leave all new checkboxes unchecked.
10. Add `YYYY-MM-DD: Ticket created.` to `Progress Log` using today's date. Keep the newest entry first.
11. Report the ticket number, path, and assumptions to check.

## Conventions

- Use Title Case titles.
- Never reuse a ticket number, including numbers in `backlog` or `completed`.
- Move deferred tickets to the root when reactivating them. Use `Paused` for active work on hold.
- When editing a ticket, preserve completed checkboxes and progress history. Keep dated entries newest first; do not copy template guidance into the ticket.
- Mark a parent task complete only when its work and all of its sub-tasks are complete.
- Use plain repository-relative paths in `Relevant Files`, or `- TBD` if unknown.

## Completion

1. Move any deferred work to a follow-up ticket. Verify prerequisites are complete and check every `Requirements` and `Tasks` item.
2. Set `State: Completed` and `Next: None`. Remove `Dependencies` and move the ticket to `completed/`.
3. Remove references to the completed ID from other tickets' `Dependencies` sections. Drop empty sections and fix any remaining relative links affected by the move.
4. Run `yarn standup` (`yarn.cmd standup` if PowerShell blocks the shim).