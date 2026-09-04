# Spacing Foundation (V1)

Status: implemented (Figma + code). See
`governance/decisions/0004-spacing-token-architecture.md` for the architectural
decisions behind this foundation, including why it was built Figma-first and why code
naming is category-first (`space.*`) to match Figma (`space/*`).

## Primitives

Raw hybrid 4px/8px rhythm in `src/tokens/primitive/spacing.json`. No meaning attached —
a primitive doesn't know it means "card padding" or "section gap."

| Token | Value |
| --- | --- |
| `space.none` | 0px |
| `space.2xs` | 4px |
| `space.xs` | 8px |
| `space.sm` | 12px |
| `space.md` | 16px |
| `space.lg` | 20px |
| `space.xl` | 24px |
| `space.2xl` | 32px |
| `space.3xl` | 40px |
| `space.4xl` | 48px |
| `space.5xl` | 64px |

No 80px/96px step in V1 — add one deliberately when a real layout need appears.

## Semantic tokens

`src/tokens/semantic/spacing.json` — the layer components actually consume. Every
semantic token is an **alias** to a primitive (`{space.md}` style reference), never a
duplicated raw number. Four categories, each with only the aliases it has a real use
for — not a full primitive × category cross product:

- **`space.inset.*`** — padding inside a component. `none`, `xs`, `sm`, `md`, `lg`,
  `xl`, `2xl` (0–24px).
- **`space.stack.*`** — vertical gap between stacked elements. `none`, `xs`, `sm`, `md`,
  `lg`, `xl`, `2xl` (0–32px).
- **`space.inline.*`** — horizontal gap between side-by-side elements. `none`, `xs`,
  `sm`, `md`, `lg` (0–16px) — stops earlier than `inset`/`stack` since inline gaps
  rarely need to go wider.
- **`space.layout.*`** — page/region-level structural spacing. `sm`, `md`, `lg`, `xl`,
  `2xl` (24–64px) — starts where the other three categories stop; no `none`/tiny steps,
  since layout-level spacing never needs to be that small.

| Semantic | → Primitive | px |
| --- | --- | --- |
| `inset.none` / `stack.none` / `inline.none` | `space.none` | 0 |
| `inset.xs` / `stack.xs` / `inline.xs` | `space.2xs` | 4 |
| `inset.sm` / `stack.sm` / `inline.sm` | `space.xs` | 8 |
| `inset.md` / `stack.md` / `inline.md` | `space.sm` | 12 |
| `inset.lg` / `stack.lg` / `inline.lg` | `space.md` | 16 |
| `inset.xl` | `space.lg` | 20 |
| `inset.2xl` / `stack.xl` | `space.xl` | 24 |
| `layout.sm` | `space.xl` | 24 |
| `stack.2xl` / `layout.md` | `space.2xl` | 32 |
| `layout.lg` | `space.3xl` | 40 |
| `layout.xl` | `space.4xl` | 48 |
| `layout.2xl` | `space.5xl` | 64 |

## Naming convention

```
Primitive:  space.<step>                     e.g. space.md, space.2xl
Semantic:   space.<category>.<role>           e.g. space.inset.md, space.stack.lg
```

Category-first, matching the Figma Variable structure exactly (`space/md`,
`space/inset/md`) — Figma uses `/` as its grouping separator, code uses `.` as its DTCG
token-path separator; same structure otherwise. This convention also applies
retroactively to color (`color.surface.*` in code already matched Figma's renamed
`color/surface/*` — no code migration was needed there, see ADR 0004's audit note).

**Components must consume semantic tokens only** — never `space.md` directly in
component code or a story, same rule as color and typography.

## Code output: px source, rem for CSS only

Primitive and semantic spacing values are stored as raw pixel numbers
(`$type: "dimension"`, e.g. `{ "$value": 16 }`), matching Figma exactly. This is
deliberate — rem is a CSS output detail, not the design-side value model (see the
approved proposal referenced in ADR 0004).

- **CSS output** (`src/tokens/build/css/variables.css`): converted to rem via a custom
  `size/px-to-rem` Style Dictionary transform (16px base), e.g. `--space-md: 1rem;`.
- **JS/TS output** (`src/tokens/build/js/tokens.js`): stays a plain px number, e.g.
  `export const SpaceMd = 16;`. The built-in `size/rem` transform was deliberately
  excluded from this platform's transform list — see ADR 0004 for why it would have
  corrupted these values if left in.

## Figma Variables (implemented)

Unlike color and typography, this foundation was built **Figma-first** — the Variables
below were created and approved in Figma before any code existed, then mirrored here.

- **`Primitive` collection**, single `Value` mode, variables grouped by `/`:
  `space/none` … `space/5xl`, `FLOAT` type, scope `["GAP"]`.
- **`Semantic` collection**, single `Light` mode, variables under `space/inset/*`,
  `space/stack/*`, `space/inline/*`, `space/layout/*`, each an **alias** to a
  `Primitive` Variable, scope `["GAP"]`.
- A "Spacing Specimen — V1" frame in the Figma file demonstrates every primitive step
  and semantic category with bound padding/gap values and px labels.
- Components in Figma bind padding/gap to **Semantic** variables only, mirroring the
  code rule.
