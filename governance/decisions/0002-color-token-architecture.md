# 0002: Color token architecture — semantic-only consumption, blue as default brand hue

- **Status**: Accepted
- **Date**: 2026-09-02

## Context

This is the first foundation built on top of the token pipeline established in
[0001](./0001-single-package-structure.md). It needs to decide two things that later
foundations (spacing, typography, etc.) and every future component will depend on:
how primitive and semantic color tokens relate, and what "brand color" means for a
system meant to be reused as a template across products.

## Decision

- **Two-tier token structure**: primitives (`src/tokens/primitive/color.json`, hue-named,
  no meaning) and semantics (`src/tokens/semantic/color.json`, role-named, alias
  primitives via `{color.x.y}` references). No raw hex values are duplicated in the
  semantic layer.
- **Components consume semantic tokens only.** Referencing a primitive
  (`color.gray.500`) directly from component code or a story is treated as a defect,
  not a style choice — it breaks the one-file-change property that makes rebranding
  and future dark-mode theming tractable.
- **Blue is the default working brand hue for this template, not a fixed brand
  decision.** A product built from this design system is expected to replace the
  `color.blue.*` primitive scale and remap the semantic tokens that alias it
  (`action.primary.*`, `text.link*`, `focus.ring`). This is the intended
  customization path, not a workaround.
- **Full scales only where the range is actually used**: `gray` and the brand hue
  (`blue`) get the full 50–900 scale; feedback hues (`red`, `green`, `amber`, `cyan`)
  get a reduced scale (subtle/default/emphasis steps only), since they never fill
  more than three semantic slots each.
- **No component-specific color tokens in this pass**, and no `surface.overlay` /
  `transparent` tokens — both would require either duplicating a raw value or adding
  opacity-modifier tooling neither of which is justified without a consuming
  component yet.
- Full rationale, the complete token list, and computed contrast ratios live in
  [`docs/foundations/color.md`](../../docs/foundations/color.md) — not duplicated here.

## Consequences

- A rebrand or per-product theme is a change to primitive values plus semantic alias
  targets, not a component-code change — as long as the "semantic only" consumption
  rule is actually followed. This needs to be enforced by review (and potentially
  lint later) since nothing currently blocks a component from importing a primitive.
- Dark mode (still deferred) will extend this same structure — a `themes/dark.json`
  overriding semantic aliases — rather than requiring a redesign of the token layers.
- Reduced-scale feedback hues mean if a future component needs a feedback tint this
  foundation didn't anticipate (e.g. a hover state on a subtle badge), that primitive
  step won't exist yet and will need to be added deliberately, not worked around with
  an arbitrary hex value.
