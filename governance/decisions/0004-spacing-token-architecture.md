# 0004: Spacing token architecture — Figma-first, category-first naming, px source

- **Status**: Accepted
- **Date**: 2026-09-04

## Context

The Spacing Foundation follows the same primitive→semantic split as color
([0002](./0002-color-token-architecture.md)) and typography ([0003](./0003-typography-token-architecture.md)),
but two things made it different from both:

1. It was built **Figma-first**: the primitive and semantic Variables were created and
   approved in the production design-system Figma file before any code existed, then
   mirrored into `src/tokens/`. Color and typography went code-first (color) or
   design-first-for-the-role-matrix-only (typography); spacing is the first foundation
   where the full primitive→semantic structure originated in Figma.
2. While reorganizing the Figma file for scalability (still before code existed), the
   variable naming convention changed from bare-category grouping (`gray/500`,
   `surface/canvas`, `inset/md`) to **category-first grouping** (`color/gray/500`,
   `color/surface/canvas`, `space/inset/md`) — every primitive and semantic path now
   starts with its token category (`color/…` or `space/…`; typography Variables were
   left untouched, still `font/…`, which is already category-first).

## Decision

- **Same primitive→semantic architecture as color/typography**: primitives
  (`src/tokens/primitive/spacing.json`, scale-named, no meaning) and semantics
  (`src/tokens/semantic/spacing.json`, role-named, alias primitives via `{space.x}`
  references). No raw pixel values are duplicated in the semantic layer.
- **Hybrid 4px/8px rhythm, capped at 64px for V1**: `space.none` (0) through
  `space.5xl` (64) — see full table in `docs/foundations/spacing.md`. No 80px/96px step
  yet; add one deliberately when a real layout need appears, not speculatively.
- **Four semantic categories, not a full primitive × category cross product**:
  `space.inset.*` (padding), `space.stack.*` (vertical gap), `space.inline.*`
  (horizontal gap), `space.layout.*` (page/region-level spacing). Each category only
  gets the aliases it actually has a use for — `inline` stops at 16px (`lg`), `layout`
  never goes below 24px (`sm`) — matching the same "no token without a real semantic
  use" discipline color and typography already follow.
- **Code naming now mirrors Figma's category-first structure**: every path starts with
  its category. This was already true for color and typography in code (both source
  files are wrapped in a root `color`/`font` key, e.g. `color.surface.canvas`,
  `font.size.md`) — **no migration was needed there**, only spacing's own files needed
  to be authored this way from the start (`space.none`, `space.inset.md`, etc.). The
  audit performed when this ADR was accepted confirmed code and Figma naming already
  have 1:1 parity for every existing foundation.
- **Source values stay in px, as bare numbers, DTCG `$type: "dimension"`.** Unlike
  typography (which pre-converts font sizes to rem *strings* directly in source — see
  0003), spacing keeps raw px numbers as the design-side value model, matching the
  approved proposal's explicit instruction not to treat rem as the design/naming layer.
- **Style Dictionary needed two build-time fixes to make this work correctly**, both in
  `style-dictionary.config.mjs`:
  - A custom `size/px-to-rem` transform, inserted before the built-in `size/rem` in the
    `css` platform. The built-in `size/rem` transform does **not** scale a bare number —
    it only appends a unit, or passes an already-unitted value through unchanged. That's
    exactly what typography's pre-formatted rem strings rely on, but it means a bare px
    number like `16` would come out as the CSS custom property `16rem`, not `1rem`, if
    left to `size/rem` alone. The custom transform does the actual division
    (`px / basePxFontSize`) for any bare-number dimension token (checked against
    `token.original.$value`, not the mutated in-flight value) before `size/rem` runs —
    at which point `size/rem` just passes the already-unitted result through, same as it
    does for typography.
  - The `js` platform's transform list was changed from the `js` transformGroup preset
    to an explicit list with `size/rem` dropped. The preset includes `size/rem`, which
    has the same append-only behavior — harmless for typography's JS output (already
    rem strings, so it's a no-op) but would have corrupted spacing's raw px numbers
    (`4` → `"4rem"`) in `tokens.js`. JS/TS consumers now get plain px numbers
    (`SpaceMd = 16`), matching the approved proposal's "preserve px source values" and
    "do not treat rem as the design-side value model" instructions. Only the CSS
    platform emits rem.
- **`GAP` is the only Figma scope used** for both primitive and semantic spacing
  Variables (matches padding and gap/itemSpacing pickers) — no `WIDTH_HEIGHT` scope,
  since no component-specific sizing tokens exist in this foundation.

## Consequences

- Any future foundation (radius, sizing, elevation, etc.) should default to
  category-first naming and a bare-number px/dimension source value from the start,
  reusing the `size/px-to-rem` transform pattern rather than rediscovering it — the
  filter is generic (`$type === 'dimension'` + bare-number `token.original.$value`), not
  hardcoded to spacing.
- The `js` platform config no longer uses the `js` transformGroup preset — anyone
  changing that platform's output later needs to keep this in mind and re-derive the
  explicit transform list (`attribute/cti`, `name/pascal`, `color/hex`) rather than
  reverting to the preset, or the spacing-corruption bug returns.
- Figma-first is now a proven workflow for this project (design a foundation and get it
  approved in Figma, iterate on naming/organization there, only then mirror to code) —
  worth defaulting to for future foundations, consistent with typography's 35-role
  matrix migration process noted in 0003.
