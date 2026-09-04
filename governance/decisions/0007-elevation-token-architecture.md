# 0007: Elevation token architecture — Effect Styles, shared shadow-color vocabulary, DTCG shadow composites

- **Status**: Accepted
- **Date**: 2026-09-05

## Context

The Elevation/Shadow Foundation follows the same Figma-first process as spacing and
radius, but structurally it's closer to typography than to color/space/radius: Figma has
no shadow-type Variable, so the semantic tier can't be "Variables aliasing Variables" —
it has to be Figma's native shadow token unit, an **Effect Style** (the same divergence
typography has with Text Styles — see 0003).

Two more decisions were needed that didn't come up in earlier foundations:

1. **Shadow color participates in the existing Semantic Color system, not a
   foundation-local palette.** The approved proposal explicitly rejected baking literal
   RGBA into every Effect Style, specifically so shadow color could benefit from future
   Light/Dark and multi-brand theming the same way every other semantic color does.
2. **The primitive/semantic vocabulary uses two different words** (`shadow.*` for raw
   geometry, `elevation.*` for the semantic role) rather than reusing one word like
   color/space/radius do. This was a deliberate choice flagged in the original proposal,
   partly to sidestep the kind of primitive/semantic name collision radius hit (0006).

## Decision

- **Same primitive→semantic split as every other foundation, but the semantic tier is
  Figma Effect Styles, not Variables** (mirrors typography's Text Style pattern, not
  color/space/radius's Variable-aliases-Variable pattern). In code this has no equivalent
  distinction — both tiers are still plain JSON token files — but it's the reason the
  Figma-side implementation looked different from every foundation except typography.
- **Primitive shadow geometry (`src/tokens/primitive/shadow.json`) is four separate
  scalar leaf tokens per step** (`shadow.<step>.offset-x/offset-y/blur/spread`), not one
  composite — consistent with the rule, true of every primitive in every foundation so
  far, that primitives are scalar values with no meaning attached; composites only ever
  appear at the semantic tier (typography's role tokens, now elevation's role tokens
  too). This also matches the Figma primitive shape exactly: 20 separate FLOAT
  Variables, not a single shadow-shaped Variable (which doesn't exist as a type).
- **Semantic elevation roles (`src/tokens/semantic/elevation.json`) are DTCG
  `$type: "shadow"` composite tokens**, aliasing the primitive geometry and a new
  Semantic Color shadow role for `color`. This activates Style Dictionary's built-in
  `shadow/css/shorthand` transform, present in this repo's `css` platform transform list
  since the very first config but unused until now. Unlike typography's `font`
  shorthand (lossy — drops letter-spacing, forcing a custom format in 0003), CSS's
  `box-shadow` shorthand losslessly represents every field a DTCG shadow token has, so
  **no custom format was needed** — the built-in `css/variables` format handles the
  already-stringified value correctly.
- **`elevation.flat`'s `$value` is the literal string `"none"`, not a zero-valued shadow
  object.** This exactly mirrors the Figma side (`Elevation/Flat` has an empty `effects`
  array, not a shadow with all-zero fields) and produces the more correct, more
  idiomatic CSS output `--elevation-flat: none;` rather than a syntactically-valid but
  pointless `0 0 0 0 rgba(0,0,0,0)`. Style Dictionary's `shadow/css/shorthand` transform
  explicitly supports a plain string `$value` for exactly this case (passes it through
  unchanged when the value isn't an object) — this isn't a workaround, it's a shape the
  transform already anticipates.
- **Shadow color lives in `src/tokens/semantic/color.json`, not a new file.** Three new
  entries — `color.shadow.subtle/default/strong` — alongside `surface`/`text`/`border`/
  etc., each aliasing a new primitive: `color.overlay.subtle/default/strong` in
  `src/tokens/primitive/color.json`. The primitive is deliberately named `overlay`, not
  `shadow` — it's alpha-blended black with no shadow-specific meaning, and naming it
  generically means a future `surface.overlay` (modal scrim) token, explicitly deferred
  in 0002 for lack of a real consumer, can reuse this same primitive scale for free
  instead of needing its own alpha-color work later.
- **Geometry stays px in both source and CSS output — never rem.** Same reasoning as
  radius (0006): shadow offset/blur/spread are visual geometry, not something that
  should scale with the user's root font-size preference. A new `size/shadow-px`
  transform (mirroring `size/radius-px` exactly) pre-formats bare-number shadow geometry
  as an explicit `"Npx"` string before the built-in `size/rem` transform runs, so
  `size/rem` passes it through unchanged instead of corrupting it. This also has a
  second purpose specific to shadow: `shadow/css/shorthand`'s internal DTCG-dimension
  normalizer preserves a unit if one is already present on a resolved reference, but
  does not add one to a bare number — so without `size/shadow-px` running first, the
  generated `box-shadow` would be missing units entirely (`0 1 2 0 rgba(...)` instead of
  `0 1px 2px 0 rgba(...)`), not just wrongly scaled.
- **No primitive/semantic path collision, unlike radius.** Audited directly: `shadow.*`
  (geometry) and `color.overlay.*` (new color primitive) sit in different root
  namespaces from `elevation.*` (semantic role) and `color.shadow.*` (semantic color) —
  no token in this foundation needed a radius-style renamed exception.

## Consequences

- A future `Dark` mode on the `Semantic Color` collection (deferred, same as every other
  color foundation) will need real design work for shadow specifically, not just a
  value flip: pure black shadows are nearly invisible on dark surfaces. `color.shadow.*`
  is positioned to make that a value-only change (new mode value, same token names,
  zero Effect Style or component changes) whenever that work happens — but *what* the
  right dark-mode shadow treatment is (darker black, a light glow tint, a surface-tint
  elevation approach) is not decided here.
- Any future composite-token category hitting the same "primitive vs. semantic needs
  different words" question, or the same "does the built-in shorthand transform lose
  data" question, should check this ADR and 0003 before re-deriving the answer.
- `size/shadow-px` is now the third near-identical custom size transform
  (`size/px-to-rem`, `size/radius-px`, `size/shadow-px`). If a fourth px-only geometry
  category shows up, consider whether a shared helper is worth the indirection — not
  done here, since three explicit, independently-readable transforms is still cheap
  cognitive overhead versus premature abstraction.
