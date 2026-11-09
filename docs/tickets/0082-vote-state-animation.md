# Ticket 0082: Restore Vote-State Animation

## Status
- State: Planned
- Priority: Low
- Next: Verify vote-state changes retrigger the animation without relying on initial page load

## Goal
Restore brief visual feedback when a user's vote changes while preserving the persistent styling that identifies the selected vote.

## Requirements
- [ ] A vote-state change triggers the intended brief animation for positive, misleading, and negative votes.
- [ ] The animation does not obscure the selected-vote styling and respects reduced-motion preferences.
- [ ] Vote controls remain fully functional when motion is reduced or unavailable.

## Tasks
- [ ] Verify how vote-state changes add and remove the `voted` class in the vote controls.
- [ ] Restore the missing `voted` keyframes or replace the animation with an equivalent defined effect.
- [ ] Verify all vote types, repeat state changes, and reduced-motion behavior.

## Notes
- `.voted` currently references an animation whose keyframes are commented out pending finalized vote-state transitions.

## Relevant Files
- app/assets/scss/_colors.scss
- app/assets/scss/_elements.scss
- app/components/system/tags/Votes.vue

## Progress Log
- 2026-11-09: Ticket created.