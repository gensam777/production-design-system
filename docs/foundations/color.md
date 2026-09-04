# Color Foundation (V1)

Status: implemented, light mode only. See `governance/decisions/0002-color-token-architecture.md`
for the architectural decisions behind this foundation.

## Primitives

Raw, un-opinionated hue scales in `src/tokens/primitive/color.json`. No meaning attached — a
primitive doesn't know it means "danger" or "brand." Named by hue, not role.

| Hue | Steps | Role |
| --- | --- | --- |
| `gray` | 50–900 (full scale) | Neutral — surfaces, borders, text |
| `blue` | 50–900 (full scale) | **Brand/primary hue — see "Brand & future theming" below** |
| `red` | 50, 100, 600, 700 (reduced) | Feedback — danger |
| `green` | 50, 100, 600, 700 (reduced) | Feedback — success |
| `amber` | 50, 100, 600, 700, 800 (reduced) | Feedback — warning |
| `cyan` | 50, 100, 600, 700 (reduced) | Feedback — info |
| `white`, `black` | single value | Fixed points, no scale |

Gray and the brand hue get a full 9-step scale because they're used across many
semantic categories at every level of emphasis (subtle tints through strong shades).
Feedback hues only ever fill three semantic slots (subtle background, default
icon/accent, emphasis/solid) — a full 9-step scale for them would be unused surface
area, so they're deliberately reduced.

Info uses its own hue (`cyan`), distinct from brand blue, so an info banner and a
primary button don't read as the same color and lose meaning.

## Semantic tokens

`src/tokens/semantic/color.json` — the layer components actually consume. Every
semantic token is an **alias** to a primitive (`{color.gray.900}` style reference),
never a duplicated hex value. Six categories:

- **`color.surface.*`** — `canvas`, `default`, `raised`, `sunken`, `inverse`, `disabled`
- **`color.text.*`** — `primary`, `secondary`, `tertiary`, `disabled`, `inverse`, `link`,
  `link-hover`, `danger`, `success`, `warning`
- **`color.border.*`** — `subtle`, `default`, `strong`, `danger`, `success`, `warning`
- **`color.action.*`** — `primary` (default/hover/active/disabled/on-color), `secondary`
  (default/hover), `tertiary` (hover only), `danger` (default/hover/on-color)
- **`color.feedback.*`** — `success` / `warning` / `danger` / `info`, each with
  `subtle` / `default` / `emphasis` / `on-color`
- **`color.focus.*`** — `ring`, `ring-offset`

Deliberately **not** included in V1: `surface.overlay` (modal scrim). An alpha-blended
scrim can't be expressed as a clean alias to a primitive without either duplicating a
raw rgba value or adding opacity-modifier tooling — and no component needs it yet.
Add it when a Modal/Dialog component actually requires one, and decide the alpha
representation at that point.

`transparent` is not tokenized as a color for the same reason — `action.tertiary` has
no `default` token because "no background" isn't a color value; only its `hover` fill
is a real token.

## Naming convention

```
Primitive:  color.<hue>.<step>              e.g. color.gray.500, color.blue.600
Semantic:   color.<category>.<role>.<state> e.g. color.action.primary.hover
```

State suffixes are consistent across categories where they apply: `default`, `hover`,
`active`, `disabled`, `subtle`, `emphasis`, `on-color`.

