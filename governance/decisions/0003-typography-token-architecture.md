# 0003: Typography token architecture — composite semantic roles, custom CSS output

- **Status**: Accepted (amended 2026-09-04 — see Amendment below)
- **Date**: 2026-09-02

## Context

The Typography Foundation follows the same primitive→semantic split as color
([0002](./0002-color-token-architecture.md)), but typography tokens are composite
(family + size + weight + line-height + letter-spacing together), not a single value.
This raises two questions color didn't: how a composite semantic token should be
represented in code and in Figma, and whether the existing Style Dictionary config could
generate correct CSS output for it unmodified.

## Decision

- **Semantic typography tokens are DTCG composite `$type: "typography"` tokens**
  (`src/tokens/semantic/typography.json`), not five separate semantic tokens per role.
  Each sub-value aliases a primitive in `src/tokens/primitive/typography.json` — same
  alias-only rule as color, applied per sub-property.
- **Semantic roles are a role × size × weight matrix, no component-specific roles** —
  matching the color foundation's "no token without a real consumer" discipline. The
  initial shape (8 roles, one weight each) was superseded 2026-09-04 by a 35-role matrix;
  see Amendment below. The "no component-specific tokens" constraint is unchanged by that
  amendment.
- **Font size in rem, line-height unitless, letter-spacing in em** — each chosen so the
  value scales correctly with user font-size preferences (rem) or the element's own font
  size (unitless/em), not left as an implementation detail.
- **Style Dictionary's `css` platform was modified**: the built-in `css/variables` format
  collapses composite typography tokens into a CSS `font` shorthand, which has no slot
  for letter-spacing — confirmed by Style Dictionary's own build warning. Fixed with (a)
  a custom `css/typography-expanded` format that emits one longhand custom property per
  sub-value, and (b) removing `typography/css/shorthand` from the platform's transform
  list, since that transform runs before any per-file `filter` and would have corrupted
  the value before the custom format ever saw it. Every other transform in the `css`
  platform is unchanged.
- **Figma has no semantic-tier Variables for typography** (unlike color). A composite
  role has no single-value Variable representation; the semantic layer in Figma is a
  **Text Style** per role, with its properties bound directly to Primitive variables.
  This is a deliberate divergence from the color pattern, not an oversight — full
  rationale in `docs/foundations/typography.md`.

## Consequences

- `src/tokens/build/css/` now has two files instead of one: `variables.css` (colors +
  typography primitives) and `typography.css` (the 8 expanded roles). A consumer needs
  both, and combines the five longhand properties per role into whatever shorthand or
  individual CSS properties a component needs — there's no single custom property
  equivalent to a Figma Text Style.
- Any future composite token category (e.g. shadows, if elevation tokens are added later)
  will hit the same shorthand-collapsing behavior and should reuse this same fix pattern
  rather than rediscovering it.
- When Figma variables/styles are created for this foundation, the workflow differs from
  color's (Variables aliasing Variables) — it's Primitive variables + Text Styles. Anyone
  implementing it should not assume the color pattern transfers unchanged.

## Amendment (2026-09-04): 8 roles → 35-role matrix

The original 8-role shape (one weight per role) undersupplied real UI needs — most
products need at least two weight options per heading/body/label step. This was
reconsidered and expanded to a **35-role matrix** (`role.size.weight`): heading 4×2,
body 3×4, label 3×3, caption 2×2, code 2×1. Full table in
`docs/foundations/typography.md`.

Everything else this ADR decided is unchanged and still governs the 35-role shape:

- Composite `$type: "typography"` tokens, alias-only sub-values — still true, just more
  of them.
- The custom `css/typography-expanded` Style Dictionary format and the removal of
  `typography/css/shorthand` from the `css` platform transforms — unchanged; the format
  is shape-agnostic and required no code changes to support the larger matrix.
- Figma has no semantic-tier Variables for typography; the semantic layer is a Text Style
  per role — unchanged, now 35 Text Styles instead of 8.
- **New finding, confirmed by direct testing in Figma**: `TextStyle.setBoundVariable`
  accepts `'lineHeight'` and `'letterSpacing'` as bindable fields without throwing, but
  silently coerces the bound variable's raw number from the intended `PERCENT` unit to
  `PIXELS` — turning a variable meant as "125%" into a literal 125px line-height. This is
  why `font.lineHeight.*`/`font.letterSpacing.*` primitives exist as aliases in code but
  are deliberately never bound to Figma Text Style properties — those two fields are set
  as literal `PERCENT` values on every style instead. This was not verified empirically
  when this ADR was first accepted; it is now.
- Process: the 35-role matrix was designed, approved, and migrated in Figma **first**
  (retiring both the old 8 semantic styles and an intermediate 8-style non-semantic
  "utility ladder" that existed briefly in the Figma file only), then mirrored into
  `src/tokens/semantic/typography.json` and rebuilt. This is consistent with this
  project's Figma-first source-of-truth stance for foundations work — see
  `docs/foundations/typography.md` for the full migration/equivalence table from the old
  8 roles to their new 35-role successors.
