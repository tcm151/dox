# Ticket 0082: Restore Vote-State Animation

## Status
- State: Completed
- Priority: Low
- Next: None

## Goal
Restore brief visual feedback when a user's vote changes while preserving the persistent styling that identifies the selected vote.

## Requirements
- [x] A vote-state change triggers the intended brief animation for positive, misleading, and negative votes.
- [x] The animation does not obscure the selected-vote styling and respects reduced-motion preferences.
- [x] Vote controls remain fully functional when motion is reduced or unavailable.

## Tasks
- [x] Verify how vote-state changes add and remove the `voted` class in the vote controls.
- [x] Replace the load-triggered `.voted` animation with a transient click-only animation.
- [x] Verify all vote types, repeat state changes, and reduced-motion behavior.

## Notes
- `.voted` remains persistent selection styling; `.vote-state-change` drives the click-only animation.

## Relevant Files
- app/assets/scss/_animations.scss
- app/assets/scss/_colors.scss
- app/assets/scss/_elements.scss
- app/components/system/tags/Votes.vue
- tests/parallel/vote-animation.browser.test.ts

## Progress Log
- 2026-11-19: Added immediate click-only feedback and verified load, all vote types, repeat clicks, and reduced-motion behavior in the browser suite.
- 2026-11-09: Ticket created.