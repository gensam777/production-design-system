# Elevation / Shadow Foundation (V1)

Status: implemented (Figma + code). See
`governance/decisions/0007-elevation-token-architecture.md` for the architectural
decisions behind this foundation.

## Primitives

Raw shadow geometry in `src/tokens/primitive/shadow.json` — four scalar fields per step
(`offset-x`, `offset-y`, `blur`, `spread`), no color. No meaning attached.

| Token (code) | Figma variable | x | y | blur | spread |
| --- | --- | --- | --- | --- | --- |
| `shadow.none.*` | `shadow/none/*` | 0 | 0 | 0 | 0 |
| `shadow.sm.*` | `shadow/sm/*` | 0 | 1 | 2 | 0 |
| `shadow.md.*` | `shadow/md/*` | 0 | 2 | 6 | 0 |
| `shadow.lg.*` | `shadow/lg/*` | 0 | 4 | 12 | 0 |
| `shadow.xl.*` | `shadow/xl/*` | 0 | 8 | 24 | 0 |

`shadow.xl` is headroom — no semantic role aliases it in V1.

Shadow color is **not** part of this file — it lives in the Semantic Color system (see
below), not the shadow primitive scale, so it can benefit from future Light/Dark and
brand theming.

## Semantic tokens

`src/tokens/semantic/elevation.json` — DTCG `$type: "shadow"` composite tokens. Four
roles:

| Semantic | Geometry | Color | Use |
| --- | --- | --- | --- |
| `elevation.flat` | none — `$value: "none"` | — | Resting/inline elements: table rows, default buttons, flush surfaces. |
| `elevation.raised` | `shadow.sm` | `color.shadow.subtle` | Cards, panels — subtly above canvas. |
| `elevation.overlay` | `shadow.md` | `color.shadow.default` | Dropdowns, popovers, tooltips. |
| `elevation.modal` | `shadow.lg` | `color.shadow.strong` | Dialogs, modals, drawers. |

`elevation.flat`'s value is the literal string `"none"`, not a zero-valued shadow
object — matches the Figma `Elevation/Flat` Effect Style, which has an empty `effects`
array rather than an invisible zero-geometry shadow.

## Shadow color — part of Semantic Color, not a separate palette

Three new entries in `src/tokens/semantic/color.json`, aliasing three new entries in
`src/tokens/primitive/color.json`:

| Semantic (code) | Figma | → Primitive | Value |
| --- | --- | --- | --- |
| `color.shadow.subtle` | `shadow/subtle` | `color.overlay.subtle` | `rgba(0,0,0,0.05)` |
| `color.shadow.default` | `shadow/default` | `color.overlay.default` | `rgba(0,0,0,0.08)` |
| `color.shadow.strong` | `shadow/strong` | `color.overlay.strong` | `rgba(0,0,0,0.12)` |

The primitive is named `overlay`, not `shadow` — it's generic alpha-blended black with
no shadow-specific meaning, so a future `surface.overlay` (modal scrim) token — deferred
in `docs/foundations/color.md` / ADR 0002 for lack of a real consumer — can reuse this
same primitive scale later without new color work.

**Dark mode**: deferred, same as every other color foundation — but flagged explicitly
here because shadow needs real design thought, not just a value flip: pure black
shadows are nearly invisible on dark surfaces. When dark mode is built, a `Dark` mode
gets added to `Semantic Color` and `color.shadow.*` gets different (likely non-black)
values under it — zero changes needed to Effect Styles, `elevation.*` tokens, or
components, since everything binds to the semantic color variable, not a literal.

## Naming convention — two words, not one

```
Primitive:  shadow.<step>.<field>   e.g. shadow.md.blur
Semantic:   elevation.<role>        e.g. elevation.overlay
```

Unlike color/space/radius (one word reused at both tiers), elevation uses `shadow.*` for
raw geometry and `elevation.*` for design intent. This was a deliberate choice, partly
to avoid the kind of primitive/semantic name collision radius hit (ADR 0006) — audited
directly for this foundation, confirmed no collision exists between `shadow.*`,
`color.overlay.*`, `elevation.*`, and `color.shadow.*`.

