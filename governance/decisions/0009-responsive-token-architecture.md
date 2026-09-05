# 0009: Responsive/breakpoint token architecture — px-only viewport scale, single container cap, no new grid tokens

- **Status**: Accepted
- **Date**: 2026-09-05

## Context

The Responsive/Breakpoint Foundation was built Figma-first: three primitive
`viewport/*` Variables (768/1024/1280) and a new `Semantic Layout` collection holding
`container/maxWidth`, plus three named Figma Grid Styles (`Grid/Compact`, `Grid/Medium`,
`Grid/Wide`) for margin/column/gap guidance. Two things make it different from every
prior foundation:

1. **The semantic token's root key doesn't match its primitive's root key.** Every prior
   foundation aliases within its own category (`radius.control` → `radius.sm`, both
   `radius.*`; `space.inset.md` → `space.xs`, both `space.*`). Here, `layout.container.
   maxWidth` (root `layout`) aliases `viewport.xl` (root `viewport`) — a deliberate
   result of treating "viewport breakpoint thresholds" and "layout decisions that use
   those thresholds" as different concerns, matching the approved Figma architecture's
   explicit separation (`viewport/*` = thresholds only; `layout/container/maxWidth` =
   the one derived decision; `space/layout/*` = page gutters, unchanged).
2. **Most of the approved design reuses other foundations instead of creating tokens of
   its own.** Page margin per breakpoint reuses `space.layout.*` (0004) exactly as
   before. Grid internal-gap per breakpoint reuses the primitive spacing scale directly
   (`space.md`, `space.xl`), matching the live variable bindings already approved in the
   three Figma Grid Styles. Only `layout.container.maxWidth` is a genuinely new token.

## Decision

- **Primitive**: `src/tokens/primitive/viewport.json` — `viewport.md` (768),
  `viewport.lg` (1024), `viewport.xl` (1280). Raw `$type: "dimension"` numbers matching
  Figma exactly, same shape as every other primitive scale. No `viewport.sm` — deferred
  deliberately (see `docs/foundations/responsive.md`), not an oversight.
- **Semantic**: `src/tokens/semantic/layout.json` — **one token only**,
  `layout.container.maxWidth`, aliasing `{viewport.xl}`. Not a restated `layout.viewport.
  *` tree — the semantic layer here adds exactly the one derived value that doesn't
  already exist elsewhere, nothing more.
- **No new spacing/gutter/grid-gap tokens.** Page margin (24/32/40px per breakpoint) and
  grid internal gap (16/24/24px per breakpoint) are documented in
  `docs/foundations/responsive.md` as mappings over **existing** tokens
  (`space.layout.sm/md/lg` for margin, `space.md`/`space.xl` for gap) — not re-expressed
  as new `layout.*` entries. A Figma Grid Style is a style asset, not a Variable/token,
  so there is no Figma-side token to mirror beyond documenting which existing token
  backs each value; inventing a code-side token here would duplicate a value that
  already exists under a different name, which the approved proposal explicitly ruled
  out for this foundation.
- **Px-only, no rem, for both source and CSS output** — same reasoning as radius (0006)
  and shadow (0007): a breakpoint or container cap is a comparison against the actual
  device viewport width in physical CSS pixels, not something that should shift when a
  user scales their root font size for accessibility (that's what rem-based
  spacing/typography already handle). A new Style Dictionary transform,
  `size/viewport-px`, follows the exact pre-format-then-passthrough mechanism
  `size/radius-px`/`size/shadow-px` already established: format the bare number as an
  explicit `"Npx"` string before the built-in `size/rem` transform runs, so `size/rem`
  passes it through unchanged instead of blindly appending `rem`.
- **The `size/viewport-px` filter only checks `token.path[0] === 'viewport'`** — it does
  not also check for `'layout'`. This was deliberately verified against the actual
  generated CSS/JS output rather than assumed from the radius/shadow precedent, because
  this is the first foundation where the semantic root key differs from the primitive's.
  Result: `--layout-container-max-width: 1280px;` (CSS) and
  `LayoutContainerMaxWidth = 1280` (JS) both came out correctly formatted with no
  additional filter condition needed. `transitive: true` transforms in Style Dictionary
  resolve by walking the reference chain and matching the filter against whichever node
  in that chain carries the raw authored number — the alias's own root key does not
  factor into that match.
- **JS/TS output needed no new configuration.** The `js` platform's transform list
  already excludes `size/rem` entirely (0004) — `viewport.*`/`layout.*` dimension tokens
  fall out as plain px numbers automatically.
- **No device-name aliases anywhere.** Generated CSS custom properties are
  `--viewport-md`/`--viewport-lg`/`--viewport-xl`/`--layout-container-max-width` only —
  t-shirt naming throughout, matching 0004's rationale.

## Consequences

- Any future foundation whose semantic tier aliases a primitive from a **different**
  top-level token category (as opposed to every prior foundation, which aliased within
  its own category) should follow the same audit discipline this ADR did: verify the
  actual build output, don't assume a `transitive`-filtered transform cascades across a
  root-key boundary just because it worked for same-root-key cases.
- `docs/foundations/responsive.md` is the single place per-breakpoint margin/gap values
  are documented; `src/tokens/semantic/layout.json` intentionally stays a one-token
  file. Anyone adding `layout.margin.*` or `layout.grid.gap.*` tokens later should reread
  this ADR's Decision section first — the exclusion was deliberate.
- Native/mobile consumers get the raw `viewport.*`/`layout.*` numbers via the JS/TS
  output, but not a media-query mechanism — media queries are a web-specific
  implementation of the viewport-vs-container distinction documented in
  `docs/foundations/responsive.md`; native platforms express the same decisions through
  their own layout systems, using these numbers as input.
