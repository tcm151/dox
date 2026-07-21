# Ticket 0034: Fullscreen Editor Viewport Bounds

## Status
- State: Done
- Priority: Medium
- Next action: None

## Goal
Make writing and previewing posts and threads feel stable by giving editor surfaces a fullscreen workflow with viewport-bounded text areas and preview panes.

## Done Looks Like
- [x] Post and thread editors can use the available viewport height for the writing and preview experience without pushing key actions off-screen.
- [x] Markdown textareas cannot be resized taller than the fullscreen editor area; overflowing content scrolls inside the textarea instead of expanding the page.
- [x] Switching between edit and preview keeps the user near the same writing or reading position without requiring extra page scrolling.

## Tasks
- [x] Audit editor page layout, toolbar, footer, and preview containers for fixed-height/fullscreen behavior.
- [x] Update `MarkdownEditor` styling or props so editor textareas can fill their container while respecting viewport max-height constraints.
- [x] Align edit and preview pane heights so toggling preview does not shift the page or hide the toggle controls.
- [x] Preserve or restore textarea and preview scroll positions when toggling between edit and preview.
- [x] Test desktop and mobile viewport sizes with long post and thread content.

## Notes
- Current issue: long textareas can become taller than the screen, so toggling between editing and previewing forces a lot of page scrolling and makes it hard to keep the same place in the text.
- Prefer a shared solution in the editor component/layout instead of one-off height rules on each page.
- User-tested after implementation and confirmed the fullscreen editor behavior works well.

## Relevant Files
- [app/components/form/MarkdownEditor.vue](../../../app/components/form/MarkdownEditor.vue)
- [app/pages/editor/post.vue](../../../app/pages/editor/post.vue)
- [app/pages/editor/thread.vue](../../../app/pages/editor/thread.vue)
- [app/layouts/simple.vue](../../../app/layouts/simple.vue)

## Progress Log
- 2026-07-21: Completed ticket after user verification with long editor content.
- 2026-07-21: Added bounded editor shell, bounded MarkdownEditor mode, fixed editor action footers, and internal edit/preview scrolling for post and thread editors.
- 2026-07-21: Ticket created.