# Typography Foundation (V1)

Status: implemented. See `governance/decisions/0003-typography-token-architecture.md` for
the architectural decisions behind this foundation.

## Primitives

Raw, un-opinionated values in `src/tokens/primitive/typography.json`. No meaning attached
— a primitive doesn't know it's used for a heading or a caption.

| Category | Values | Notes |
| --- | --- | --- |
| `font.family.*` | `sans`, `mono` | `sans` is Inter + a system fallback stack; `mono` is a code/data stack. Both are placeholders a consuming product can swap, same status as `blue` in the color foundation. |
| `font.size.*` | `xs` 12 · `sm` 14 · `md` 16 · `lg` 18 · `xl` 20 · `2xl` 24 · `3xl` 30 · `4xl` 36 | Stored in **rem**. No editorial/marketing display sizes — stops at 36px. |
| `font.weight.*` | `regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700 | No sub-400 weights — thin text hurts legibility at UI sizes. |
| `font.lineHeight.*` | `tight` 1.25 · `normal` 1.5 | Unitless ratios. |
| `font.letterSpacing.*` | `tight` -0.01em · `normal` 0em | In **em**, so it scales with font-size. |

18 primitives total.

## Semantic tokens

`src/tokens/semantic/typography.json` — **35 composite roles** (`role` × `size` × `weight`),
each a DTCG `$type: "typography"` token whose sub-values (`fontFamily`, `fontSize`,
`fontWeight`, `lineHeight`, `letterSpacing`) alias primitives. No sub-value is ever a raw
literal. This is the balanced matrix approved and migrated first in Figma (Text Styles),
then mirrored here — Figma is the source of truth for the matrix shape; see
`governance/decisions/0003-typography-token-architecture.md`.

Two rules generate every row's `lineHeight`/`letterSpacing`, derived from Figma and applied
without exception:

- **Line-height is role-driven**: `heading` and `label` are single-line UI text → `tight`
  (1.25). `body`, `caption`, `code` are reading/paragraph text → `normal` (1.5).
- **Letter-spacing is size-driven**: `2xl` (24) and above → `tight` (-0.01em). `xl` (20) and
  below → `normal` (0em). This is why `heading.sm` (20px) gets tight line-height but normal
  letter-spacing, while `heading.md` (24px) and up get both tight.

| Role | Size | Weights | Family | Size value | Line-height | Letter-spacing | Use |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `text.heading.xl` | xl | semibold, bold | sans | 4xl (36) | tight | tight | Hero/display heading |
| `text.heading.lg` | lg | semibold, bold | sans | 3xl (30) | tight | tight | Page title |
| `text.heading.md` | md | semibold, bold | sans | 2xl (24) | tight | tight | Section title |
| `text.heading.sm` | sm | semibold, bold | sans | xl (20) | tight | normal | Card/dialog title |
| `text.body.lg` | lg | regular, medium, semibold, bold | sans | lg (18) | normal | normal | Intros, lead paragraphs |
| `text.body.md` | md | regular, medium, semibold, bold | sans | md (16) | normal | normal | Default body/UI text |
| `text.body.sm` | sm | regular, medium, semibold, bold | sans | sm (14) | normal | normal | Secondary/dense UI text |
| `text.label.lg` | lg | medium, semibold, bold | sans | md (16) | tight | normal | Form labels, buttons, tabs (larger) |
| `text.label.md` | md | medium, semibold, bold | sans | sm (14) | tight | normal | Form labels, buttons, tabs (default) |
| `text.label.sm` | sm | medium, semibold, bold | sans | xs (12) | tight | normal | Form labels, buttons, tabs (compact) |
| `text.caption.md` | md | regular, medium | sans | sm (14) | normal | normal | Helper text, metadata, timestamps |
| `text.caption.sm` | sm | regular, medium | sans | xs (12) | normal | normal | Helper text, metadata, timestamps (compact) |
| `text.code.md` | md | regular | mono | sm (14) | normal | normal | Inline code, IDs |
| `text.code.sm` | sm | regular | mono | xs (12) | normal | normal | Inline code, IDs (compact) |

Row count: heading 4 sizes × 2 weights (8) + body 3 sizes × 4 weights (12) + label 3 sizes ×
3 weights (9) + caption 2 sizes × 2 weights (4) + code 2 sizes × 1 weight (2) = **35 tokens**.

No component-specific typography tokens exist (no `button.label`, no `input.helperText`)
— components consume these 35 roles only, unless a real second consumer justifies a new one.

## Naming

```
Primitive:  font.<category>.<step>          e.g. font.size.lg, font.weight.semibold
Semantic:   text.<role>.<size>.<weight>      e.g. text.heading.xl.bold, text.body.md.regular,
                                                   text.label.sm.medium, text.code.sm.regular
