# Ticket 0038: Reusable Dropdown Autocomplete Form Component

## Status
- State: Todo
- Priority: Medium
- Next action: Define the component API by extracting the current topic match dropdown behavior from `TopicField`.

## Goal
Create a reusable form dropdown/autocomplete component for typeahead selection flows, starting with topic selection and keeping the API suitable for a future mention picker.

## Done Looks Like
- [ ] `TopicField` uses a reusable autocomplete/dropdown component without losing topic validation, topic limits, or restricted-topic behavior.
- [ ] The shared component supports controlled query text, filtered options/results, mouse selection, keyboard selection, focus/blur behavior, and loading/empty states.
- [ ] The component API is general enough for a future mention picker but does not add mention persistence, parsing, or notification behavior.

## Tasks
- [ ] Audit `TopicField`'s current matching dropdown behavior and identify the generic UI responsibilities.
- [ ] Add a reusable form component under the shared form component area.
- [ ] Convert `TopicField` to use the reusable component while keeping topic domain rules in `TopicField`/`useTopicManager`.
- [ ] Add or update focused validation for keyboard, mouse, empty, and restricted-topic paths.

## Notes
- This ticket was split from Ticket 0011 after thread editor parity was completed.
- No completed post-side mention picker exists yet, so this ticket should build the reusable UI primitive without expanding into full mention workflow scope.
- Keep validation and domain decisions outside the reusable component; it should own rendering, option navigation, and selection mechanics.

## Relevant Files
- [app/components/form/fields/TopicField.vue](../../app/components/form/fields/TopicField.vue)
- [app/utils/topics.ts](../../app/utils/topics.ts)
- [app/components/form](../../app/components/form)

## Progress Log
<!-- Add newest progress entries first; keep this log in reverse chronological order. -->
- 2026-07-21: Ticket created.
