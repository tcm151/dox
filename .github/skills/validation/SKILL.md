---
name: validation
description: "Use when validating request bodies or other inputs with the ClassicForum Validator class."
argument-hint: "Optional focus: fields, arrays, nested objects, or custom rules"
---

# Request Validation

Use `shared/utils/Validator.ts` for runtime input validation before side effects.

## Direct Fields

- `readBody<T>()` supplies a TypeScript type; it does not validate runtime values.
- Validate top-level fields directly. Reserve `.object()` for nested objects, except when an endpoint must reject a non-object payload before field access.
- Chain `.string()`, `.boolean()`, `.number()`, and `.integer()` with field names. Integer bounds use `{ min, max }`.
- Chain `.notEmpty(value, field)` after string or array validation when empty values are not allowed.
- Use `.optional(value, callback)` for optional fields. It skips only `undefined`; validate `null` when the field is present.
- Prefer an inline fluent chain for unconditional top-level checks. Use a named validator when checks are conditional or need reuse.
- Name Validator callback parameters `v`. Name the tested value for its field when possible, such as `t` for title or `m` for mode; avoid generic names like `x`.
- Inside `.array()` and `.object()` callbacks, put each validation on its own statement instead of chaining checks. Callbacks inherit the scoped field path, so omit the field argument when checking the item itself.
- Call `.confirm()` once after all checks and before database writes or other side effects.

```ts
new Validator("TopicPin")
    .boolean(body.active, "active")
    .integer(body.priority, "priority", { min: 0, max: 10 })
    .confirm()
```

## Custom Rules

- Use `.test(value, predicate, message, field?)` only for one-off rules. Prefer reusable methods such as `.in()` and `.url()` when they fit.
- Use `.match(value, rule, field?)` for a named pattern registered on `Validator`; use `.regex(value, /pattern/, field?)` for a custom regular expression.
- Use `.in(value, allowedValues)` inside a scoped callback; use `.in(value, field, allowedValues)` for a top-level field.
- Checks accumulate; they do not stop after the first error. Make predicates safe for invalid input types.
- `.test()` and `.match()` accept an optional field name; nested callbacks inherit their scoped path.
- Use `.array(value, "field", (v, item) => ...)` to validate each item. Optional arrays should only be checked when provided.
- Use `.optional(value, callback)` to apply normal field or array checks only when a value is present.
- Use `.object(value, "field", (v, x) => ...)` for nested objects. Its callback scopes errors to that object's path.

## Extending Validator

- Keep one-off domain rules in `.test()`. When a missing rule is useful across routes, add a reusable method or option to `shared/utils/Validator.ts` instead of repeating predicates.
- Follow existing field-path and error-message behavior. Reusable checks must handle unknown input safely.
- Add focused tests for new reusable rules, including invalid types and boundary cases where relevant.

## Errors

- Call `.confirm()` once after completing validation. It throws a 400 error with all accumulated messages.
- Keep authentication, authorization, and database-state checks in their existing route or transaction paths; `Validator` checks input shape and values.
