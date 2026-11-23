# Ticket 0141: Support Single and Group Collapse Transitions

## Status
- State: Planned
- Priority: Medium
- Next: Audit `CollapseTransition` call sites to identify single-item and group usage.

## Goal
Allow `CollapseTransition` to animate either one child or multiple children without changing how existing single-child callers use it.

## Requirements
- [ ] Existing single-child callers still get the same height animation, `mode`, and `speed` behavior without changing their markup.
- [ ] In group usage, adding or removing multiple keyed children animates each affected item without remounting unaffected siblings, including when the group grows from empty or shrinks to one item or none.
- [ ] Both usages clear temporary inline styles after transitions finish or are cancelled.

## Tasks
- [ ] Define how callers select group support while keeping single-child usage as the default.
- [ ] Use Vue's `Transition` for single children and `TransitionGroup` for keyed groups, reusing the existing height animation hooks.
- [ ] Document key requirements and which props apply to groups.
- [ ] Add regression coverage for single-child behavior, changes in group size, and interrupted transitions.

## Notes
- The current component always uses `Transition`; its template TODO calls out the need for `TransitionGroup` with multiple children.
- Keep `mode` specific to single-child transitions; `TransitionGroup` does not support it.

## Relevant Files
- app/components/system/CollapseTransition.vue

## Progress Log
- 2026-11-23: Ticket created.
