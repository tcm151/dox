---
name: styling-conventions
description: "Use when building or refining ClassicForum Vue templates, HTML layout, responsive CSS, SCSS, spacing, colors, or shared style utilities. Documents established project conventions and where to verify them."
argument-hint: "Optional focus: page layout, component styling, forms, responsive behavior, or shared utilities"
---

# ClassicForum Styling Conventions

Use this skill to follow patterns already present in ClassicForum. It describes the current implementation, not a separate design system. When a rule is unclear or a component has a local pattern, inspect the nearest related component and the SCSS partial that owns the shared behavior.

## Workflow

1. Read the nearest Vue component and identify the shared classes it already uses.
2. Check the owning stylesheet below before adding a new utility or duplicating a global rule.
3. Compose existing layout, spacing, and semantic classes first. Add component-scoped SCSS only for behavior that is specific to that component.
4. Follow nearby markup structure and responsive patterns. Check the rendered UI at the relevant viewport sizes when changing layout.

## HTML And Vue Layout

- Use semantic elements for their structural role: `main`, `section`, `article`, `header`, `footer`, `nav`, and `aside` are common in templates.
- The default layout already supplies `main.page`; pages commonly place their content in an `article` or `section` within it. See `app/layouts/default.vue` and `app/pages/admin/reports.vue`.
- Lists commonly use a `section` with `column` and a gap utility, then one repeated semantic item per record. Feed and preview components show established examples.
- Prefer the existing layout classes over one-off flex declarations. Add wrappers when they establish structure or contain a real styling responsibility, not just to mirror the DOM hierarchy.

## Layout Utilities

Defined in `app/assets/scss/_layout.scss`:

- `.row` and `.column` are flex containers, both defaulting to `nowrap`.
- `.row.wrap` wraps its flex items and also sets `white-space: nowrap`; account for that when it contains text that needs to wrap.
- `.center` centers on both axes; `.inline` aligns items; `.block`, `.between`, `.around`, `.start`, `.end`, and `.stretch` set justification behavior. These modifiers apply to `.row` and `.column` as defined in the partial.
- `.grid` creates a grid container; `.grid.center` centers its content.
- `.f-0` through `.f-9` and `.f-max` set `flex-grow`. `.b-*` utilities set flex basis. `.br-none`, `.br-small`, `.br-medium`, and `.br-large` set border radius.

Spacing utilities are generated in `app/assets/scss/_spacing.scss`:

- Use `.g-*`, `.gr-*`, and `.gc-*` for gap, row gap, and column gap.
- Use `.m-*` and `.p-*` for margin and padding. Directional forms include `.mt-*`, `.pr-*`; axis forms include `.mx-*`, `.py-*`.
- The shared size map is `0`, `1`-`8`, and `auto`. Numeric values are `0`, `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `3rem`, `5rem`, and `10rem` for `1`-`8` respectively.

## Shared Elements And Content

Defined mainly in `app/assets/scss/_defaults.scss` and `_elements.scss`:

- `.box` is the common framed surface; `.box.background` uses the shared background color. `.tag` is the common compact label style.
- Color/state classes include `.light`, `.dark`, `.positive`/`.success`, `.warning`/`.misleading`, `.negative`/`.danger`, `.topic`/`.link`, and `.info`. Use the established class or component API rather than copying its color declarations.
- Buttons have global base, hover, focus-visible, and disabled behavior. Existing variants include `.small`, `.inverted`, and `.selected`.
- Use `.field` for form controls so input, textarea, select, placeholder, focus, and disabled styles stay consistent. `.field.row`, `.field.invalid`, and `.field-small` are defined variants.
- `.content` styles rendered rich text and Markdown; `.content.preview` adjusts its outer spacing. Use these classes on rendered content instead of rebuilding Markdown element styles locally.
- Text helpers include `.text.bold`, `.text.truncate`, `.text.break`, `.text.center`, `.text.left`, `.text.right`, and `.text.capitalize`.

Colors and responsive tokens live in `app/assets/scss/_colors.scss`. Reuse its SCSS variables instead of introducing near-duplicate color or breakpoint values. The current breakpoints are `$bp-compact` (400px), `$bp-mobile` (425px), `$bp-mobile-wide` (500px), `$bp-tablet` (600px), `$bp-laptop` (800px), and `$bp-desktop` (1000px).

## Component SCSS

- Shared rules are forwarded through `app/assets/scss/global.scss`. Put a rule there only when it is genuinely shared across the application or owns global rendered content.
- Most Vue components use `<style scoped lang="scss">`. Nest selectors under a meaningful component root class to keep component styling contained; see `app/components/system/previews/ThreadPreview.vue`.
- Shared mixins in `_mixins.scss` include `fit-width($width, $padding)` and the `flex-v`, `flex-vw`, `flex-h`, `flex-hw`, and `shadow` helpers. Page wrappers commonly use `fit-width` to set a maximum content width with side padding.
- Use the existing `$bp-*` tokens for media queries where they fit. Component styles commonly nest media queries under the selector they affect; see `app/components/lists/Feed.vue`.
- Use `:deep(...)` only when scoped styles must reach into a child component, and `:slotted(...)` for slotted content. Existing examples include `app/components/text/Codeblock.vue`, `app/components/lists/Tree.vue`, and `app/components/lists/Feed.vue`.
- Dynamic inline styles are used for runtime values; keep ordinary visual rules in SCSS.

## Source Files

- `app/assets/scss/global.scss`: shared stylesheet entry point and forwarded partials.
- `app/assets/scss/_layout.scss`: flex/grid and flex sizing utilities.
- `app/assets/scss/_spacing.scss`: spacing utility generation and size map.
- `app/assets/scss/_defaults.scss`: base elements, forms, typography, and rendered content.
- `app/assets/scss/_elements.scss`: surfaces, state colors, tags, and tab strips.
- `app/assets/scss/_colors.scss`: color tokens and breakpoints.
- `app/assets/scss/_mixins.scss`: shared SCSS mixins.