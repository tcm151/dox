# Ticket 0121: Unify Shared Validation Rules And Boundaries

## Status
- State: In Progress
- Priority: Medium
- Next: Share the existing username rule between the UI and Validator, then add the same check to the profile-update handler before writes.

## Goal
Keep client feedback and server input validation aligned through shared pure rules and consistent Validator usage. Bring older profile and content edit handlers up to the explicit validation convention used by newer settings, link, and gallery workflows.

## Requirements
- [ ] Repeated username, email, password, title, description, topic, and record-ID rules have one application-side definition reused by UI checks and Validator where their policies match.
- [ ] Different domain policies remain explicit rather than being merged merely because their current expressions look similar.
- [ ] Older profile and post/thread/comment edit handlers validate their accepted input fields before writes using Validator.
- [ ] Invalid inputs produce field-specific validation errors without relying on a TypeScript annotation or an incidental database failure.
- [ ] Known request bodies remain properly typed; endpoint-specific body-presence boilerplate is not added as a substitute for shared middleware policy.
- [ ] Tests cover invalid types, optional versus null values, whitespace, and exact accepted/rejected length boundaries.
- [ ] Intended accepted values are preserved; any deliberate tightening relative to current server behavior is separately identified, documented, and tested.

## Tasks
- [ ] Compare useValidation, Validator's named rules, affected UI checks, and schema assertions before choosing the intended rules.
- [ ] Reuse existing validation modules to share pure predicates or constants without introducing another validation framework.
- [ ] Make Validator consume the same applicable rules as UI predicates.
- [ ] Add explicit field validation to the bounded legacy profile and content-edit handlers.
- [ ] Add focused shared-rule and endpoint tests and update changed API validation contracts.

## Notes
- Commit `5576792a` aligns the named topic-ID rule with the topic name accepted by publishing UI and adds a search regression. The common rule is still expressed separately in Validator and `shared/utils/validation.ts`; the rest of the rule inventory is open.
- The profile update and post/thread/comment edit handlers still parse typed bodies without explicit field validation. Profile update now also enforces a rename cooldown; preserve that workflow and its conflict response while validating fields.
- The account form and Validator both express the 3-32 character username rule, and the schema also asserts that format. Reuse the application rule in both places without moving username availability or the 30-day rename cooldown into the field validator.
- The description limit is 256 characters in the UI and Validator, but the profile schema declares only an optional string. The profile link is also an optional string, with no URL check in this form. Adding an API description limit or a URL restriction would change what the endpoint accepts. Check omitted, empty, and null behavior before adding optional-field validation; do not silently tighten it.
- UI-only limits and database assertions are not necessarily equivalent; this ticket must not silently change policy while extracting helpers.
- Input validation complements database constraints. Stored-schema changes, if genuinely required by an agreed policy, need their own schema/migration review.
- Ticket 0055 covers database-error classification, not a second definition of input rules.

## Relevant Files
- shared/utils/validation.ts
- shared/utils/Validator.ts
- shared/utils/records.ts
- server/api/profile/update.ts
- server/api/post/[id]/edit.ts
- server/api/thread/[id]/edit.ts
- server/api/comment/[id]/edit.ts
- server/api/gallery/[id]/edit.ts
- server/api/link/[id]/edit.ts
- tests/parallel/validator.server.test.ts
- tests/parallel/search.server.test.ts
- docs/API.md

## Progress Log
- 2026-11-27: Compared the account form, Validator, update handler, and schema. Username format is the first shared rule; description length and link format are separate policy decisions for the API. No behavior changes or runtime checks were made.
- 2026-11-27: Recorded the topic-boundary change and regression in source. Shared predicate reuse and the legacy handler checks remain open; tests were not run.
- 2026-11-17: Ticket created from the developer consistency review. Validation and persistence behavior were not executed.