**Components must consume semantic tokens only** — `elevation.raised`, never
`shadow.sm.*` directly.

## Code output

- **CSS** (`src/tokens/build/css/variables.css`): valid `box-shadow` shorthand via
  Style Dictionary's built-in `shadow/css/shorthand` transform — e.g.
  `--elevation-raised: 0 1px 2px 0 rgba(0, 0, 0, 0.05);`, `--elevation-flat: none;`.
  Unlike typography's `font` shorthand (lossy, needed a custom format — ADR 0003), CSS's
  `box-shadow` shorthand is lossless for every field a shadow token has, so no custom
  format was needed here.
- **Geometry stays px, never rem** — a new `size/shadow-px` transform (same pattern as
  radius's `size/radius-px`) ensures this, and also ensures the shorthand transform sees
  already-unitted values (without it, the generated CSS would be missing `px` units
  entirely, not just wrongly scaled — see ADR 0007 for why).
- **JS/TS** (`src/tokens/build/js/tokens.js`): geometry stays plain px numbers;
  `elevation.raised`/`overlay`/`modal` export as plain objects
  (`{ offsetX, offsetY, blur, spread, color }`, color as hex8) for consumers who want to
  build their own shadow string; `elevation.flat` exports as the string `"none"`.

## Accessibility/usability notes

- `forced-colors`/Windows High Contrast mode suppresses `box-shadow` entirely — any
  surface whose only boundary cue is `elevation.overlay`/`elevation.modal` becomes
  visually unbounded there. Component implementation should pair elevated surfaces with
  a border as a fallback, not rely on shadow alone.
- Shadow is a supplementary depth cue only, never the sole signal of interactivity or
  structure.

## Future theming: remap Semantic, not Primitive

Same lever as radius's Sharp/Soft (ADR 0006): future Flatter/Bolder themes repoint which
primitive each semantic role aliases, not the primitive scale itself.

| Semantic role | Default | Flatter | Bolder |
| --- | --- | --- | --- |
| `elevation.flat` | `shadow.none` | `shadow.none` | `shadow.none` |
| `elevation.raised` | `shadow.sm` | `shadow.none` | `shadow.md` |
| `elevation.overlay` | `shadow.md` | `shadow.sm` | `shadow.lg` |
| `elevation.modal` | `shadow.lg` | `shadow.md` | `shadow.xl` |

**Documented as the intended future mechanism only — no Flatter/Bolder Effect Style
variants or code theme files exist yet.**

## Figma Effect Style limitation (why this foundation looks different in Figma)

There is no shadow-type Figma Variable. The semantic tier is represented as **Effect
Styles**, not Variables — the same divergence typography has with Text Styles (ADR
0003), not the Variable-aliases-Variable pattern color/space/radius use.

- **`Primitive` collection** (shared): 20 FLOAT geometry variables
  (`shadow/none|sm|md|lg|xl` × `offset-x`/`offset-y`/`blur`/`spread`), scope
  `["EFFECT_FLOAT"]`; plus 3 COLOR overlay variables (`color/overlay/subtle|default|
  strong`), scope `[]`.
- **`Semantic Color` collection**: 3 COLOR variables (`shadow/subtle|default|strong`),
  scope `["EFFECT_COLOR"]`, aliasing the overlay primitives.
- **4 Effect Styles**: `Elevation/Flat` (empty `effects` array), `Elevation/Raised`,
  `Elevation/Overlay`, `Elevation/Modal` — each a single `DROP_SHADOW` with every
  bindable field (`offsetX`, `offsetY`, `radius`, `spread`, `color`) bound to a Variable.
  Not bindable: the effect `type` itself, `visible`, `blendMode` — these stay literal.
- An "Elevation Specimen — V1" frame demonstrates every primitive step, every semantic
  Effect Style, and example raised-card/overlay-popover/modal-dialog mockups, all using
  live `effectStyleId` assignment (not inline shadows).
- Components in Figma apply **Effect Styles** to `effectStyleId`, never construct a raw
  shadow effect inline — the Effect-Style equivalent of "consume semantic tokens only."
