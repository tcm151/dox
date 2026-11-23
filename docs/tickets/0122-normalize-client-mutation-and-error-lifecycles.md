# Ticket 0122: Normalize Client Mutation And Error Lifecycles

## Status
- State: In Progress
- Priority: Medium
- Next: Inventory similar legacy mutations and migrate only confirmed lifecycle or error-interpretation inconsistencies.

## Goal
Apply the established try/catch/finally mutation lifecycle consistently to older interactive workflows. Make HTTP error interpretation reusable and type-safe while retaining existing hints, warnings, and request correlation.

## Requirements
- [x] Every touched mutation resets pending state on success, rejection, and unexpected failure.
- [x] Failed submissions retain user input and remain retryable without emitting success or closing the form.
- [x] Repeated activation while pending cannot issue duplicate requests from the affected controls or alternate submission paths.
- [ ] Shared error interpretation accepts unknown and consistently obtains the status and safe message without repeated any casts and property-chain variations.
- [x] Existing request IDs and original error objects reach the hint system where available.
- [ ] Expected 409/429 warning behavior and deliberate optional-feature fallback policies remain explicit rather than becoming generic errors.
- [x] Browser coverage checks feedback failure/retry, successful clearing, pending controls, and representative warning and request-correlation cases.

## Tasks
- [x] Repair the feedback submission lifecycle using the existing ButtonSpinner and hint conventions.
- [ ] Inventory similar legacy mutations and migrate only confirmed lifecycle or error-interpretation inconsistencies.
- [ ] Reuse or add a small HTTP-error reader at the existing request/hint boundary without creating a universal mutation framework.
- [ ] Replace duplicated status/message extraction in the affected workflows and preserve diagnostic context.
- [x] Add controlled failure and retry coverage.

## Notes
- Feedback.client.vue sets submitting before awaiting the request and only clears it afterward; a rejection bypasses that reset.
- The newer appeal submission flow resets state in finally, and ButtonSpinner disables its button while loading.
- Status extraction differs between post, gallery, thread, and topic-profile callers. useModeration.requestModerator also omits the original error when adding its hint.
- Ticket 0115 covers datasource read presentation, Ticket 0113 covers identity ownership, and Ticket 0114 covers draft cancellation.
- Keep feedback and report reasons plain text where they are rendered as plain text; this is not a Markdown conversion or visual redesign.

## Relevant Files
- app/components/system/Feedback.client.vue
- app/components/form/ButtonSpinner.vue
- app/pages/appeal/[id].vue
- app/utils/data.ts
- app/utils/hints.ts
- app/utils/moderation.ts
- app/pages/post/[id].vue
- app/pages/thread/[id].vue
- app/pages/gallery/[id].vue
- app/pages/topic/[topic]/tools/profile.vue
- tests/parallel/

## Progress Log
- 2026-11-18: Fixed the feedback submission lifecycle with an in-flight guard, error hint carrying the original request error, and a `finally` reset. Added browser coverage for empty-input warning, pending disablement, duplicate activation, retained text and request ID on a mocked failure, and successful retry/clearing. `feedback.browser.test.ts` passed 1/1 test and 9/9 including setup; editor diagnostics are clean. Other mutation lifecycles and shared error normalization remain open.
- 2026-11-17: Ticket created from the developer consistency review. Failure and retry behavior were not runtime-verified.
