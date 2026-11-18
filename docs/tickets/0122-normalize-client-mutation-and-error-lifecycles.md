# Ticket 0122: Normalize Client Mutation And Error Lifecycles

## Status
- State: Planned
- Priority: Medium
- Next: Add a rejected feedback-submission case that verifies the form becomes usable again.

## Goal
Apply the established try/catch/finally mutation lifecycle consistently to older interactive workflows. Make HTTP error interpretation reusable and type-safe while retaining existing hints, warnings, and request correlation.

## Requirements
- [ ] Every touched mutation resets pending state on success, rejection, and unexpected failure.
- [ ] Failed submissions retain user input and remain retryable without emitting success or closing the form.
- [ ] Repeated activation while pending cannot issue duplicate requests from the affected controls or alternate submission paths.
- [ ] Shared error interpretation accepts unknown and consistently obtains the status and safe message without repeated any casts and property-chain variations.
- [ ] Existing request IDs and original error objects reach the hint system where available.
- [ ] Expected 409/429 warning behavior and deliberate optional-feature fallback policies remain explicit rather than becoming generic errors.
- [ ] Browser coverage checks feedback failure/retry, successful clearing, pending controls, and representative warning and request-correlation cases.

## Tasks
- [ ] Repair the feedback submission lifecycle using the existing ButtonSpinner and hint conventions.
- [ ] Inventory similar legacy mutations and migrate only confirmed lifecycle or error-interpretation inconsistencies.
- [ ] Reuse or add a small HTTP-error reader at the existing request/hint boundary without creating a universal mutation framework.
- [ ] Replace duplicated status/message extraction in the affected workflows and preserve diagnostic context.
- [ ] Add controlled failure and retry coverage.

## Notes
- Feedback.client.vue sets submitting before awaiting the request and only clears it afterward; a rejection bypasses that reset.
- The newer appeal submission flow resets state in finally, and ButtonSpinner disables its button while loading.
- Status extraction differs between post, gallery, thread, and topic-profile callers. useModeration.requestModerator also omits the original error when adding its hint.
- [0115](0115-distinguish-feed-loading-error-and-empty-states.md) covers datasource read presentation, [0113](completed/0113-isolate-account-preference-request-state.md) covers identity ownership, and [0114](completed/0114-discard-cancelled-inline-content-edits.md) covers draft cancellation.
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
- 2026-11-17: Ticket created from the developer consistency review. Failure and retry behavior were not runtime-verified.
