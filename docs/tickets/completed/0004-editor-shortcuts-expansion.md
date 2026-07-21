# Ticket 0004: Expand Editor Keyboard Shortcuts

## Status
- State: Todo
- Priority: Low
- Next action: Pick first 3 shortcuts to implement beyond save-draft

## Goal
Improve authoring speed by adding a small set of reliable keyboard shortcuts in the post editor.

## Done Looks Like
- [x] At least 3 new editor shortcuts are implemented.
- [x] Shortcut behaviors are discoverable in UI/help text.
- [x] Existing Ctrl/Cmd+S draft-save behavior is unchanged.

## Tasks
- [x] Define shortcut list and avoid conflicts with browser/system defaults.
- [x] Implement bindings and handlers in editor page.
- [x] Add quick UI hint or tooltip reference.

## Notes
- Undo/redo using the regular browser tools doesn't really work anymore. Need to implement own stack.

## Relevant Files
- app/pages/editor/post.vue
- app/pages/editor.vue
- app/utils/cache.ts
- app/plugins/markdown.ts

## Progress Log
- 2026-07-21: Scaffolded and tested basic markdown functions.
- 2026-04-13: Ticket created.


