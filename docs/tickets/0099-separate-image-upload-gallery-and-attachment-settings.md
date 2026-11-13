# Ticket 0099: Separate Image Upload, Gallery, and Attachment Settings

## Status
- State: Planned
- Priority: Medium
- Next: Define setting names, defaults, and interactions for image uploads, galleries, and post/thread attachments.

## Dependencies
- [0100](0100-strict-appsettings-schema.md): Establish the strict AppSettings schema before adding image-policy fields.

## Goal
Give admins independent control over image uploads, gallery publishing, and attaching images to supported submission types without conflating those policies with gallery feed visibility.

## Requirements
- [ ] Admin settings independently control image uploads, gallery publishing, and image attachments to posts and threads; replies follow the post setting.
- [ ] Editor controls reflect each setting, and server APIs enforce it for direct requests as well as normal UI workflows.
- [ ] Existing galleries and image attachments remain viewable when a related publishing or attachment setting is disabled.
- [ ] AppSettings types, defaults, validation, schema, and migration stay consistent for fresh and existing installations.
- [ ] Tests cover enabled and disabled behavior at the relevant API boundaries.

## Tasks
- [ ] Define setting names, defaults, and interactions, keeping gallery feed visibility separate from gallery publication.
- [ ] Update the shared settings contract, defaults, admin controls, server validation, schema, and migration.
- [ ] Update editor affordances and enforce upload, gallery-publish, and post/thread-attachment settings in server workflows.
- [ ] Add focused settings and API tests for each policy.

## Notes
- Current `media.images.enabled` hides the image editor tab and is enforced by the image upload utility; the admin description also says it allows gallery publishing, but the gallery publish endpoint does not check it.
- `feeds.images` controls gallery visibility in feeds, not whether galleries can be published.
- Posts and threads store image attachments and their editors use the shared image uploader. Replies are posts. Comments currently have no image attachment field and are outside this ticket's initial scope.
- Preserve visibility of already-published content and existing attachments when disabling creation or attachment workflows.
- Add image-policy fields to the strict AppSettings schema established by Ticket 0100.

## Relevant Files
- shared/types/index.ts
- app/utils/settings.ts
- app/pages/admin/settings.vue
- server/utils/SettingsManager.ts
- server/assets/schema.surql
- server/assets/migrations/
- app/pages/editor.vue
- app/pages/editor/image.vue
- app/pages/editor/post.vue
- app/pages/editor/thread.vue
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/gallery/publish.ts
- server/api/post/add.ts
- server/api/thread/add.ts
- tests/parallel/settings.server.test.ts

## Progress Log
- 2026-11-13: Ticket created.