```

Every role now carries a size and a weight segment — there is no longer a bare `text.label`
or `text.caption`/`text.code` without a size, and no role has an implicit single weight.
This is a breaking rename from the V1 8-role shape (see Migration notes below).

`text.*` (typography roles) and the existing `color.text.*` (text color) are different
token trees, not a collision — `color.text.primary` answers "what color," `text.heading.lg`
answers "what style." Components combine one token from each family when styling text.

## Usage rules

1. Components and stories consume `text.*` semantic roles only — never `font.size.xl` or
   any other primitive directly. Same rule as color.
2. Don't add a component-specific role until a second real consumer needs the exact same
   combination — a one-off text treatment is a component-level style, not a foundation
   token.
3. Pair every `text.*` role with a `color.text.*` token for the actual text color — this
   foundation only defines shape (family/size/weight/line-height/tracking), not color.

## Figma mapping (created — 35 Text Styles, migrated from an earlier 8-role set)

Typography uses two different Figma mechanisms, not one:

- **Primitive variables** live in the existing `Primitive` collection (same one color uses,
  still single `Value` mode): `font/family/sans` (STRING), `font/family/mono` (STRING),
  `font/size/xs`…`4xl` (FLOAT, px), `font/lineHeight/tight`/`normal` (FLOAT),
  `font/letterSpacing/tight`/`normal` (FLOAT), plus `font/weight/regular`/`medium`/
  `semibold`/`bold` (STRING) holding the exact installed font style name — `"Semi Bold"`,
  not `"SemiBold"` or `600` — since Figma binds text weight by style-name matching unless
  the font is a variable font. 18 primitive variables total, unchanged since V1.
- **No Semantic variable collection entries for typography.** A composite role can't be
  represented as a single Variable alias the way a color can. The semantic layer is one
  **Figma Text Style per role** — 35 styles named `text/<role>/<size>/<weight>` (e.g.
  `text/heading/xl/bold`, `text/label/sm/medium`, `text/code/md/regular`), each with its
  `fontFamily`/`fontSize`/`fontStyle` bound to the Primitive variables above.
- **Confirmed Figma limitation — do not attempt to bind `lineHeight`/`letterSpacing` to a
  variable.** The Plugin API accepts `setBoundVariable('lineHeight', var)` without error,
  but silently reinterprets the variable's raw number as `PIXELS` instead of `PERCENT` —
  a variable holding `125` (meant as 125%) becomes a literal 125px line-height, and `-1`
  (meant as -1%) becomes -1px letter-spacing. Both are set as **literal `PERCENT`
  values** on every style instead (`125`/`150` for line-height, `-1`/`0` for
  letter-spacing) — this mirrors why `font.lineHeight.*`/`font.letterSpacing.*` are
  aliased in code but never bound in Figma.
- **Migration history**: the Figma file previously had 8 semantic Text Styles
  (`text/heading/lg` etc., one weight per role) plus 8 non-semantic utility styles
  (`type/36`…`type/12`, a flat size ladder). Both sets were retired once all 35 replacement
  styles existed and were verified — no node in the file was left referencing a deleted
  style.

## Style Dictionary mapping

- `src/tokens/primitive/typography.json` — DTCG types `fontFamily` (array of strings),
  `dimension` (sizes in rem, letter-spacing in em), `fontWeight` (numeric), `number`
  (line-height ratios).
- `src/tokens/semantic/typography.json` — DTCG composite `$type: "typography"` tokens.
- **Style Dictionary config change required**: the built-in `css/variables` format
  collapses a composite typography token into a single CSS `font` shorthand value. CSS's
  `font` shorthand has no slot for letter-spacing, so it was silently dropped — confirmed
  by Style Dictionary's own build warning before the fix. Two changes were needed:
  1. A custom format, `css/typography-expanded`, that expands each role into five
     longhand custom properties instead of one shorthand string.
  2. The `css` platform's transform list had `typography/css/shorthand` removed (that
     transform runs before any per-file `filter`, so simply filtering the shorthand
     format out of one file wasn't enough — the collapsing happened upstream of the
     filter). Every other css transform (`size/rem`, `fontFamily/css`, `color/css`, etc.)
     is unchanged.
- Output: `src/tokens/build/css/variables.css` (colors + typography primitives, unchanged
  shape) and `src/tokens/build/css/typography.css` (the 35 roles, 5 properties each — 175
  custom properties total):
  ```css
  --text-heading-lg-bold-font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-heading-lg-bold-font-size: 1.875rem;
  --text-heading-lg-bold-font-weight: 700;
  --text-heading-lg-bold-line-height: 1.25;
  --text-heading-lg-bold-letter-spacing: -0.01em;
  ```
  A component combines these into the CSS shorthand or individual properties as needed —
  there's no single custom property equivalent to a Figma Text Style.

## Migration from the 8-role shape

The original V1 semantic layer shipped 8 roles, one weight each: `text.heading.lg/md/sm`,
`text.body.md/sm`, `text.label`, `text.caption`, `text.code`. It was replaced in full by
the 35-role matrix above — first in Figma (Text Styles), then mirrored here. Every old
token has an exact-value successor:

| Old token | New token |
| --- | --- |
| `text.heading.lg` (bold) | `text.heading.lg.bold` |
| `text.heading.md` (semibold) | `text.heading.md.semibold` |
| `text.heading.sm` (semibold) | `text.heading.sm.semibold` |
| `text.body.md` (regular) | `text.body.md.regular` |
| `text.body.sm` (regular) | `text.body.sm.regular` |
| `text.label` (medium, 14px) | `text.label.md.medium` |
| `text.caption` (regular, 12px) | `text.caption.sm.regular` |
| `text.code` (regular, 14px) | `text.code.md.regular` |

This is a **breaking rename**, not a value change — every mapped pair has identical
`fontFamily`/`fontSize`/`fontWeight`/`lineHeight`/`letterSpacing`. No components consume
these tokens yet (`src/components/` is still empty), so there are no call sites to update
in this repo; a consuming product on the old names would need to rename references.

## Accessibility & readability

- Body text floor is 16px (`md`) — `xs`/`sm` are reserved for captions/labels, never
  primary reading content.
- Font sizes are **rem**, not px, specifically so WCAG 1.4.4 (Resize Text) and OS/browser
  base-font-size preferences are respected — px-locked type ignores them entirely.
- `normal` line-height is 1.5, matching WCAG 1.4.8's recommended paragraph spacing floor.
- Line-height is unitless and letter-spacing is in em — both scale proportionally with an
  element's own font-size rather than staying fixed if a component overrides size.
- `tight` letter-spacing (-0.01em) is modest and only reachable by heading sizes `md` and
  above (24px+) — `heading.sm` (20px) and every `body`/`label`/`caption`/`code` role stay
  at `normal` (0em), since negative tracking hurts legibility below that size.
- No sub-400 font weights exist, so a component can't accidentally pick a thin weight at
  a small size.
- Text color contrast is covered by the Color Foundation (`color.text.*`) — not duplicated
  here.

## Deferred until responsive/breakpoint or theming work

- Fluid/`clamp()`-based responsive type sizing — V1 is one static scale for all viewports.
- Per-breakpoint semantic overrides (e.g. smaller `heading.lg` on mobile).
- Dark-mode-specific type adjustments (e.g. lighter weight to offset halation).
- Additional/alternate brand typefaces for multi-brand theming.
- Variable-font axis tokens (optical size, fine-grained weight interpolation).
- RTL/bidi-specific spacing adjustments.
- Paragraph measure/max-width (`ch`-based line length) — a layout, not a token, concern.
