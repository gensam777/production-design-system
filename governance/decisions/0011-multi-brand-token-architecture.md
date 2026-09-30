# 0011: Multi-brand (white-label) token architecture

- **Status**: Accepted
- **Date**: 2026-09-29
- **Supersedes in part**: the brand/theme _mechanism_ sketched in 0002 (rebrand = edit
  primitives), 0005 (brand modes on `Semantic Color`) and 0006 (Sharp/Soft modes on
  `Semantic Radius`). Their token architectures otherwise stand.

## Context

The system must support multiple brands with the **same** component APIs, component
structure, patterns, templates and product layouts — only the theme/token layer may change.
The existing Primitive → Semantic → Component architecture already had components consuming
semantic tokens only, but brand-specific values (the blue hue, the Inter family) were mixed
into the shared primitive layer, Style Dictionary bakes resolved values into every semantic
custom property (no runtime `var()` chains), and the Figma collections were all single-mode.

## Decision

**Shared component contract → semantic token contract → brand-specific values.** Components
never know which brand is active.

### Token layers (code: `src/tokens/`)

| Layer    | Folder            | Varies by brand? | Contents                                                                        |
| -------- | ----------------- | ---------------- | ------------------------------------------------------------------------------- |
| Core     | `core/`           | No               | Shared scales and hue ramps (was `primitive/`).                                 |
| Brand    | `brands/<brand>/` | **Yes**          | The brand contract — a small, fixed-shape set of choices (below).               |
| Semantic | `semantic/`       | No (names)       | Public contract. Brandable roles alias `brand.*`; everything else aliases Core. |

**Brand contract (V1, 13 tokens):** `brand.color.primary.{50…900}`,
`brand.font.family.sans`, `brand.radius.control`, `brand.radius.container`.

**Brandable semantic tokens (derived, 41):** `color.action.primary.{default,hover,active}`,
`color.text.link`, `color.text.link-hover`, `color.focus.ring`, `radius.control`,
`radius.container`, and the `font-family` of the 33 sans `text.*` roles.

**Shared (must not vary by brand):** neutrals (brand-ready later via a future
`brand.color.neutral.*`, not built), feedback colors, `action.*.on-color`, spacing, type
scale, line heights, letter spacing, numeric weights, mono family, radius scale,
`radius.flat`, `radius.full`, the component-scoped `radius.checkbox` (below), elevation,
motion, breakpoints, layout/container, icon provider and sizes, component dimensions,
semantic token names.

**`radius.checkbox` (component-scoped, shared):** a 16px checkbox box using a rounder brand
`radius.control` (8px) becomes a circle — indistinguishable from Radio. Checkbox therefore
uses its own shared token (4px) instead of `radius.control`; the brand radius is not capped.

### Build (`scripts/build-tokens.mjs`)

Style Dictionary runs once per brand over `core + brands/<brand> + semantic`. A token is
brand-dependent when its alias chain reaches `brand.*` (typography: per sub-value).
Outputs: `variables.css` / `typography.css` / `motion-reduced-motion.css` (shared, `:root`)
and `brands/<brand>.css`. `brand.*` tokens are never emitted.

- Default brand: `:root, [data-brand="brand-a"]` — applies with no attribute at all.
- Other brands: `:root[data-brand="brand-b"], [data-brand="brand-b"]` — specificity (not
  load order) makes it win over the default on `<html>`; the bare attribute selector
  scopes contained previews (side-by-side brands). Unknown ids fall back to the default.
- JS: `tokens.js` (default brand, unchanged) + `tokens.<brand>.js`.

### Runtime switching

Set `data-brand` on `<html>` or any container. Components only consume semantic custom
properties, which the brand files scope — no provider, no context, no component prop.

### Guardrails

1. **Contract completeness** (build): every brand defines exactly the default brand's
   `brand.*` leaves, and brand files may define nothing outside `brand`.
2. **Shared-token consistency** (build): a token that doesn't depend on `brand.*` must
   resolve identically for every brand.
3. **Per-brand WCAG contrast** (build): 14 pairs (primary label ≥4.5, links ≥4.5 on
   default/canvas/sunken, focus ring ≥3, selected-control fill ≥3, text ramps ≥4.5).
4. **Token usage** (`scripts/check-token-usage.mjs`, part of `npm run lint`/CI):
   components, patterns and examples may not reference Core primitives, `--brand-*`, or
   raw hex — except explicit, documented entries in `scripts/token-usage-exceptions.json`
   (file + token + exact occurrence count + reason + doc link). Today there is one: the
   Dashboard example's grid-column gap (`--space-xl`, per responsive.md's grid-gap rule).

### Figma (hybrid)

- `Primitive` → **`Core`** (single mode): shared scales and hue ramps (+ `color/violet/*`).
- **`Brand`** collection, modes **Brand A / Brand B**: `color/primary/*`,
  `font/family/sans`, `radius/control`, `radius/container`, plus **`font/weight/*` — a
  Figma-only font _style-name_ adapter** (Inter "Semi Bold" vs Figtree "SemiBold"); numeric
  weights stay shared in code.
- Semantic collections keep their names and resolve through Brand + Core. Brand selection is
  independent of the future Light/Dark axis on `Semantic Color` (no combinatorial modes).
- `Semantic Radius/checkbox` mirrors the code token.

### Brands (V1)

|                                | Brand A (default)         | Brand B (fictional demo)    |
| ------------------------------ | ------------------------- | --------------------------- |
| Primary                        | Core blue (600 `#2563EB`) | Core violet (600 `#7C3AED`) |
| Sans                           | Inter                     | Figtree (OFL-1.1)           |
| `radius.control` / `container` | 4 / 12px                  | 8 / 16px                    |

## Consequences

- Brand A migrated with zero visual change — verified byte-identical in all 136 Storybook
  stories and 52 Figma exports, and 0/386 changed CSS token values.
- The primitive `--font-family-sans` custom property is no longer emitted (the family is a
  brand choice now; nothing consumed it). All other primitives are unchanged.
- Adding a brand = one `brands/<id>/brand.json` + one Figma mode + adding the id to
  `BRANDS` in the build script; the build rejects incomplete or inaccessible brands.
- Native platforms (later): the same semantic names become a theme type per platform
  (React Native theme object via context, SwiftUI `DSTheme` via `@Environment`, Compose
  `CompositionLocal`), with one generated value set per brand.
