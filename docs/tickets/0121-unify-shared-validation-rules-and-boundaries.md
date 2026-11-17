# Ticket 0121: Unify Shared Validation Rules And Boundaries

## Status
- State: Planned
- Priority: Medium
- Next: Inventory duplicate UI and Validator rules and record their current acceptance boundaries.

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
- shared/utils/validation.ts and Validator currently duplicate username, password, email, title, description, and topic expressions.
- The profile update and post/thread/comment edit handlers parse typed bodies but omit the explicit field-validation step used by link and gallery edits.
- UI-only limits and database assertions are not necessarily equivalent; this ticket must not silently change policy while extracting helpers.
- Input validation complements database constraints. Stored-schema changes, if genuinely required by an agreed policy, need their own schema/migration review.
- [0055](0055-consistent-database-error-mapping.md) covers database-error classification, not a second definition of input rules.

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
- docs/API.md

## Progress Log
- 2026-11-17: Ticket created from the developer consistency review. Validation and persistence behavior were not executed.