`on-color` naming rule (worth calling out because it's easy to get backwards): it's
validated against different states depending on category —

- **Action** tokens: `on-color` is checked against `default` (a button's resting state
  *is* its solid fill), and contrast only improves through `hover`/`active`.
- **Feedback** tokens: `on-color` is checked against `emphasis`, not `default` —
  `default` is used for lighter-weight contexts (icons, accent borders) that only need
  to clear the 3:1 non-text minimum, not 4.5:1 text contrast.

## How primitives map to semantic tokens

Semantic tokens reference primitives by alias; they never carry their own raw hex
value. Example:

```json
"action": {
  "primary": {
    "default": { "$value": "{color.blue.600}", "$type": "color" }
  }
}
```

This is the mechanism that makes a future rebrand or theme swap a one-file change:
repoint the alias, and every component that consumes `color.action.primary.default`
updates without being touched. **Components must consume semantic tokens only —
never `color.gray.500` or `color.blue.600` directly in component code.**

## Usage rules

1. Never reference a primitive from component code or Storybook stories — always go
   through the semantic layer.
2. Don't invent a new semantic token for a single component's one-off need. If only
   one component would ever use it, it's very likely not a foundation-level token —
   revisit this rule if a real second consumer shows up.
3. Feedback-family `default` tokens are for icons/accents/badges, not for text sitting
   on top of them. Text/icon-on-solid-fill uses the matching `on-color` token, paired
   with `emphasis` (feedback) or `default` (action).
4. `border.subtle` and `border.default` are structural/decorative only — see
   accessibility notes below. Use `border.strong` when a border is the sole way a user
   identifies an interactive element's boundary or state.

## Accessibility expectations

All ratios below were computed directly from the shipped hex values (WCAG relative
luminance formula), not estimated.

**Text on surfaces** (target: ≥4.5:1 normal text, ≥3:1 large text) — all pass except
the documented exempt case:

| Token | Ratio on `surface.default` |
| --- | --- |
| `text.primary` | 17.74:1 |
| `text.secondary` | 10.31:1 |
| `text.tertiary` | 4.83:1 |
| `text.disabled` | 2.54:1 — **below AA, exempt per WCAG for disabled content** |
| `text.link` | 5.17:1 |
| `text.link-hover` | 6.70:1 |
| `text.danger` | 6.47:1 |
| `text.success` | 5.02:1 |
| `text.warning` | 7.09:1 |

**Non-text / UI boundaries** (target: ≥3:1):

| Token | Ratio | Notes |
| --- | --- | --- |
| `border.default` | 1.47:1 on `surface.default` | Decorative only — does not meet 3:1 alone |
| `border.strong` | 4.83:1 on `surface.default` | Clears 3:1; use for standalone interactive boundaries |
| `focus.ring` | 4.95:1 vs `surface.canvas`, 5.17:1 vs `surface.raised` | Clears WCAG 2.4.11 against both backgrounds it appears on |

A real gap this caught during implementation: the originally-proposed `border.strong`
mapping (`gray.400`) only measured 2.54:1 — it was remapped to `gray.500` (4.83:1) so
the token actually does what its name promises.

**On-color text on solid fills** (target: ≥4.5:1, checked against the state each
token is meant to pair with):

| Fill | On-color ratio |
| --- | --- |
| `action.primary.default` (blue.600) | 5.17:1 |
| `action.primary.hover` / `.active` | 6.70:1 / 8.72:1 |
| `action.danger.default` (red.600) | 4.83:1 |
| `feedback.success.emphasis` (green.700) | 5.02:1 |
| `feedback.warning.emphasis` (amber.700) | 5.02:1 |
| `feedback.danger.emphasis` (red.700) | 6.47:1 |
| `feedback.info.emphasis` (cyan.700) | 5.36:1 |

**Color is never the only signal**: feedback tokens are meant to be paired with an
icon or text label in the component that consumes them — hue alone (especially
red/green) isn't a reliable signal for all users.

## Brand & future theming

Blue is the **default working brand hue for this template**, not a permanent choice.
A product built from this design system can replace the entire `color.blue.*`
primitive scale with its own brand hue and remap the semantic action/focus/link
tokens that currently alias it — semantic token names never change, only what they
point to. This is the intended customization path; it does not require touching
component code.

Dark mode is still fully deferred (see ADR
[0001](../../governance/decisions/0001-single-package-structure.md) and
[0002](../../governance/decisions/0002-color-token-architecture.md)). When it's taken
up: a `Dark` mode is added to the Figma semantic variable collection and a
`src/tokens/themes/dark.json` file overrides the semantic aliases (and likely
introduces dark-specific primitive steps/ramps) — the semantic token names and the
categories in this document stay the same.

## Figma Variables (implemented)

- **`Primitive` collection**, single `Value` mode, variables grouped by "/" to match the
  token path, **category-first** (`color/gray/500`, `color/blue/600`, `color/white`).
- **`Semantic` collection**, single `Light` mode, variables like `color/surface/canvas`,
  `color/action/primary/default`, each bound as a Figma **alias** to a Primitive
  variable — the direct equivalent of the `{color.gray.900}` reference in code.
- Components in Figma bind fills/strokes/text to **Semantic** variables only, mirroring
  the code rule.
- Naming note: Figma variables were originally created without the `color/` prefix
  (`gray/500`, `surface/canvas`) and later renamed to the category-first form above for
  scalability alongside the Spacing Foundation — see
  `governance/decisions/0004-spacing-token-architecture.md`. Code paths
  (`color.gray.500`, `color.surface.canvas`) were already category-first from the start
  (the JSON source files are rooted under a `color` key) and needed no migration.
