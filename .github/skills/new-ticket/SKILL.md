---
name: new-ticket
description: "Use when: creating a new OpenForum ticket, issue spec, work item, backlog item, task ticket, or docs/tickets entry. Helps choose the next ticket number, create a slugged filename, and fill the project ticket template."
argument-hint: "Short ticket title or problem statement"
---

# New Ticket

Use this skill to create a new project ticket in `docs/tickets/`.

## Workflow

1. Gather the ticket title or problem statement from the user. If the request is vague, ask for the goal, priority, and one or two acceptance criteria.
2. Find the highest existing four-digit ticket number across:
   - `docs/tickets/*.md`
   - `docs/tickets/backlog/*.md`
   - `docs/tickets/completed/*.md`
3. Use the next number padded to four digits, then create a lowercase kebab-case slug from the title.
4. Create the new ticket at `docs/tickets/NNNN-slug.md` unless the user asks for `backlog` or another ticket folder.
5. Read the current `docs/tickets/_template.md` before creating or editing any ticket. Follow its section order and field names, replacing placeholders with useful first-pass values. Leave guidance comments and placeholder instructions in the template, not in the ticket.
6. Set `Status` as:
   - `State: Planned` for new work; use `In Progress` only when work has started and `Completed` only when finished.
   - `Priority: High`, `Medium`, or `Low` based on the user's request, defaulting to `Medium` when unspecified.
   - `Next:` as one immediate concrete step, or `None` for completed work.
7. Fill `Dependencies` with one `- [NNNN](relative-ticket-path.md): Reason` entry for each ticket that must be completed before this ticket can be finished. Omit the section when there are no prerequisites. Check numbers across all ticket folders and avoid self-dependencies and cycles; related or parallel work belongs in `Notes`.
8. Write a one- or two-sentence `Goal`, testable acceptance criteria under `Requirements`, actionable steps under `Tasks`, concise separate bullets under `Notes`, and paths under `Relevant Files`. Mark new requirement and task checkboxes unchecked.
9. Add a `Progress Log` entry with today's date in `YYYY-MM-DD` format: `YYYY-MM-DD: Ticket created.` Keep the log in reverse chronological order, inserting future updates above older entries.
10. After creating the file, report the ticket number, path, and any assumptions that should be checked.

## Conventions

- Keep ticket titles human-readable in Title Case.
- Keep filenames lowercase, four-digit-prefixed, and kebab-cased.
- Do not reuse ticket numbers, including numbers in `backlog` or `completed`.
- Prefer a concrete `Next` step over broad planning language.
- Use only the template's `Planned`, `In Progress`, and `Completed` states, `Next` field, and `Requirements` heading in every ticket, including completed work.
- Preserve existing checkbox completion and progress history when updating a ticket. Keep dated progress entries newest first. Consult the template's guidance without copying it into tickets.
- If relevant files are unknown, use `- TBD` rather than inventing paths.