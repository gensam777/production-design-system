# Radius Foundation (V1)

Status: implemented (Figma + code). See
`governance/decisions/0006-radius-token-architecture.md` for the architectural
decisions behind this foundation, and
`governance/decisions/0005-semantic-collection-split.md` for why radius semantics live
in their own `Semantic Radius` Figma collection.

## Primitives

Raw scale in `src/tokens/primitive/radius.json`. No meaning attached.

| Token (code) | Figma variable | Value |
| --- | --- | --- |
| `radius.none` | `radius/none` | 0px |
| `radius.sm` | `radius/sm` | 4px |
| `radius.md` | `radius/md` | 8px |
| `radius.lg` | `radius/lg` | 12px |
| `radius.xl` | `radius/xl` | 16px |
| `radius.max` | `radius/full` | 9999px |

`radius.md`/`radius.xl` are headroom — not yet aliased by any semantic role, same as
color's unused gray/blue steps or spacing's `space.md`/`space.xl`.

**Naming exception**: the code path for the last primitive is `radius.max`, not
`radius.full`, even though the Figma variable is named `radius/full`. This is the one
deliberate code/Figma naming divergence in this token system — Style Dictionary merges
every source file into one flat token tree (unlike Figma's collection-scoped
namespacing), so the primitive and the semantic `radius.full` role below can't share the
literal path `radius.full` in code. Full reasoning in ADR 0006.

## Semantic tokens

`src/tokens/semantic/radius.json` — the layer components actually consume. Every
semantic token is an **alias** to a primitive, never a duplicated raw number. Four
roles — not a full primitive cross-product:

| Semantic | → Primitive | px | Use |
| --- | --- | --- | --- |
| `radius.flat` | `radius.none` | 0 | Tables, dividers, code blocks — explicit square corners. |
| `radius.control` | `radius.sm` | 4 | Buttons, inputs, checkboxes, tags/chips. |
| `radius.container` | `radius.lg` | 12 | Cards, panels, modals, popovers, dialogs. |
| `radius.full` | `radius.max` | 9999 | Pills, avatars, circular icons/status dots. |

## Naming convention

```
Primitive:  radius.<step>     e.g. radius.md, radius.max
Semantic:   radius.<role>     e.g. radius.control, radius.container
```

Category-first, matching color/spacing. **Components must consume semantic tokens
only** — never `radius.sm` directly in component code or a story.

## Code output: px everywhere, no rem

Unlike spacing (which converts to rem for CSS output), radius stays a plain px value in
**both** the JSON source and the generated CSS — deliberately, per the approved
architecture: radius is visual geometry, not something that should scale with a user's
root font-size preference the way spacing and typography intentionally do.

- **CSS output** (`src/tokens/build/css/variables.css`): `--radius-control: 4px;`,
  `--radius-full: 9999px;` — via a custom `size/radius-px` Style Dictionary transform
  (see ADR 0006 for why the existing `size/px-to-rem` transform had to be scoped away
  from radius rather than reused).
- **JS/TS output** (`src/tokens/build/js/tokens.js`): plain px numbers, e.g.
  `export const RadiusControl = 4;`.

## Future theming: remap Semantic, not Primitive

The primitive `radius.*` scale is the fixed raw ramp — sharp/soft/brand variants are
expressed by repointing which primitive each **semantic role** aliases, not by mutating
primitive values. Semantic role names never change.

| Semantic role | Default | Sharp | Soft |
| --- | --- | --- | --- |
| `radius.flat` | `radius.none` | `radius.none` | `radius.none` |
| `radius.control` | `radius.sm` (4) | `radius.none` (0) | `radius.md` (8) |
| `radius.container` | `radius.lg` (12) | `radius.sm` (4) | `radius.xl` (16) |
| `radius.full` | `radius.max` | `radius.max` | `radius.max` |

**Documented as the intended future mechanism only — no Sharp/Soft Figma modes and no
code theme files exist yet.** V1 ships with exactly the Default column, single mode,
matching every other foundation so far.

## Accessibility/usability notes

- The `color.focus.ring` token should visually track whatever radius its container uses
  (`radius.control`/`radius.container`), or the focus ring looks clipped against a
  rounded corner — a WCAG 2.4.11/2.4.13 (visible focus indicator) quality concern for
  component implementation, not something the token itself can enforce.
- `radius.control` (4px) is deliberately conservative so it doesn't visually shrink the
  perceived hit target on small controls.
- `radius.flat` exists specifically so tables/grids/code blocks aren't forced into an
  inherited rounded corner that breaks visual alignment.

## Figma Variables (implemented)

- **`Primitive` collection**, single `Value` mode, scope `["CORNER_RADIUS"]`:
  `radius/none`, `radius/sm`, `radius/md`, `radius/lg`, `radius/xl`, `radius/full`.
- **`Semantic Radius` collection**, single `Default` mode, scope `["CORNER_RADIUS"]`,
  each an **alias** to a Primitive variable: `flat`, `control`, `container`, `full`.
- A "Radius Specimen — V1" frame demonstrates every primitive step, every semantic role,
  and example Button/Card/Pill/Avatar/Table-cell mockups, all using live variable
  bindings (not hardcoded corner radii).
- Components in Figma bind corner radius to **Semantic Radius** variables only,
  mirroring the code rule.
