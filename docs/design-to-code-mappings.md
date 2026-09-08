# Design-to-Code Mappings

This file is the manual record of how Figma components/variants map to React components
in this repo. There is no automated sync (Figma Code Connect is deliberately not used) —
this table is updated by hand whenever a component ships or a mapping changes.

## Format

| Figma component | Figma link | React component | Notes |
| --- | --- | --- | --- |
| Button | _(Figma Button V1 component — link not captured in this pass)_ | `src/components/Button/Button.tsx` | See [Button](#button) below. |
| Input | _(Figma Input V1 component — link not captured in this pass)_ | `src/components/Input/Input.tsx` | See [Input](#input) below. |

- **Figma component** — the component/variant name as it appears in the Figma library.
- **Figma link** — direct link to the node in the library file.
- **React component** — path to the component in `src/components/`.
- **Notes** — known deviations between design and implementation, if any.

## Guidelines

- Add a row when a component is first implemented, not when it's proposed.
- If Figma and code diverge after release, log it here and in `governance/decisions/`
  rather than silently reconciling one to match the other.

## Button

- React: `src/components/Button/Button.tsx`
- Styles: `src/components/Button/Button.css`
- Storybook: `src/components/Button/Button.stories.tsx` (`Components/Button`)
- Figma: Button V1 (approved), nested architecture — node reference not captured in this
  pass; add the direct link here when available.

### Figma architecture (current, authoritative)

Figma Button is two component sets, not one flat set:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Button** (outer) | Variant × Size × State | 72 | Container styling (background/border per variant+state), focus ring, loading spinner, height, radius |
| **Button Content** (nested) | Size × Icon Layout × Tone | 36 | Label, leading icon, trailing icon, Icon Layout, asymmetric icon-adjacent padding, icon gap, icon sizing, foreground Tone |

Every one of the 72 outer masters contains exactly one Button Content instance, pre-set at
author time to the matching Size and the correct Tone (see mapping below) — this is fixed
per master, not switchable, the same way Size itself is fixed per master rather than a
runtime toggle.

**Tone** (`Default` / `On-color` / `Disabled`) is Button Content's own foreground-color
axis, native to the component (bound directly to a semantic color token per Tone value),
not a per-instance override:

| Outer Variant | Non-disabled states | Disabled |
| --- | --- | --- |
| Primary | On-color | Disabled |
| Danger | On-color | Disabled |
| Secondary | Default | Disabled |
| Tertiary | Default | Disabled |

Tone token bindings: `Default` → `text/primary`, `On-color` → `text/inverse` (the same
primitive, `color/white`, that `action/primary/on-color` and `action/danger/on-color`
already resolve to — a genuinely shared token, not a borrowed one), `Disabled` →
`text/disabled`.

**Figma limitation — Icon Layout is not a top-level property (intentional, not drift).**
Nested `VARIANT`-type component properties (Icon Layout, Tone) cannot be surfaced as
top-level properties on the outer Button in current Figma behavior — only `TEXT` and
`INSTANCE_SWAP` properties merge upward from an exposed nested instance. Confirmed
directly: Label and both icon-swap properties merge to the outer instance's property
panel; Icon Layout and Tone do not, regardless of configuration. Practical effect for
designers:

- **Editable directly on any Button instance**: Variant, Size, State, Label, Leading icon,
  Trailing icon.
- **Requires drilling into the nested Button Content instance**: Icon Layout. Select the
  nested instance (not the outer Button) to change it.
- Tone and the nested Size are never designer-facing at all — they're fixed per master and
  intentionally not exposed, so there is exactly one visible Size control per instance.

**Naming requirement (load-bearing, not cosmetic).** The nested Button Content instance
inside every one of the 72 masters must be named exactly `content`. This name is how
Figma's override-preservation matches the nested instance across an outer Variant/Size/
State switch — a single master with a divergent name (e.g. Figma's auto-generated
"Button Content" default) silently drops Label/leading-icon/trailing-icon overrides for
any switch into or out of that one master, even with `isExposedInstance` and the property
references otherwise configured correctly. Both `setProperties()` and `removeOverrides()`
on a nested instance can silently revert its name back to the auto-generated default, so
any future scripted edit to a master's nested instance must re-assert
`nested.name = "content"` afterward.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Variant (Primary/Secondary/Tertiary/Danger) | `variant?: 'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | Default `'primary'`. |
| Size (Sm/Md/Lg) | `size?: 'sm' \| 'md' \| 'lg'` | Default `'md'`. |
| Label | `children: React.ReactNode` | Required. |
| Leading icon slot | `leadingIcon?: React.ReactNode` | Provider-neutral — accepts `<Icon name="..." />`, a raw provider element, or any other node. See `governance/decisions/0010-icon-token-architecture.md`. |
| Trailing icon slot | `trailingIcon?: React.ReactNode` | Same contract as `leadingIcon`. |
| Loading | `loading?: boolean` | Default `false`. See Loading parity below. |
| Disabled | native `disabled` (standard `<button>` HTML attribute, passed through) | Not a design-system-specific prop — Button extends `ButtonHTMLAttributes`. |
| State (Default/Hover/Pressed/Focus-visible/Disabled) | **not a prop** | Hover, Pressed, and Focus-visible are native CSS states (`:hover`, `:active`, `:focus-visible`) — Figma's State property is documentation/prototyping only and has no React equivalent. Disabled is the one State value with a real prop, and it's the *native* HTML `disabled` attribute, not a design-system-specific one. |
| Icon Layout (nested, None/Leading/Trailing/Both) | **no `iconLayout` prop — does not exist in code** | Purely a Figma authoring convenience for Button Content's own padding/gap variant. React derives the equivalent layout implicitly from `Boolean(leadingIcon)`/`Boolean(trailingIcon)` — there is nothing for a prop to control that isn't already implied by which icon slots are populated. |
| Tone (nested, Default/On-color/Disabled) | **no `tone` prop — does not exist in code** | Figma-internal only, used to pick the correct native foreground binding for Button Content. In code, foreground color is never a discrete state — it falls out of the CSS rules for `variant`+native state (see Color tokens below), the same way it always has. |

### Size parity

| Size | Height | Base horizontal padding (no icon) | Icon | Gap | Typography |
| --- | --- | --- | --- | --- | --- |
| Sm | 32px (component constant, not a token) | `space.inset.md` (12px) | `icon.sm` (16px) | `space.inline.xs` | `text.label.sm.medium` |
| Md | 40px (component constant, not a token) | `space.inset.lg` (16px) | `icon.md` (20px) | `space.inline.sm` | `text.label.md.medium` |
| Lg | 48px (component constant, not a token) | `space.inset.xl` (20px) | `icon.lg` (24px) | `space.inline.sm` | `text.label.lg.medium` |

Height is intentionally **not** tokenized — see `CLAUDE.md`'s "do not create speculative
control-height tokens." Radius uses `radius.control` (4px) at every size. "Base" here means
no icon on that side — see **Icon-adjacent padding** below for what changes when one is
present.

### Icon-adjacent padding

**Icon presence reduces padding on that side by one `space.inset.*` step** — the side next
to a leading or trailing icon drops to the next-smaller inset token; the opposite side (and
either side when no icon is present) keeps the size's base inset. Applies per side
independently, so "both icons" reduces both sides.

| Size | No icons | Leading only | Trailing only | Both icons |
| --- | --- | --- | --- | --- |
| Sm | `inset.md`/`inset.md` — 12/12 | `inset.sm`/`inset.md` — 8/12 | `inset.md`/`inset.sm` — 12/8 | `inset.sm`/`inset.sm` — 8/8 |
| Md | `inset.lg`/`inset.lg` — 16/16 | `inset.md`/`inset.lg` — 12/16 | `inset.lg`/`inset.md` — 16/12 | `inset.md`/`inset.md` — 12/12 |
| Lg | `inset.xl`/`inset.xl` — 20/20 | `inset.lg`/`inset.xl` — 16/20 | `inset.xl`/`inset.lg` — 20/16 | `inset.lg`/`inset.lg` — 16/16 |

(start/end, i.e. left/right in LTR)

- **Code**: derived internally from `Boolean(leadingIcon)`/`Boolean(trailingIcon)` —
  `Button.tsx` never exposes this as a prop, and `Button.css`'s `padding-inline-start`/
  `-end` overrides win by selector specificity over the base `padding-inline` shorthand, so
  only the icon-adjacent side changes. Uses logical properties (`-start`/`-end`, not
  `-left`/`-right`), so it's RTL-correct automatically — a minor implementation difference
  from Figma (below).
- **Figma**: owned natively by the nested Button Content component (Size × Icon Layout ×
  Tone, 36 variants) — each of its 12 Size×Icon-Layout combinations has this exact padding
  pair bound directly to the matching `inset/*` variable on the component itself, once,
  shared by reference across all 72 outer Button masters. This replaced an earlier
  approach (a flat 288-variant Button with Icon Layout baked in as a 4th outer axis, before
  that a 72-variant Button with the reduction applied as a per-instance padding override on
  documentation specimens) — both were real states this file went through, not
  hypotheticals; the per-instance-override approach in particular proved unreliable in
  practice and is fully retired, not just superseded. There is no override involved in the
  current architecture: switching Icon Layout on an instance simply selects a different,
  already-correctly-padded Button Content variant. See **Figma architecture** above for the
  full ownership split.
- No new spacing tokens were created — every value above is an existing
  `src/tokens/semantic/spacing.json` `inset.*` step.

### Color tokens by variant/state

| Variant | Default | Hover | Pressed (active) | Disabled |
| --- | --- | --- | --- | --- |
| Primary | bg `action.primary.default`, fg `action.primary.on-color` | bg `action.primary.hover` | bg `action.primary.active` | bg `action.primary.disabled`, fg `text.disabled` |
| Secondary | bg `action.secondary.default`, border `border.default`, fg `text.primary` | bg `action.secondary.hover` | bg `action.secondary.hover` (reused — no dedicated active token, approved V1 behavior) | bg `surface.disabled`, border `border.subtle`, fg `text.disabled` (shared disabled treatment — no dedicated token) |
| Tertiary | bg transparent, fg `text.primary` | bg `action.tertiary.hover` | bg `action.tertiary.hover` (reused — no dedicated active token) | bg `surface.disabled`, fg `text.disabled` (shared disabled treatment) |
| Danger | bg `action.danger.default`, fg `action.danger.on-color` | bg `action.danger.hover` | bg `action.danger.hover` (reused — no dedicated active token) | bg `surface.disabled`, fg `text.disabled` (shared disabled treatment, per approved V1 behavior) |

Icon color is never set directly — every icon slot uses `color: inherit`, so it always
matches the variant/state foreground above via `currentColor`. This is the code-side
equivalent of what Figma's Tone axis does structurally: in Figma, label and icon
foreground are a native Button Content variant binding keyed by Tone (`Default` →
`text/primary`, `On-color` → `text/inverse`, `Disabled` → `text/disabled` — see **Figma
architecture** above), not a per-instance color override reaching into the icon. An
earlier iteration of the Figma file did apply icon color as a deep per-instance override
from outside Button Content; it was confirmed unreliable (state-scoped, non-deterministic
on first render) and was fully replaced by the native Tone binding — there is no
production path left where a Button icon renders a hardcoded/raw color instead of a
resolved semantic token.

### Token gaps (reported, not silently filled)

- No `action.secondary.active`, `action.tertiary.active`, or `action.danger.active` token
  exists. Pressed reuses each variant's approved Hover token, per the explicitly approved
  V1 behavior. Add dedicated active tokens if a future variant needs Pressed to look
  different from Hover.
- No `action.secondary.disabled`, `action.tertiary.disabled`, or `action.danger.disabled`
  token exists (only Primary has one). These three reuse the shared disabled treatment
  (`surface.disabled` background + `text.disabled` foreground), matching the approved
  "Danger Disabled may reuse the approved shared disabled treatment" V1 behavior, extended
  to Secondary/Tertiary for consistency since they have the same gap.
- No spinner/loop motion token exists (`docs/foundations/motion.md` lists this as an
  explicit V1 gap). The spinner's `0.6s` rotation in `Button.css` is a hardcoded
  component-local constant, not a token reference.

### Loading parity

- Only the spinner is visibly shown; the label and any icons stay mounted and keep their
  layout box (`opacity: 0`, not `display: none`/`visibility: hidden`) so the button's
  width never shifts and the label text stays in the accessibility tree — the accessible
  name is unchanged while loading.
- `aria-busy="true"` is set while loading.
- Loading forces the native `disabled` attribute (`disabled || loading`), which is what
  prevents repeated activation and removes the button from the tab order — this is the
  approved native-`disabled` V1 behavior, not a custom `aria-disabled`/pointer-events
  approach that would keep the button focusable.
- Spinner uses `currentColor`, so it matches whatever foreground the variant/state has.
- Verified with no icon, leading icon, trailing icon, and both icons — see the `Loading`
  Storybook story.
- Icon-adjacent padding (see below) is derived from `Boolean(leadingIcon)`/
  `Boolean(trailingIcon)`, not from `loading` — the same padding classes apply whether or
  not `loading` is set, so entering/leaving the loading state never itself changes width.
- **Figma**: Loading is one of the outer Button's own State values (owned by the outer
  master, not Button Content) — the master contains its normal Button Content instance at
  `opacity: 0` (still in layout, matching the code's width-preservation approach above)
  plus a spinner shape, centered over the full button independent of label length or icon
  presence. The spinner is a static ring with a gap (an `arcData` annulus, not a filled
  circle), colored via the same foreground binding Button Content's label uses for that
  master — Figma has no way to show the real spin animation, so the ring-with-a-gap shape
  is what communicates "this is a loading indicator" in a still frame. Code owns the actual
  animation (`0.6s` rotation, hardcoded, no motion token — see Token gaps above); Figma's
  shape is documentation only.

### Focus-visible implementation difference (intentional)

Figma's Focus-visible is a static documentation frame; code implements it as a real
`:focus-visible` box-shadow ring (`0 0 0 2px focus.ring-offset, 0 0 0 4px focus.ring`)
layered on top of the button rather than replacing its border — this is what lets
Secondary keep its normal 1px `border.default` border visible underneath the ring.

### Icon size mapping / provider-neutral icon behavior

Button never imports `lucide-react` or `Icon` — `leadingIcon`/`trailingIcon` accept any
`ReactNode`. Button owns the icon slot's size (forced to `icon.sm`/`md`/`lg` via CSS,
regardless of what the child's own intrinsic size is), alignment, the icon-to-label gap,
and the inherited foreground color; the icon provider owns the artwork and stroke/fill
character. See `governance/decisions/0010-icon-token-architecture.md` and
`docs/foundations/icons.md` for the full contract this follows.

Lucide is the **default/reference provider** wired up in the Figma library today (Button
Content's Leading icon/Trailing icon instance-swap properties default to and preview
against Lucide-sourced icon components) — this is a starting-point choice, not a
constraint. Button itself, in both Figma and code, stays provider-neutral: swapping to a
different approved icon provider is a Button Content instance-swap change in Figma and a
different `ReactNode` passed to `leadingIcon`/`trailingIcon` in code, neither of which
requires touching Button's own definition.

## Input

- React: `src/components/Input/Input.tsx`
- Styles: `src/components/Input/Input.css`
- Storybook: `src/components/Input/Input.stories.tsx` (`Components/Input`)
- Figma: Input V1 (approved), nested architecture — node reference not captured in this
  pass; add the direct link here when available.

### Figma architecture (current, authoritative)

Figma Input is two component-set layers, following the exact same split Button
established:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Input** (outer) | Size × Interaction × Validation | 24 | Label, Show label, Support text, Show support text, container border/background per interaction+validation, focus ring, height, radius |
| **Input Content** (nested, six sets — one per Size × Tone) | Icon Layout × Content | 8 per set (48 total) | Leading icon, Trailing icon, Text, Icon Layout, asymmetric icon-adjacent padding, icon gap, icon sizing, native foreground per Content/Tone |

Interaction (Default/Hover/Focus/Disabled) and Validation (Default/Error) are two
**independent** outer axes, not one crossed enum — every combination exists as a real
Figma variant, including Focus+Error and Hover+Error, matching how a real field can be
simultaneously invalid and focused. Tone (Default/Disabled, nested) and the nested Size
are not properties a designer can see or set at all — Input Content is split into six
separate component sets, one per Size×Tone combination, specifically so there's nothing
named "Size" or "Tone" for Figma's nested-instance exposure to leak; which of the six
applies is simply which set a given outer master's nested instance belongs to, fixed at
author time.

**Figma limitation — Icon Layout and Content are not top-level properties (intentional,
same category as Button's Icon Layout).** Only `TEXT`/`INSTANCE_SWAP` nested properties
merge to the top-level panel; `VARIANT`-type ones never do. Label/Show label/Support
text/Show support text are native to the outer (always top-level, no exposure mechanism
needed). Text/Leading icon/Trailing icon are exposed from the nested instance (confirmed
working). Icon Layout/Content require drilling into the nested instance.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Size (Sm/Md/Lg) | `size?: 'sm' \| 'md' \| 'lg'` | Default `'md'`. The native HTML `size` attribute (`size?: number`) is intentionally omitted from `InputProps` via `Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>` — `size` is reserved for this prop, so the two can never collide. |
| Interaction (Default/Hover/Focus/Disabled) | **not a prop** | Hover and Focus-visible are native CSS states (`:hover`, `:focus-visible`) — Figma's Interaction property is documentation/prototyping only, same as Button's State. Disabled is the one Interaction value with a real prop, and it's the *native* HTML `disabled` attribute, not a design-system-specific one — styled via the native `:disabled` pseudo-class (via `:has()` on the field container), not a JS-computed class. |
| Validation (Default/Error) | `error?: boolean` | Default `false`. An explicit controlled flag, independent of native constraint validation (`:invalid`) — not derived from it. |
| — | `errorText?: React.ReactNode` | Shown in the support region instead of `helperText` while `error` is true. See Validation below. |
| Label | `label?: React.ReactNode` | Renders a real `<label>` associated via `htmlFor`/`id`. Omitted entirely (not an empty string) when not passed — never a placeholder substitute. |
| Show label (nested boolean) | **not a prop** | Derived: no label prop passed → no `<label>` rendered. Same "derived, not a boolean prop" pattern as Icon Layout below. |
| Support text | `helperText?: React.ReactNode` | Shown below the field unless superseded by `errorText` (see Validation). |
| Show support text (nested boolean) | **not a prop** | Derived: no `helperText`/`errorText` content → no support region rendered. |
| Icon Layout (nested, None/Leading/Trailing/Both) | **no `iconLayout` prop — does not exist in code** | Purely a Figma authoring convenience for Input Content's own padding/gap variant. React derives it implicitly from `Boolean(leadingIcon)`/`Boolean(trailingIcon)`, exactly mirroring Button. |
| Content (nested, Placeholder/Value) | **no `content`/`hasValue` prop — does not exist in code** | Native `<input>` behavior: the browser itself renders `::placeholder` vs the typed value with zero JS state. Figma needs a static axis to show both looks; code doesn't, because the DOM already does this natively. |
| Text (nested, editable string) | **not a prop — maps to native `placeholder`/`value`/`defaultValue`** | Figma-only authoring convenience (renamed from "Value" specifically to avoid implying it's the same as React's `value`). Code uses the real native attributes directly; `Text` never becomes a prop. |
| Tone (nested, Default/Disabled) | **not a prop, internal Figma implementation only** | Not designer-facing even in Figma (see Figma architecture above). In code, disabled foreground comes from the native `:disabled` pseudo-class resolving to `text.disabled` — there is no `tone` concept in code at all. |
| Leading icon slot | `leadingIcon?: React.ReactNode` | Provider-neutral — accepts `<Icon name="..." />`, a raw provider element, or any other node. See `governance/decisions/0010-icon-token-architecture.md`. |
| Trailing icon slot | `trailingIcon?: React.ReactNode` | Same contract as `leadingIcon`. |

### Size parity

| Size | Field height | Label typography | Value/placeholder typography | Support typography | Icon |
| --- | --- | --- | --- | --- | --- |
| Sm | 32px (component constant, not a token) | `text.label.sm.medium` | `text.body.sm.regular` | `text.caption.sm.regular` | `icon.sm` (16px) |
| Md | 40px (component constant, not a token) | `text.label.md.medium` | `text.body.md.regular` | `text.caption.md.regular` | `icon.md` (20px) |
| Lg | 48px (component constant, not a token) | `text.label.lg.medium` | `text.body.lg.regular` | `text.caption.md.regular` (no `caption/lg` token exists — Lg reuses `caption/md`, same gap the Figma file's own architecture notes record) | `icon.lg` (24px) |

Height is intentionally **not** tokenized, same convention as Button. Radius uses
`radius.control` (4px) at every size. Label↔field and field↔support gaps both use
`space.stack.sm` (8px) — the token's own description is literally "Label → input, field →
helper text."

### Icon-adjacent padding

Identical structure and identical values to Button's approved table — Input Content's
padding table was explicitly built to reuse Button's exact numbers, not invent new ones:

| Size | No icons | Leading only | Trailing only | Both icons |
| --- | --- | --- | --- | --- |
| Sm | `inset.md`/`inset.md` — 12/12 | `inset.sm`/`inset.md` — 8/12 | `inset.md`/`inset.sm` — 12/8 | `inset.sm`/`inset.sm` — 8/8 |
| Md | `inset.lg`/`inset.lg` — 16/16 | `inset.md`/`inset.lg` — 12/16 | `inset.lg`/`inset.md` — 16/12 | `inset.md`/`inset.md` — 12/12 |
| Lg | `inset.xl`/`inset.xl` — 20/20 | `inset.lg`/`inset.xl` — 16/20 | `inset.xl`/`inset.lg` — 20/16 | `inset.lg`/`inset.lg` — 16/16 |

(start/end, i.e. left/right in LTR) — derived from `Boolean(leadingIcon)`/
`Boolean(trailingIcon)` only, never a separate prop, using `padding-inline-start`/`-end`
so it's RTL-correct automatically. No new spacing tokens were created.

### Color tokens by interaction/validation

| State | Border | Background | Label/value/icon foreground | Support text |
| --- | --- | --- | --- | --- |
| Default | `border.default` | `surface.default` | `text.primary` (value) / `text.tertiary` (placeholder, icon) | `text.tertiary` |
| Hover | `border.strong` | `surface.default` | same as Default | `text.tertiary` |
| Focus | `border.default` + focus ring (`focus.ring`/`focus.ring-offset`, Button's box-shadow technique) | `surface.default` | same as Default | `text.tertiary` |
| Error (any non-disabled interaction) | `border.danger` (wins over Hover's `border.strong`; ring, if focused, still layers on top per Focus + Error below) | `surface.default` | unchanged — only the border and support text turn error-toned | `text.danger` |
| Disabled | `border.subtle` | `surface.disabled` | `text.disabled` (value, placeholder, icon, label) | `text.disabled` |

**Focus + Error**: the error border (`border.danger`) stays; the focus ring layers on top
via `box-shadow`, unchanged in color — the ring communicates "keyboard focus," the border
communicates "invalid," and the two are deliberately not conflated into one color, exactly
as approved in the Figma proposal.

**Disabled + Error (precedence rule)**: Disabled's container styling always wins —
`.ds-input__field:has(.ds-input__field-input:disabled)` is declared after the
`.ds-input--error` rules in `Input.css` specifically so it wins the cascade tie, matching
the approved Figma behavior where Disabled+Error renders identically to Disabled+Default.
`errorText` still renders in the support region if provided; only the border color is
suppressed — a disabled field's content shouldn't visually urge the user to act on
something they can't.

Icon color is never set directly — every icon slot uses a fixed `color` matching the
current state's foreground (`text.tertiary` normally, `text.disabled` when disabled),
mirroring Figma's Tone: icons don't turn error-red the same way the typed value doesn't,
only the border and support text do.

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<input>` — never a styled `<div>`.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`
  (`useId()`-generated when the caller doesn't supply their own `id` — the caller's `id`
  always wins). Placeholder is never used as a label substitute — enforced by the API
  shape (`placeholder` and `label` are entirely separate props, native `placeholder`
  attribute) rather than by convention alone.
- `aria-describedby` points at a generated support-text id (`${inputId}-support`) only
  when support content (`errorText` or `helperText`) is actually rendered — no dangling
  reference to a non-existent node.
- `aria-invalid="true"` set when `error` is true; omitted (not `"false"`) otherwise,
  matching Button's `aria-busy` pattern.
- `disabled` is the native HTML attribute, passed straight through.
- Focus-visible uses the native `:focus-visible` pseudo-class (via `:has()` on the field
  container) — never suppressed.
- Leading/trailing icons are `aria-hidden="true"` — the visible label/value text already
  carries the accessible name; icons never contribute a second, redundant one.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable," not claimed here.

### Icon size mapping / provider-neutral icon behavior

Input never imports `lucide-react` or `Icon` — `leadingIcon`/`trailingIcon` accept any
`ReactNode`, identical contract to Button. Input owns the icon slot's size (forced to
`icon.sm`/`md`/`lg` via CSS), alignment, the icon-to-text gap, and the fixed per-state
foreground color; the icon provider owns the artwork. Lucide is the default/reference
provider in the Figma library, not a constraint — same note as Button's.
