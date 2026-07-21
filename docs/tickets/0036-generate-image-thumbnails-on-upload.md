# Ticket 0036: Generate Image Thumbnails On Upload

## Status
- State: Todo
- Priority: Medium
- Next action: Decide the thumbnail derivative size, format, and storage path convention for uploaded images.

## Goal
Generate a small thumbnail derivative when an image is uploaded so preview-only views can load a lighter asset instead of the full image. This should reduce page load time and bandwidth for feeds, search results, and other thumbnail-sized image displays.

## Done Looks Like
- [ ] Image uploads create both the display image and a smaller thumbnail derivative using the existing Sharp-based processing flow.
- [ ] Image records expose a thumbnail URL or equivalent field without breaking existing consumers of `url`.
- [ ] Preview-only UI surfaces render the thumbnail asset while full image/detail views continue to use the full image.
- [ ] Deleting or rolling back an image also removes any generated thumbnail file and does not leave orphaned media.

## Tasks
- [ ] Extend server media processing to produce a thumbnail buffer for image uploads, including animated/unsupported format handling decisions.
- [ ] Persist thumbnail files under a predictable CDN path and update image schema/types to expose the thumbnail URL.
- [ ] Update image upload creation to save the thumbnail after the image record is created and roll back cleanly on write failures.
- [ ] Switch feed/post/image preview components that show small previews to use the thumbnail URL with a full-size fallback.
- [ ] Add focused coverage or manual verification for upload, thumbnail serving, preview rendering, and delete cleanup.

## Notes
- Current image processing already uses Sharp in `server/utils/media.ts`, so thumbnail generation should likely live near the existing image handlers.
- The current image schema computes only `url`; a new computed `thumbnailUrl` or stored derivative metadata will be needed.
- The exact thumbnail dimensions and output format are not specified. A small bounded derivative, such as WebP/JPEG at a fixed max width, should be chosen before implementation.
- Animated GIF behavior needs an explicit decision: generate a static poster thumbnail, an animated thumbnail, or fall back to the original.

## Relevant Files
- server/utils/media.ts
- server/api/image/upload.ts
- server/api/image/[id]/delete.ts
- server/assets/schema.surql
- server/assets/migrations.surql
- shared/types/index.ts
- app/components/system/previews/ImagePreview.vue
- app/components/system/previews/PostPreview.vue

## Progress Log
- 2026-07-21: Ticket created.
