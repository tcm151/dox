---
name: new-ticket
description: "Use when creating or editing an ClassicForum ticket or work item in docs/tickets. Guides ticket numbering, filenames, dependencies, and the project template."
argument-hint: "Short ticket title or problem statement"
---

# New Ticket

Use this skill to add a project ticket under `docs/tickets/`.

## Workflow

1. Get the ticket title or problem. If the goal is unclear, ask for the goal, priority, and one or two acceptance criteria.
2. Find the highest existing four-digit ticket number across all ticket folders:
   - `docs/tickets/*.md`
   - `docs/tickets/backlog/*.md`
   - `docs/tickets/completed/*.md`
3. Use the next number, padded to four digits, with a lowercase kebab-case slug from the title.
4. Create it at `docs/tickets/NNNN-slug.md`, unless the user asks for `backlog` or another folder.
5. Read `docs/tickets/_template.md` before creating or editing a ticket. Keep its section order and field names. Replace placeholders with ticket details; leave guidance comments in the template.
6. Set `Status` as:
   - `State: Planned` for new work, `In Progress` once work starts, and `Completed` when finished.
   - `Priority: High`, `Medium`, or `Low` based on the request; default to `Medium` if unspecified.
   - `Next:` one immediate action, or `None` when complete.
7. List only tickets that must finish first as dependencies. Use `- [NNNN](relative-ticket-path.md): Reason`; omit the section if none are required. Check all ticket folders for unknown numbers, self-dependencies, and cycles. Put related or parallel work in `Notes`.
8. Write a short `Goal`, testable `Requirements`, actionable `Tasks`, concise `Notes`, and relevant file paths. Leave new requirement and task checkboxes unchecked.
9. Add `YYYY-MM-DD: Ticket created.` to `Progress Log` using today's date. Keep the newest entry first.
10. Report the ticket number, path, and assumptions to check.

## Conventions

- Use readable Title Case titles and lowercase, four-digit-prefixed kebab-case filenames.
- Never reuse a ticket number, including numbers in `backlog` or `completed`.
- Make `Next` one immediate action, not a broad plan.
- Use only `Planned`, `In Progress`, and `Completed`. Every ticket, including completed tickets, needs `Next` and `Requirements`.
- When editing a ticket, preserve completed checkboxes and progress history. Keep dated entries newest first; do not copy template guidance into the ticket.
- If a relevant path is unknown, use `- TBD`; do not invent it.