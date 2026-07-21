# Ticket 0011: Thread Editor Parity With Post Editor

## Status
- State: Done
- Priority: Medium
- Next action: None

## Goal
Bring thread editor capabilities in line with post editor where the product model already supports parity, while keeping editor-specific behavior local and reducing duplicated editor plumbing.

## Done Looks Like
- [x] Draft workflow remains post-only until other editor variants have concrete persistence needs.
- [x] Preview behavior matches post editor expectations.
- [x] Thread image upload workflow is consistent with existing editor patterns.
- [x] Mention/autocomplete component work is split into a focused follow-up ticket instead of blocking thread parity.

## Tasks
- [x] Document current gap list between thread and post editor.
- [x] Implement highest-impact parity features first (preview, validation, upload plumbing).
- [x] Add/adjust shared editor logic to reduce duplication.

## Notes
- Current editor parity scope is complete:
	- `/editor` owns auth, tab memory, and default routing.
	- `EditorFrame` owns the shared editor shell, submit action, internal preview toggle, and persistent preview watermark.
	- Post, thread, link, image, audio, and poll editors use the shared frame while preserving their page-specific fields and submit behavior.
	- `useImageUploader` and `UploadedImages` provide shared post/thread/image upload state, upload, removal, and markdown-copy behavior.
	- `useTopicManager` owns editor topic state and is passed directly into `TopicField`.
	- Thread creation validates content/topics, uploads image attachments, sends image IDs to `/api/thread/add`, and renders attached images in editor preview, feed preview, and thread detail.
- Draft workflow is intentionally post-only for now.
	- Post editor supports server-backed draft load/save/update and Ctrl+S save.
	- Existing `draft` records are post-shaped: they require `title`, allow `replyTo` only for posts, and do not carry a `kind`/`type` field.
	- Do not show Drafts actions on thread, link, poll, image, or audio editors until those variants have concrete persistence needs.
- Link, poll, image, and audio editors now present post-style shells, validation, topics, previews, and explicit unavailable-publishing notices where no create API exists yet.
- Reusable dropdown/autocomplete work has been split into Ticket 0038 so mention infrastructure does not block this parity ticket.

### Watch-outs
- Avoid copying the post draft model into non-post editors without a product reason and schema/API decision.
- Upload parity should include both creation-time attachment and display-time rendering.
- Keep thread content length aligned with the schema limit unless the product decision is to change that limit.
- Keep future mention support separate from this ticket unless a concrete post/thread mention workflow is introduced first.

## Relevant Files
- [app/pages/editor.vue](../../../app/pages/editor.vue)
- [app/pages/editor/thread.vue](../../../app/pages/editor/thread.vue)
- [app/pages/editor/post.vue](../../../app/pages/editor/post.vue)
- [app/pages/editor/image.vue](../../../app/pages/editor/image.vue)
- [app/pages/editor/audio.vue](../../../app/pages/editor/audio.vue)
- [app/pages/editor/link.vue](../../../app/pages/editor/link.vue)
- [app/pages/editor/poll.vue](../../../app/pages/editor/poll.vue)
- [app/pages/editor/components/EditorFrame.vue](../../../app/pages/editor/components/EditorFrame.vue)
- [app/pages/editor/components/UploadedImages.vue](../../../app/pages/editor/components/UploadedImages.vue)
- [app/utils/media.ts](../../../app/utils/media.ts)
- [app/utils/topics.ts](../../../app/utils/topics.ts)
- [app/components/system/MediaUploader.vue](../../../app/components/system/MediaUploader.vue)
- [app/components/form/fields/TopicField.vue](../../../app/components/form/fields/TopicField.vue)
- [app/components/system/previews/ThreadPreview.vue](../../../app/components/system/previews/ThreadPreview.vue)
- [app/pages/thread/[id].vue](../../../app/pages/thread/[id].vue)
- [server/api/thread/add.ts](../../../server/api/thread/add.ts)
- [server/assets/schema.surql](../../../server/assets/schema.surql)

## Progress Log
- 2026-07-21: Completed current thread editor parity scope and moved ticket to completed.
- 2026-07-21: Completed current thread editor parity scope and split reusable dropdown/autocomplete follow-up into Ticket 0038.
- 2026-07-21: Updated editor component APIs so `TopicField` and `UploadedImages` accept the relevant composable objects directly.
- 2026-07-21: Extracted shared editor topic state into `useTopicManager` and updated editor tabs to use it with `TopicField`.
- 2026-07-21: Extracted shared post/thread image upload handling:
	- Added `useImageUploader` for editor image file selection, upload state, deletion/refund, and markdown copy behavior.
	- Added `UploadedImages` for the shared attached-image thumbnail strip.
	- Updated post and thread editors to use the shared image upload helpers while preserving their submit payloads and editor-specific UI.
- 2026-07-21: Renamed the unfinished album editor to the image editor and moved it onto `useImageUploader`/`UploadedImages` for shared upload handling.
- 2026-07-21: Confirmed drafts are post-only for now and removed no-op Drafts buttons/notices from thread, link, poll, image, and audio editors.
- 2026-07-21: Consolidated shared editor shell and auth:
	- Added `EditorFrame` for the common editor article/container/form/preview/footer structure.
	- Moved the `/editor` auth guard to the parent editor route.
	- Converted post, thread, link, poll, image, and audio editor tabs to use the shared frame while keeping their tab-specific forms, previews, footer actions, and submit logic local.
- 2026-07-21: Implemented editor parity pass for thread and sibling editor tabs:
	- Fixed `/editor` default tab from `posts` to `post`.
	- Added thread auth/content/topic validation, image upload plumbing, submit payload image IDs, and thread image rendering in previews/detail pages.
	- Fixed `MediaUploader` so its Upload button emits the declared `upload` event.
	- Brought link, poll, image, and audio editor pages onto the post-style shell with page-specific fields, previews, validation, upload actions where supported, and explicit unavailable-publishing notices for variants without create APIs.
- 2026-07-20: Reviewed current editor implementation. Documented remaining gaps: draft workflow, thread uploads/image display, auth/content validation, editor default route cleanup, and future mention/shared dropdown work.
- 2026-04-13: Ticket created.
