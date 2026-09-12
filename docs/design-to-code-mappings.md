# Design-to-Code Mappings

This file is the manual record of how Figma components/variants map to React components
in this repo. There is no automated sync (Figma Code Connect is deliberately not used) —
this table is updated by hand whenever a component ships or a mapping changes.

## Format

| Figma component | Figma link | React component | Notes |
| --- | --- | --- | --- |
| Button | _(Figma Button V1 component — link not captured in this pass)_ | `src/components/Button/Button.tsx` | See [Button](#button) below. |
| Input | _(Figma Input V1 component — link not captured in this pass)_ | `src/components/Input/Input.tsx` | See [Input](#input) below. |
| Checkbox | _(Figma Checkbox V1 component — link not captured in this pass)_ | `src/components/Checkbox/Checkbox.tsx` | See [Checkbox](#checkbox) below. |
| Radio | Radio V1, page `903:9`, component set `905:44` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Radio/Radio.tsx` | See [Radio](#radio) below. |
| Radio Group | Radio Group V1, page `907:1396`, component set `907:1435` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/RadioGroup/RadioGroup.tsx` | See [Radio Group](#radio-group) below. |
| Switch | Switch V1, page `934:9`, component set `934:50` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Switch/Switch.tsx` | See [Switch](#switch) below. |
| Badge | Badge V1, page `958:9`, component set `958:1573` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Badge/Badge.tsx` | See [Badge](#badge) below. |
| Alert | Alert V1, page `961:9`, component set `961:1634` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Alert/Alert.tsx` | See [Alert](#alert) below. |
| Textarea | Textarea V1, page `961:1669`, component set `961:1811` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Textarea/Textarea.tsx` | See [Textarea](#textarea) below. |
| Select | Select V1, page `961:1846`, component set `961:2074` — see `CLAUDE.md`'s Canonical Figma Source table | `src/components/Select/Select.tsx` | See [Select](#select) below. |

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

## Checkbox

- React: `src/components/Checkbox/Checkbox.tsx`
- Styles: `src/components/Checkbox/Checkbox.css`
- Storybook: `src/components/Checkbox/Checkbox.stories.tsx` (`Components/Checkbox`)
- Figma: Checkbox V1 (approved), flat 12-variant component set — node reference not
  captured in this pass; add the direct link here when available.

### Figma architecture (current, authoritative)

Figma Checkbox is a single flat component set — unlike Button/Input, there is no nested
Content component, because there is no structurally-crossing axis (like Icon Layout) to
factor out of a larger outer cross:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Checkbox** | Selection × Interaction | 12 | Visual box (border/fill per state), checkmark/dash marks, focus ring, Label, Show label |

Selection (Unchecked/Checked/Indeterminate) and Interaction (Default/Hover/Focus-visible/
Disabled) are the only two variant axes. `Label` (TEXT) and `Show label` (BOOLEAN) are
native top-level properties — no nested-instance exposure limitation applies here, since
there's no nested instance at all.

### Selection mapping (Figma ↔ React)

Selection is not a prop in React — it's derived from two independent native-shaped props,
using this precedence:

| Figma Selection | React |
| --- | --- |
| Unchecked | `checked=false, indeterminate=false` (or both omitted) |
| Checked | `checked=true, indeterminate=false` |
| Indeterminate | `indeterminate=true` (regardless of `checked`) |

`indeterminate` wins visually whenever both `checked` and `indeterminate` are true — a
checkbox can be both `:checked` and `:indeterminate` in the DOM simultaneously (setting
the `indeterminate` DOM property does not clear `checked`), and `Checkbox.css` orders the
`:indeterminate` mark/color rules after the `:checked` ones specifically so indeterminate
wins the cascade tie. This mirrors the approved Figma precedence exactly (see the
Selection guidance section of the Figma documentation page).

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Selection (Unchecked/Checked/Indeterminate) | `checked?: boolean`, `defaultChecked?: boolean`, `indeterminate?: boolean` | See Selection mapping above. No `selection` prop exists. |
| Interaction (Default/Hover/Focus-visible/Disabled) | **not a prop, except Disabled** | Hover and Focus-visible are native CSS states (`:hover`, `:focus-visible`), same convention as Button/Input's own Interaction/State axes. Disabled is the native HTML `disabled` attribute. |
| Label | `label?: React.ReactNode` | Renders a real `<label>` associated via `htmlFor`/`id`. Omitted entirely (not an empty string) when not passed. |
| Show label (nested boolean) | **not a prop** | Derived: no `label` prop passed → no `<label>` rendered — identical pattern to Input's Show label/Show support text. |
| — (Figma has no equivalent) | `indeterminate?: boolean` | A DOM property, not an HTML attribute — see "Indeterminate implementation" below. Not settable via a plain JSX attribute the way `checked` is. |

No `selection`, `interaction`, `visualState`, `icon`, or `size` prop exists — `CheckboxProps`
is `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?, indeterminate? }`,
the smallest surface that covers the approved Figma architecture.

### Indeterminate implementation

`indeterminate` is a live DOM property with no JSX/HTML attribute equivalent (unlike
`checked`, which has a real attribute-backed prop) — React cannot set it via a plain JSX
prop. `Checkbox.tsx` synchronizes it imperatively:

1. An internal `useRef<HTMLInputElement>` is always created, merged with any ref the
   caller forwards (supporting both callback-ref and object-ref forms), so the internal
   sync works whether or not the consumer also needs the DOM node.
2. A `useEffect` keyed on `[indeterminate]` sets `internalRef.current.indeterminate =
   Boolean(indeterminate)` on every change — not just on mount — so a parent-driven
   "select all" pattern (see the `Indeterminate` Storybook story) stays correct as group
   selection changes.
3. The native `<input>` never leaves the DOM and never becomes a styled `<div>` — every
   other native behavior (`checked`/`defaultChecked`, `onChange`, `disabled`, form
   participation, Space-key activation, label click) works exactly as it would on a plain
   `<input type="checkbox">`, because it is one.

### Size parity

| | Value |
| --- | --- |
| Visual box | 16×16 (component constant, not a token — same convention as Button/Input's control heights) |
| Interaction target | 24×24 minimum (component constant), via a `position: absolute; inset: 0` native `<input>` sized to the full hit area, invisible (`opacity: 0`) but real and interactive |
| Radius | `radius.control` (4px) |

One size only — Checkbox has no Sm/Md/Lg axis in the approved Figma architecture (a
checkbox stays visually stable relative to whatever body/label text size it sits beside,
unlike Button/Input's own control sizing).

### Optical alignment (Figma → code)

The visual box is not naively centered in the 24×24 hit area. The approved Figma
alignment rule (see the Figma documentation page's Label behavior / Accessibility
sections) is: structurally top-align the checkbox + label row (required for correct
first-line alignment when a label wraps), then apply a small, fixed optical offset so a
*single-line* label still reads as vertically centered against the box.

**The numeric offset is not shared with Figma.** Figma's own measured offset (a 2.5px
shift, derived from Figma's text-layer render bounds) does not transfer to the browser —
browser font metrics/line-boxes for the same semantic token (`text.label.md.medium`) are
not pixel-identical to Figma's. **Update (2026-09-11):** Figma's label was previously
bound to raw 16px/Regular instead of the correct `font/size/sm` (14px) + `font/weight/
medium` primitives — a genuine Figma authoring bug, confirmed by comparing against
Button's and Input's own labels (both correctly bound to 14px/Medium) and fixed directly
in Figma. This did **not** change the 2.5px-vs-0.75px non-transferability conclusion
above (Figma and browser font metrics were never going to match pixel-for-pixel
regardless), but it does retire the "14px vs the 16px assumed" framing this note
previously used — Figma's own label is correctly 14px/Medium now too, matching code. The
code-side value below was measured directly against the rendered DOM in Storybook, via
`getBoundingClientRect()` on `.ds-checkbox__box` and `.ds-checkbox__label` —
**but that measurement was taken before Storybook reliably loaded the real Inter font**
(see `docs/foundations/typography.md`'s "Font loading is a consumer responsibility"
section, added the same day this Figma fix landed). The measured 0.75px value may be
tuned against a fallback system font's metrics, not Inter's — it has not been re-verified
since Storybook started self-hosting Inter via `@fontsource/inter`. Treat this number as
provisional until re-measured; do not assume it's still exactly right just because it
was rigorously measured once.

- `.ds-checkbox__control` uses `align-items: flex-start` (not `center`) specifically so
  the box's position is a **direct, linear** offset from the hit area's top — a `center`-
  aligned flex item with a margin produces a non-linear result (the browser's centering
  step re-absorbs part of any margin change), which makes the offset impossible to tune
  predictably by trial and error. `flex-start` removes that interference.
- At `top: 0` (i.e. box flush with the hit area's top, same as the label), the measured
  box center sat 0.75px *above* the label's own line-box center
  (`labelRect.top + labelRect.height / 2`).
- `Checkbox.css` closes that exact gap:

```css
.ds-checkbox__control {
  align-items: flex-start;
}
.ds-checkbox__box {
  position: relative;
  top: 0.75px; /* closes the measured 0.75px gap to the label's line-box center */
}
```

Verified after applying: `boxCenter` and `labelLayoutCenter` matched exactly (diff `0`).

Because this offset lives inside the fixed-size 24×24 hit area (not derived from the
label's own height), it has no effect on multi-line labels — the box still keys off the
row's `align-items: flex-start`, i.e. the first line, regardless of how many lines the
label wraps to. Do not copy Figma's offset value here, and do not change this value
without re-measuring against `Checkbox.stories.tsx`'s actual rendered label metrics in a
real browser; it is not an arbitrary tweak.

### Color tokens by selection/interaction

| State | Border | Background | Mark |
| --- | --- | --- | --- |
| Unchecked, Default | `border.default` | `surface.default` | — |
| Unchecked, Hover | `border.strong` | `surface.default` | — |
| Checked / Indeterminate, Default | `action.primary.default` | `action.primary.default` | `action.primary.on-color` |
| Checked / Indeterminate, Hover | `action.primary.hover` | `action.primary.hover` | `action.primary.on-color` |
| Disabled, Unchecked | `border.subtle` | `surface.disabled` | — |
| Disabled, Checked / Indeterminate | `action.primary.disabled` | `action.primary.disabled` | `text.disabled` |
| Label | — | — | `text.primary`, disabled → `text.disabled` |
| Focus | `focus.ring` / `focus.ring-offset` (box-shadow, same technique as Button/Input) | | |

No new tokens were created. Every value above is an existing semantic token, matching the
approved Figma Token mapping exactly. The mark color is never set as a separate rule per
state — `.ds-checkbox__box` sets `color`, and both SVG marks use `stroke: currentColor`,
the same inherited-color pattern Button/Input use for their icon slots.

### Checkmark / indeterminate mark ownership

Checkbox owns both marks internally as inline SVG (`Checkbox.tsx`, 16×16 viewBox, 1.6
stroke weight, round caps/joins, matching the Figma component's internal vector paths
exactly) — it never imports `lucide-react` or `Icon`, and there is no public icon prop.
Visibility is driven entirely by native CSS (`:checked`, `:indeterminate` on the input,
targeting the marks via general-sibling selectors), not React state — matching the
"internal, not provider-swappable" ownership documented on the Figma Checkbox page.

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<input type="checkbox">` — never a styled `<div>`. The `type` prop is omitted
  from `CheckboxProps` (`Omit<..., 'type'>`) and hardcoded internally so it can never be
  overridden to something else.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`
  (`useId()`-generated when the caller doesn't supply their own `id` — the caller's `id`
  always wins, same pattern as Input).
- When `label` is omitted, the caller is expected to supply `aria-label` or
  `aria-labelledby` directly — both pass through natively via `...rest`. Nothing in
  `Checkbox.tsx` synthesizes a fallback accessible name; an unlabeled checkbox with
  neither a visible label nor an ARIA name ships with no accessible name, same as any
  native `<input>` would.
- Native `:indeterminate`/mixed-state semantics — screen readers announce this from the
  DOM property directly, not from a custom `aria-checked="mixed"` (which would be
  redundant on a real native checkbox and is not applied here).
- `disabled` is the native HTML attribute, passed straight through.
- Space toggles the checkbox natively (no custom keydown handling); clicking the
  associated `<label>` toggles it natively (`htmlFor`/`id`), because the input is real.
- Focus-visible uses the native `:focus-visible` pseudo-class directly on the input
  (simpler than Input's `:has()` indirection, since the checkbox `<input>` itself is the
  interactive element the box visually represents, not wrapped inside a styled
  container).
- The visual box and both marks are `aria-hidden="true"` — purely decorative, since the
  native input already carries checkbox semantics/state.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable," not claimed here. This is
  documented implementation intent, not a certification.

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

The following state model is intended to be shared across Web React (this
implementation), React Native, SwiftUI, and Jetpack Compose, even though only Web React
exists today:

- **Shared**: Unchecked / Checked / Indeterminate, a Disabled state, label association,
  and interaction intent (focus/press feedback exists on every platform, implemented
  natively per-platform rather than as a shared prop).
- **Not shared** (platform-owned rendering): the exact focus/ripple/press visual
  treatment, and how "interaction intent" is expressed (`:focus-visible` on web vs.
  platform-native focus/ripple elsewhere).
- **Visual box**: 16×16 on every platform.
- **Interaction target**: 24×24 minimum on web (WCAG 2.2 SC 2.5.8, implemented here via
  the full-hit-area invisible `<input>`); touch/mobile platforms (React Native, iOS,
  Android) should target approximately 44×44 or the applicable platform guidance — larger
  than the web minimum, same visual box.
- Jetpack Compose's native `TriStateCheckbox` is a useful reference precedent for the
  three-value Selection model this contract assumes — see the Figma documentation page's
  Cross-platform notes section for the full rationale.

## Radio

- React: `src/components/Radio/Radio.tsx`
- Styles: `src/components/Radio/Radio.css`
- Storybook: `src/components/Radio/Radio.stories.tsx` (`Components/Radio`)
- Figma: Radio V1 (approved), flat 8-variant component set. Page `903:9` ("Radio"),
  component set `905:44`. See `CLAUDE.md`'s Canonical Figma Source table for the current
  node references.

### Figma architecture (current, authoritative)

Figma Radio is a single flat component set — same reasoning as Checkbox: there is no
structurally-crossing axis (like Button/Input's Icon Layout) to factor into a separate
nested Content component.

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Radio** | Selected × Interaction | 8 | Visual circle (border/fill per state), inner dot, focus ring, Label, Show label |

Selected (Unselected/Selected) and Interaction (Default/Hover/Focus-visible/Disabled) are
the only two variant axes — no Indeterminate; a radio has no partial-selection concept,
unlike Checkbox.

### Reference component

Radio's closest reference component is **Checkbox** — same native-input + label-
association pattern, same flat (no nested Content) architecture, same one-fixed-size
convention. Differences are deliberate, not oversights: no Indeterminate axis, a circular
(`radius.full`) visual box instead of a rounded square, and a plain filled inner dot
instead of an SVG checkmark/dash.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Selected (Unselected/Selected) | native `checked?: boolean`, `defaultChecked?: boolean` | Standard `<input>` HTML attributes, passed through. No `selected` prop exists. |
| Interaction (Default/Hover/Focus-visible/Disabled) | **not a prop, except Disabled** | Hover and Focus-visible are native CSS states (`:hover`, `:focus-visible`). Disabled is the native HTML `disabled` attribute. |
| Label | `label?: React.ReactNode` | Renders a real `<label>` associated via `htmlFor`/`id`. Omitted entirely (not an empty string) when not passed. |
| Show label (nested boolean) | **not a prop** | Derived: no `label` prop passed → no `<label>` rendered — same pattern as Checkbox's Show label. |
| — (native, no Figma equivalent) | `name?: string` | Standard `<input>` attribute, passed through via `...rest`. Sibling Radios sharing the same `name` is what gives native mutual exclusivity — Radio itself has no group concept; see [Radio Group](#radio-group). |

No `selected`, `interaction`, `visualState`, or `size` prop exists — `RadioProps` is
`Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label? }`, the smallest
surface that covers the approved Figma architecture — even smaller than `CheckboxProps`
since there's no `indeterminate` equivalent.

### Size parity

| | Value |
| --- | --- |
| Visual circle | 16×16 (component constant, not a token — same convention as Checkbox) |
| Interaction target | 24×24 minimum (component constant), via a `position: absolute; inset: 0` native `<input>` sized to the full hit area, invisible (`opacity: 0`) but real and interactive |
| Inner dot | 8×8 (component constant), shown only when Selected |
| Radius | `radius.full` (visual circle and inner dot) |

One size only — same convention as Checkbox: a radio stays visually stable relative to
whatever body/label text size it sits beside.

### Optical alignment (Figma → code) — intentionally not carried over from Checkbox

Checkbox's box position uses a specific measured offset (`top: 0.75px` on
`align-items: flex-start`), independently measured against Checkbox's own rendered DOM —
see `Checkbox.css` and this file's Checkbox section. That exact number is **not** reused
here: it was measured for Checkbox's specific box/label metrics and copying it into Radio
without re-measuring would be tuning against the wrong shape. Radio instead uses plain
`align-items: center` on `.ds-radio__control`, matching the naive geometric centering the
approved Figma file itself uses (no measured correction was applied there either — see
the Radio Figma documentation page's own note on this). Consequence: unlike Checkbox, a
multi-line wrapped Radio label centers against the full wrapped block rather than aligning
to the first line — see the `Long label / wrapping` Storybook story. Re-measure against
real rendered output (the same `getBoundingClientRect()` technique Checkbox's offset was
derived from) before promoting Radio past Alpha, and switch to Checkbox's
`flex-start` + measured-offset technique only if a real visual misalignment is found.

### Color tokens by selection/interaction

| State | Border | Background | Dot |
| --- | --- | --- | --- |
| Unselected, Default | `border.default` | `surface.default` | — |
| Unselected, Hover | `border.strong` | `surface.default` | — |
| Selected, Default | `action.primary.default` | `action.primary.default` | `action.primary.on-color` |
| Selected, Hover | `action.primary.hover` | `action.primary.hover` | `action.primary.on-color` |
| Disabled, Unselected | `border.subtle` | `surface.disabled` | — |
| Disabled, Selected | `action.primary.disabled` | `action.primary.disabled` | `text.disabled` |
| Label | — | — | `text.primary`, disabled → `text.disabled` |
| Focus | `focus.ring` / `focus.ring-offset` (box-shadow, same technique as Checkbox/Button/Input) | | |

No new tokens were created — every value above is an existing semantic token, matching
the approved Figma Token mapping exactly (verified node-by-node against Checkbox's own
variable bindings before building, not re-derived from the token names alone).

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<input type="radio">` — never a styled `<div>`. The `type` prop is omitted from
  `RadioProps` (`Omit<..., 'type'>`) and hardcoded internally, same pattern as Checkbox.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`
  (`useId()`-generated when the caller doesn't supply their own `id`).
- When `label` is omitted, the caller is expected to supply `aria-label` or
  `aria-labelledby` directly — both pass through natively.
- `disabled` is the native HTML attribute, passed straight through.
- Space (or clicking the associated `<label>`) selects the radio natively — no custom
  keydown handling.
- **Mutual exclusivity and arrow-key navigation both come from the browser once sibling
  Radios share a native `name`** — this is not something Radio itself implements; there is
  no JS-driven "only one checked" logic anywhere in `Radio.tsx`. See the `Grouped`
  Storybook story for a live demonstration with no `RadioGroup` involved.
- Focus-visible uses the native `:focus-visible` pseudo-class directly on the input.
- The visual circle and inner dot are `aria-hidden="true"` — purely decorative.
- **A lone Radio outside a labeled group is an accessibility anti-pattern** — see
  [Radio Group](#radio-group). Radio itself has no way to enforce this; it's a usage
  guideline documented on the Figma Radio page's Usage Guidance / Do-Don't cards.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable," not claimed here.

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Unselected/Selected, a Disabled state, label association, and interaction
  intent (focus/press feedback exists on every platform, implemented natively per-platform
  rather than as a shared prop) — same shape as Checkbox's own contract.
- **Not shared** (platform-owned rendering): the exact focus/ripple/press visual
  treatment.
- **Visual circle**: 16×16 on every platform.
- **Interaction target**: 24×24 minimum on web (WCAG 2.2 SC 2.5.8); touch/mobile
  platforms should target approximately 44×44, same guidance as Checkbox.
- **Mutual exclusivity**: on web, sibling Radios sharing a native `name`. Each platform
  expresses "these radios form one exclusive set" through its own native mechanism (e.g.
  a shared selection-state binding on React Native/SwiftUI/Compose) — this is a shared
  *intent*, not shared implementation code.

## Radio Group

- React: `src/components/RadioGroup/RadioGroup.tsx`
- Styles: `src/components/RadioGroup/RadioGroup.css`
- Storybook: `src/components/RadioGroup/RadioGroup.stories.tsx` (`Components/RadioGroup`)
- Figma: Radio Group V1 (approved), 2-variant component set composing Radio instances.
  Page `907:1396` ("Radio Group"), component set `907:1435`. See `CLAUDE.md`'s Canonical
  Figma Source table for the current node references.

### Why this component exists

Radio is structurally different from Checkbox in a way that matters for grouping:
Checkbox never needed a "CheckboxGroup" because each checkbox is independently meaningful
and grouping is purely visual/app-composed (see Checkbox's own "select all" Storybook
pattern, with no group component involved). Radio's mutual exclusivity is a *native HTML
requirement* — sibling `<input type="radio">`s only behave as a set when they share a
`name` — and WAI-ARIA authoring practice expects the set to have its own accessible group
name. Radio Group exists specifically to give that pairing (grouped Radios + a group
name) a real component, confirmed as a genuinely new architectural surface (not a
variation of an existing pattern) before it was built.

### Figma architecture (current, authoritative)

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Radio Group** | Validation | 2 | Legend, Show legend, Support text, Show support text; composes 3 example Radio instances in the Items region |

Unlike Button/Input/Checkbox, Radio Group's variant axis (Validation) is **not** crossed
with an Interaction axis — Interaction lives on the individual Radio children, not on the
group itself, so Validation stands alone as a single 2-value axis.

### Grouping & native semantics (confirmed decision)

Radio Group maps to native **`<fieldset>`/`<legend>`** in code — not
`role="radiogroup"`/`aria-labelledby`. This was an explicit choice between two real
options (both were presented and discussed before building): `<fieldset>`/`<legend>`
gets the group role and accessible name for free from the browser at the cost of a CSS
reset for the browser's default fieldset border/padding; `role="radiogroup"` would have
been fully stylable with no reset needed but requires manual `aria-labelledby` wiring.
`<fieldset>`/`<legend>` was chosen.

Radio Group does **not** generate or inject a shared `name` onto its children — it stays
purely structural/presentational. The consumer gives every contained `Radio` the same
`name` themselves, exactly as they would with plain HTML radios (see the `Playground`
Storybook story). This mirrors the rest of this system's consistent preference for native
HTML behavior over bespoke prop-injection abstractions (no component in this system clones
or reaches into its `children`'s props).

**Native `disabled` cascades for free.** `<fieldset disabled>` is a real, spec-defined
HTML behavior that automatically disables every descendant form control — including every
contained `Radio`'s native `<input>` — with zero extra code. This resolved what had been
an open question during the Figma pass (whether group-level Disabled needed its own
Figma variant or React prop-drilling): it needs neither. `RadioGroupProps` passes
`disabled` straight through via `...rest` (`FieldsetHTMLAttributes`), and the browser
does the rest.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Legend (TEXT) | `legend?: React.ReactNode` | Renders a native `<legend>`. Named `legend`, not `label` (unlike Input/Checkbox's `label`) — deliberately literal to what it renders, confirmed explicitly rather than defaulting to this system's usual `label` naming. |
| Show legend (BOOLEAN) | **not a prop** | Derived: no `legend` passed → no `<legend>` rendered. If omitted, the consumer must supply `aria-label`/`aria-labelledby` directly (both pass through natively) — RadioGroup must never ship with no accessible name. |
| Support text (TEXT) | `helperText?: React.ReactNode` | Shown below the items unless superseded by `errorText` — same one-region, helper-or-error pattern as Input. |
| Show support text (BOOLEAN) | **not a prop** | Derived: no `helperText`/`errorText` content → no support region rendered. |
| Validation (Default/Error, VARIANT) | `error?: boolean` | Default `false`. Changes **only** the support text color/content — deliberately no border/background change on the group, unlike Input's Validation. |
| — | `errorText?: React.ReactNode` | Shown in the support region instead of `helperText` while `error` is true. |
| Items (Radio instances) | `children: React.ReactNode` | The consumer renders `Radio` elements as children. RadioGroup does not clone/inspect them — see Grouping & native semantics above. |
| — (native, no Figma equivalent) | native `disabled` (standard `<fieldset>` HTML attribute, passed through) | Cascades to every child `Radio` natively — see above. |

### Validation — confirmed to differ from Input (important)

Input's `error` state sets a real native invalid signal: `border.danger` **and**
`aria-invalid="true"` on the `<input>`, backed by the browser's own constraint-validation
model. Radio Group's `error` **cannot** do the equivalent: `<fieldset>` has no native
invalid-state concept, and `aria-invalid` is not a standardized, reliably-announced state
on `<fieldset>` across screen readers. `RadioGroup`'s `error` is therefore a **visual and
textual signal only** — it recolors the support text and swaps its content, and sets
nothing else. `aria-describedby` on the `<fieldset>` (pointing at the generated support-
text id) is what actually associates the message with the group for assistive tech — this
is the mechanism doing the real accessibility work here, not a fieldset-level invalid
state. Do not add `aria-invalid` to `RadioGroup` in a future revision without re-deriving
whether it's actually meaningful — it wasn't for this V1.

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<fieldset>`/`<legend>` — never a styled `<div>` with ARIA bolted on.
- **Confirmed rule**: visible, native `<legend>` (via the `legend` prop) is the preferred
  way to name the group. If `legend` is omitted, the group **must** still receive an
  accessible name through `aria-label` or `aria-labelledby` passed directly to
  `RadioGroup` (both pass through via `...rest`) — RadioGroup must never silently ship
  with no accessible name at all. This is enforced by documentation/convention only (no
  runtime warning), the same level of enforcement Checkbox/Input apply to their own
  `label` prop — consistent with this codebase never adding dev-time a11y warnings.
  See the `Without legend` Storybook story.
- `aria-describedby` on the `<fieldset>` points at a generated support-text id
  (`${groupId}-support`) only when support content is actually rendered.
  Same pattern as Input.
- Arrow-key navigation between same-name Radios is native browser behavior, not something
  RadioGroup implements — see Radio's own Accessibility section.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  required before "stable" per `governance/accessibility.md`.

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: a group accessible name, an ordered set of mutually-exclusive options, a
  Disabled state that cascades to every option, and helper/error messaging for the group
  as a whole.
- **Not shared** (platform-owned): the exact mechanism for cascading Disabled (native
  `<fieldset disabled>` on web has no guaranteed equivalent elsewhere) and for grouping
  (native `name` on web vs. a shared selection-state binding on other platforms).
- **Not claimed**: an "invalid state" concept for the group on any platform — this was
  confirmed not to exist natively even on web; other platforms should be assumed to have
  the same gap unless proven otherwise.

## Switch

- React: `src/components/Switch/Switch.tsx`
- Styles: `src/components/Switch/Switch.css`
- Storybook: `src/components/Switch/Switch.stories.tsx` (`Components/Switch`)
- Figma: Switch V1 (approved), flat 8-variant component set. Page `934:9` ("Switch"),
  component set `934:50`. See `CLAUDE.md`'s Canonical Figma Source table for the current
  node references.

### Figma architecture (current, authoritative)

Figma Switch is a single flat component set — same reasoning as Checkbox/Radio: there is
no structurally-crossing axis to factor into a separate nested Content component.

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Switch** | State × Interaction | 8 | Track fill (per state), thumb, focus ring, Label, Show label |

State (Off/On) and Interaction (Default/Hover/Focus-visible/Disabled) are the only two
variant axes — no Indeterminate/partial state, same as Radio.

### Reference components

Switch's closest reference components are **Checkbox** and **Radio** — same native-input
+ label-association pattern, same flat (no nested Content) architecture, same
one-fixed-size convention. New anatomy neither reference has: a track (filled pill) and a
sliding thumb, in place of a single box+mark.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| State (Off/On) | native `checked?: boolean`, `defaultChecked?: boolean` | Standard `<input>` HTML attributes, passed through — same as Checkbox/Radio's own Selection/Selected mapping. No `on`/`state` prop exists. |
| Interaction (Default/Hover/Focus-visible/Disabled) | **not a prop, except Disabled** | Hover and Focus-visible are native CSS states (`:hover`, `:focus-visible`). Disabled is the native HTML `disabled` attribute. |
| Label | `label?: React.ReactNode` | Renders a real `<label>` associated via `htmlFor`/`id`. Omitted entirely (not an empty string) when not passed. |
| Show label (nested boolean) | **not a prop** | Derived: no `label` prop passed → no `<label>` rendered — same pattern as Checkbox/Radio's Show label. |
| — (native, no Figma equivalent) | native `type="checkbox"` + `role="switch"` (hardcoded, not overridable) | `SwitchProps` omits both `type` and `role` via `Omit<InputHTMLAttributes<HTMLInputElement>, 'type' \| 'role'>` — the established WAI-ARIA switch pattern (a real checkbox, re-announced as a switch), not a custom widget. See Accessibility below. |

No `state`, `interaction`, `visualState`, or `size` prop exists — `SwitchProps` is
`Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & { label? }`, the
same minimal shape as `RadioProps`.

### Size parity

| | Value |
| --- | --- |
| Track | 36×20 (component constant, not a token — same convention as Checkbox/Radio) |
| Thumb | 16×16 (component constant); inset from the track edge is `space.inset.3xs` (**token, not a constant** — see below) |
| Interaction target | 40×24 minimum (component constant), via a `position: absolute; inset: 0` native `<input>` sized to the full hit area, invisible (`opacity: 0`) but real and interactive |
| Radius | `radius.full` (track and thumb) |

One size only — same convention as Checkbox/Radio: a switch stays visually stable
relative to whatever body/label text size it sits beside.

### Thumb inset — synced from Figma, 2026-09-12 (token, not a component constant)

Originally built as an unbound literal (`2px`) on both sides, matching Checkbox/Radio's
own control-geometry precedent. A manual Figma edit bound the track's padding to a new
primitive, `space/3xs` (2px, scope `GAP`) — discovered during a Figma→code sync and
confirmed with the user before mirroring: added `space.3xs` to
`src/tokens/primitive/spacing.json` and `space.inset.3xs` to
`src/tokens/semantic/spacing.json` (aliasing the primitive, following the exact same
`inset.*` shape as every other inset step), generating `--space-inset-3xs`. `Switch.css`
consumes `var(--space-inset-3xs)` for the thumb's `left` offset — never a hardcoded
`2px`. This is the first consumer of `space.inset.3xs`; promote/rename only if a future
need actually diverges from what Switch established.

**Vertical inset uses a different mechanism than horizontal, on purpose** (fixed
2026-09-12 — the thumb rendered off-center vertically in Storybook): the thumb's vertical
position is `top: 50%; transform: translateY(-50%)`, not `top: var(--space-inset-3xs)`.
A hardcoded `top` offset is only correct if the track's rendered height and the token's
rem→px conversion both happen to match the assumed 20px/2px exactly — true under normal
conditions, but nothing in the CSS itself asserts either assumption, so it can silently
drift. `top: 50%`/`translateY(-50%)` derives the vertical center from the track's and
thumb's actual rendered heights directly, with no number to keep in sync. `--space-inset-
3xs` still governs the horizontal resting inset exactly as before — only the vertical
mechanism changed. See `Switch.css`'s own comment for the full reasoning.

**Component-level optical correction — `+0.5px`, not a token** (added 2026-09-12): even
structurally centered, the thumb still read as sitting slightly high against the approved
Figma reference. `translateY(calc(-50% + 0.5px))` layers a small downward nudge on top of
the structural center — `0.5px` was chosen as the smallest of `0px`/`+0.5px`/`+1px` per
design review (`0px` still read high, `+1px` read too low). **This was not confirmed via
an automated rendered-pixel comparison** — no browser-automation tooling was available
when this was authored, so the value is a reasoned, minimal, convention-based choice
(the same category of effect as Checkbox's own small measured optical offset, though
arrived at differently here) pending a human visual check in a real browser. It is a
documented component-level constant, deliberately not a foundation token — this exact
value has no claim to reuse elsewhere.

### Thumb slide — platform difference (intentional, not a token mismatch)

Figma expresses the Off/On thumb position via the track's own Auto Layout alignment
(primary-axis `MIN` for Off, `MAX` for On) — a static authoring concept with no animation
information. Code adds a real sliding transition on top (`transform: translateX(...)` +
`--motion-micro`), the same way this system already layers code-only motion onto an
otherwise-static Figma appearance (Button's spinner rotation, Checkbox's hover/selection
color transitions — neither has a literal Figma animation source either). The travel
distance is expressed as `calc(36px - 16px - 2 * var(--space-inset-3xs))`, not a bare
hardcoded number — derived from the same approved geometry (`36px track width − 16px
thumb diameter − 2× the inset token`). The `:checked` transform combines this with the
constant `translateY(-50%)` vertical-centering transform (`translateY(-50%)
translateX(...)`) — Off and On stay vertically identical because the same `translateY(-50%)`
is present in both the base rule and the `:checked` override, never dropped by one and
not the other.

### Color tokens by state

| State | Track | Thumb |
| --- | --- | --- |
| Off, Default | `switch.track.background.off.default` | `action.primary.on-color` |
| Off, Hover | `switch.track.background.off.hover` | `action.primary.on-color` |
| On, Default | `action.primary.default` | `action.primary.on-color` |
| On, Hover | `action.primary.hover` | `action.primary.on-color` |
| Disabled, Off | `switch.track.background.off.disabled` | `action.primary.on-color` |
| Disabled, On | `action.primary.disabled` | `action.primary.on-color` |
| Label | `text.primary`, disabled → `text.disabled` | — |
| Focus | `focus.ring` / `focus.ring-offset` (box-shadow, same technique as Checkbox/Radio/Button/Input) | |

**The thumb never changes color, in any state** — deliberately, unlike Radio's inner dot
(which dims to `text.disabled` when Selected+Disabled). The thumb is a position
indicator, not a state-color carrier; the track alone carries state meaning. This was a
deliberate decision made during the Figma pass, not an oversight — confirmed identical in
code (no `:disabled` override on `.ds-switch__thumb`'s `background-color` anywhere in
`Switch.css`).

**`switch.track.background.off.disabled` and `action.primary.disabled` are the same
value** (`{color.gray.300}`) — Disabled+Off and Disabled+On therefore render with an
identical track color. This is deliberate (see the token-model decision recorded in
`CLAUDE.md` and the Figma page's own Governance Note section), matching this system's
existing convention of disabled states converging toward a shared muted treatment rather
than preserving the resting-state distinction.

### Token gaps (reported, not silently filled)

None. Every color used above is an existing or newly-approved semantic token — no
approximation, no reuse of a differently-scoped token, no hardcoded value.

### New tokens (component-scoped, not promoted to a shared family)

`switch.track.background.off.default` / `.hover` / `.disabled` — added to
`src/tokens/semantic/color.json` under a new `color.switch` key, aliasing
`{color.gray.500}` / `{color.gray.600}` / `{color.gray.300}` respectively. **Deliberately
not** generalized into a shared `action.neutral.*` family: Switch is currently the only
confirmed consumer of a neutral filled interactive surface in this system. If a future
second component needs the same concept, evaluate promoting these into a shared semantic
token family at that point — this precedent is not license to add further
component-scoped color tokens without the same explicit justification.

### New token, general (not component-scoped) — `space.inset.3xs`

Added 2026-09-12 during a Figma→code sync, after the user confirmed the placement:
**general** `space.inset.3xs` (unlike the color tokens above, this one lives in the
regular `inset.*` semantic family, not a `switch.*`-scoped key), since a tight inset is a
reusable spacing concept, not something Switch-specific the way a neutral fill color was.
`src/tokens/primitive/spacing.json` gained `space.3xs` (2px, one step below the existing
smallest `2xs`/4px); `src/tokens/semantic/spacing.json` gained `space.inset.3xs` aliasing
it. See the Thumb inset section above for the full story of how this was discovered (a
manual Figma edit bound Switch's track padding to a Figma primitive with no semantic
token yet in between — flagged rather than silently mirrored, since skipping the semantic
tier would have broken this system's primitive → semantic → component rule).

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<input type="checkbox" role="switch">` — the established WAI-ARIA switch
  pattern (see [WAI-ARIA Switch Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)),
  not a custom `<div>`/`<button>` widget. `role="switch"` overrides only how assistive
  tech *announces* the control (as "switch, on/off" instead of "checkbox, checked") — it
  changes zero native behavior: `checked`/`defaultChecked`, form `name`/value
  participation, native constraint validation, Space-to-toggle, and label association via
  `htmlFor`/`id` all work exactly as they would on a plain `<input type="checkbox">`,
  because it is one.
- Both `type` and `role` are hardcoded internally and omitted from `SwitchProps` via
  `Omit<..., 'type' | 'role'>` — neither can be overridden to something else.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`
  (`useId()`-generated when the caller doesn't supply their own `id`).
- When `label` is omitted, the caller is expected to supply `aria-label` or
  `aria-labelledby` directly — both pass through natively via `...rest`.
- `disabled` is the native HTML attribute, passed straight through.
- Focus-visible uses the native `:focus-visible` pseudo-class directly on the input.
- The track and thumb are `aria-hidden="true"` — purely decorative, since the native
  input already carries switch semantics/state.
- Not yet verified: screen-reader spot-check (confirming the "switch, on/off"
  announcement specifically, not just generic checkbox announcement), 200% zoom/reflow,
  full WCAG 2.2 AA sweep — per `governance/accessibility.md`, required before "stable,"
  not claimed here.

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Off/On, a Disabled state, label association, and interaction intent
  (focus/press feedback exists on every platform, implemented natively per-platform
  rather than as a shared prop) — same shape as Checkbox/Radio's own contract.
- **Not shared** (platform-owned rendering): the exact focus/ripple/press visual
  treatment, and the thumb-slide animation curve/duration (web uses `--motion-micro`;
  other platforms should use their own native switch-animation convention, not
  necessarily the same easing).
- **Track**: 36×20 on web; other platforms should follow their own native switch sizing
  convention (e.g. iOS's system `UISwitch` dimensions, Android's Material `Switch`) rather
  than forcing this exact pixel size — the *shared* intent is "a track + sliding thumb
  binary control," not an exact cross-platform pixel match.
- **Interaction target**: 40×24 minimum on web (WCAG 2.2 SC 2.5.8); touch/mobile
  platforms should target their own platform minimum (commonly ~44×44), same guidance
  class as Checkbox/Radio.
- **Semantic role**: web uses `role="switch"` on a native checkbox input; other platforms
  should use their own native switch/toggle control type where one exists (e.g. SwiftUI's
  `Toggle`, Jetpack Compose's `Switch`) rather than reimplementing the ARIA pattern — the
  web implementation's use of a *repurposed checkbox* is a web-specific technique, not
  the shared cross-platform contract itself.

## Badge

- React: `src/components/Badge/Badge.tsx`
- Styles: `src/components/Badge/Badge.css`
- Storybook: `src/components/Badge/Badge.stories.tsx` (`Components/Badge`)
- Figma: Badge V1 (approved), flat 10-variant component set. Page `958:9` ("Badge"),
  component set `958:1573`. See `CLAUDE.md`'s Canonical Figma Source table for the
  current node references.

### Reference component

No single direct ancestor among Button/Input/Checkbox/Radio/Switch — confirmed during
the architecture pass, not assumed. Badge draws its anatomy from established typography/
color/token conventions directly, plus Button/Input's icon-slot contract for its optional
icon.

### Figma architecture (current, authoritative)

Flat component set — no nested Content layer:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Badge** | Status × Emphasis | 10 | Container fill/text color per Status+Emphasis, Label, optional icon (Show icon + Icon instance-swap) |

Status (Neutral/Info/Success/Warning/Danger) × Emphasis (Subtle/Strong) are the only two
variant axes — 10 variants is well under the ~12-variant threshold (Checkbox's precedent)
that would justify factoring out a Content layer. Icon presence is a boolean + instance-
swap property pair on the base component (mirroring Input's Label/Show label pattern),
not a variant axis, so it never multiplies the set.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Status (Neutral/Info/Success/Warning/Danger) | `status?: 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Default `'neutral'`. |
| Emphasis (Subtle/Strong) | `emphasis?: 'subtle' \| 'strong'` | Default `'subtle'`. |
| Label (TEXT) | `children: React.ReactNode` | Required. |
| Show icon (BOOLEAN) + Icon (INSTANCE_SWAP) | `icon?: React.ReactNode` | Derived: `Boolean(icon)` controls rendering, same "derived, not a boolean prop" pattern as Button/Input's icon-adjacent layout. Provider-neutral — Badge never imports an icon library. |

No `size` prop exists — one size only in V1, matching Checkbox/Radio/Switch's "stays
visually stable relative to surrounding text" precedent, a reversible (non-breaking to
add later) lean default rather than a demonstrated need.

### Color tokens by Status × Emphasis

First real consumer of `color.feedback.*` (previously provisioned in ADR 0002 but unused
by any shipped component):

| Status | Subtle background | Subtle text/icon | Strong background | Strong text/icon |
| --- | --- | --- | --- | --- |
| Neutral | `surface.sunken` | `text.secondary` | `surface.inverse` | `text.inverse` |
| Info | `feedback.info.subtle` | `feedback.info.emphasis` | `feedback.info.emphasis` | `feedback.info.on-color` |
| Success | `feedback.success.subtle` | `feedback.success.emphasis` | `feedback.success.emphasis` | `feedback.success.on-color` |
| Warning | `feedback.warning.subtle` | `feedback.warning.emphasis` | `feedback.warning.emphasis` | `feedback.warning.on-color` |
| Danger | `feedback.danger.subtle` | `feedback.danger.emphasis` | `feedback.danger.emphasis` | `feedback.danger.on-color` |

Strong backgrounds use `.emphasis`, not `.default` — the token source's own description
documents `on-color` as contrast-validated against `.emphasis`. Subtle text uses
`feedback.<status>.emphasis` uniformly across all four statuses (not `text.danger` /
`text.success` / `text.warning`, which exist for three of four but not `info`) so Badge
draws from one consistent token family rather than mixing families per status. No new
tokens were created.

### Size parity

| | Value |
| --- | --- |
| Padding | `space.inset.xs` (4px, all sides) — the token's own description literally says "Badges, tags, chips" |
| Radius | `radius.full` |
| Typography | `text.label.sm.medium` |
| Icon | `icon.sm` (16px) |

One size only — see Prop mapping above.

### Accessibility (implemented and spot-checked, not a certified audit)

- Plain `<span>`, no role by default — content reads in normal document flow like any
  inline text, the same way Checkbox/Radio decline to add ARIA the component can't be
  sure is correct for every usage.
- A consumer needing live-region behavior for a dynamically-changing badge (e.g. a live
  count) should add `aria-live` themselves via `...rest` — Badge does not guess at this.
- Icon (when passed) is `aria-hidden="true"` — decorative, since the label text already
  carries the meaning.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable."

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Status × Emphasis color intent, one fixed size, optional leading icon.
- **Not shared** (platform-owned): exact rendering of the pill shape/typography scale on
  non-web platforms should follow each platform's own compact-label convention.
- **Not claimed**: any interactive/dismissible behavior on any platform — that is a
  separate future Tag/Chip component's scope, not Badge's.

## Alert

- React: `src/components/Alert/Alert.tsx`
- Styles: `src/components/Alert/Alert.css`
- Storybook: `src/components/Alert/Alert.stories.tsx` (`Components/Alert`)
- Figma: Alert V1 (approved), flat 5-variant component set. Page `961:9` ("Alert"),
  component set `961:1634`. See `CLAUDE.md`'s Canonical Figma Source table for the
  current node references.

### Reference component

No single direct ancestor — confirmed during the architecture pass. Alert reuses the
`color.feedback.*` family (new to the system via Badge, built in the same batch), Input's
icon-slot conventions, and Checkbox's "internally-owned icon" precedent (Alert's status
icon is fixed per variant, not a consumer-facing prop, the same ownership model as
Checkbox's check/dash marks).

### Figma architecture (current, authoritative)

Flat component set — no nested Content layer:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Alert** | Status | 5 | Container fill per Status, internally-owned status icon, Title/Show title, Description, Dismissible + dismiss icon |

Status (Neutral/Info/Success/Warning/Danger) is the only variant axis — unlike Badge,
there is no Emphasis axis in V1 (subtle only, see V1 scope cuts below). Show title and
Dismissible are boolean properties on the base component, not variants — Alert stays flat
at 5 variants.

### V1 scope cuts (stated, not silently assumed)

- **Subtle emphasis only** — no solid/strong Alert background variant. Non-breaking to
  add a second `emphasis` value later if a real need surfaces.
- **No action slot** (e.g. an inline Retry button) — composing a Button correctly inside
  an Alert per status is a larger scope question, deferred to a future version.
- **No border** — relies on the tinted background alone for status signaling, consistent
  with Badge, and sidesteps the fact that `border.info` does not exist in the token set
  (a pre-existing gap, not filled speculatively here).

### Icon catalog extension (new, added alongside Alert)

Alert's status icon is internally owned (fixed per `status`, not a prop) — this required
two new entries in the shared, provider-neutral `IconName` catalog, added in lockstep
across all three required files per ADR 0010:

| DS name | Lucide implementation | Added in |
| --- | --- | --- |
| `success` | `CircleCheck` | `src/icons/types.ts`, `src/icons/providers/lucide.ts`, `docs/foundations/icons.md` |
| `danger` | `CircleX` | `src/icons/types.ts`, `src/icons/providers/lucide.ts`, `docs/foundations/icons.md` |

Both parallel the existing `info`/`warning` precedent of a name that is simultaneously
status vocabulary and an icon name. `Neutral` and `Info` both use `info`; `Success` uses
the new `success`; `Warning` uses the existing `warning`; `Danger` uses the new `danger` —
chosen specifically so Danger (circle + X) reads as visually distinct from Warning
(triangle + !), rather than reusing `warning` for both and blurring the exact distinction
Alert exists to communicate.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Status (Neutral/Info/Success/Warning/Danger) | `status?: 'neutral' \| 'info' \| 'success' \| 'warning' \| 'danger'` | Default `'info'`. |
| — (internal, no Figma property — fixed per Status) | **not a prop** | Icon is derived from `status` via an internal `STATUS_ICON` map (`Alert.tsx`) — there is no `icon` prop, the same "owned, not provider-swappable" contract Checkbox uses for its check/dash marks. |
| Title (TEXT) | `title?: React.ReactNode` | `Omit<HTMLAttributes<HTMLDivElement>, 'title'>` — the native `title` tooltip attribute is reserved for this richer prop instead, the same collision-avoidance pattern Input/Select use for `size`. |
| Show title (BOOLEAN) | **not a prop** | Derived: no `title` passed → no title rendered. |
| Description | `children: React.ReactNode` | Required. |
| Dismissible (BOOLEAN) | `dismissible?: boolean` | Default `false`. |
| — (native, no Figma equivalent) | `onDismiss?: () => void` | Called when the dismiss button is activated. Alert holds no open/closed state itself — the consumer removes it from the tree. |

### Color tokens by Status

| Status | Background | Icon | Title | Description |
| --- | --- | --- | --- | --- |
| Neutral | `surface.sunken` | `text.secondary` | `text.primary` | `text.primary` |
| Info | `feedback.info.subtle` | `feedback.info.default` | `feedback.info.emphasis` | `text.primary` |
| Success | `feedback.success.subtle` | `feedback.success.default` | `feedback.success.emphasis` | `text.primary` |
| Warning | `feedback.warning.subtle` | `feedback.warning.default` | `feedback.warning.emphasis` | `text.primary` |
| Danger | `feedback.danger.subtle` | `feedback.danger.default` | `feedback.danger.emphasis` | `text.primary` |

Icon color uses `.default`, not `.emphasis` — the token source's own description says
"Icon/accent use" for that exact step. Description is always `text.primary`, deliberately
uncolored regardless of status, so long-form body text stays readable — only the icon and
title carry the status hue. Dismiss icon uses `text.tertiary`. No new tokens were created.

### Size parity

| | Value |
| --- | --- |
| Padding | `space.inset.lg` — the token's own description literally says "Default card/panel padding" |
| Icon-to-content gap | `space.inline.md` |
| Title-to-description gap | `space.stack.xs` |
| Radius | `radius.container` (panel-level, not `radius.control`) |
| Status icon | `icon.md` (20px) |
| Dismiss icon | `icon.sm` (16px) |

One size only — no Sm/Md/Lg axis in V1.

### Accessibility (implemented and spot-checked, not a certified audit)

- No default ARIA live-region role. `role="alert"`/`role="status"` are meant for content
  dynamically inserted after page load (a toast, a form-submit error) — applying either
  unconditionally to a statically-rendered Alert would interrupt screen readers on every
  page load, a documented ARIA anti-pattern. A consumer dynamically injecting an Alert
  should pass `role` themselves; it passes through via `...rest` (see the `Dynamically
  injected` Storybook story).
- Status icon is `aria-hidden="true"` — decorative, since Title/Description already carry
  the meaning.
- The dismiss control is a real `<button type="button">` with a hardcoded
  `aria-label="Dismiss"` (no i18n override prop in V1 — a documented limitation, not a
  silent gap) and a native `:focus-visible` ring.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable."

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Status color/icon intent, optional title, required description, optional
  dismiss affordance.
- **Not shared** (platform-owned): exact dismiss-button rendering, and whether/how a
  platform surfaces a live-region equivalent for dynamically-inserted alerts.
- **Not claimed**: an action-slot or solid/strong emphasis contract on any platform — both
  are explicit V1 scope cuts, not gaps to paper over.

## Textarea

- React: `src/components/Textarea/Textarea.tsx`
- Styles: `src/components/Textarea/Textarea.css`
- Storybook: `src/components/Textarea/Textarea.stories.tsx` (`Components/Textarea`)
- Figma: Textarea V1 (approved), flat 24-variant component set. Page `961:1669`
  ("Textarea"), component set `961:1811`. See `CLAUDE.md`'s Canonical Figma Source table
  for the current node references.

### Reference component

**Input** — same field-shell shape (label, support/error text, sizes, native states).

### Figma architecture (current, authoritative)

Flat component set — no nested Content layer, unlike Input:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Textarea** | Size × Interaction × Validation | 24 | Label/Show label, native `<textarea>` field (border/background per Interaction+Validation), Support text/Show support text |

Same axis shape and count as Input's outer (24), but **flat** — Input's nested Content
layer exists solely to own its 4-value Icon Layout axis and the asymmetric padding that
comes with it; Textarea has no icon slots at all (see below), so there is no
structurally-crossing axis to factor out, the same reasoning Checkbox/Radio/Switch used
to stay flat.

### Intentional divergence from Input: no icon slots

Textarea has **no `leadingIcon`/`trailingIcon` props and no Icon Layout axis in Figma** —
icons in a height-growing, multi-line field are not an established pattern in this system
or elsewhere. This is a deliberate V1 scope decision, not an oversight.

### Intentional divergence from Input/Button: no fixed height constant

Unlike every other control in this system, Textarea has **no fixed height component
constant**. A multi-line control's height is inherently content-driven (native `rows` ×
line-height + padding), not a fixed control size — height parity is expressed through
`rows` (a native attribute, defaulted to `3` by the component) and per-size padding, not a
pixel constant.

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Size (Sm/Md/Lg) | `size?: 'sm' \| 'md' \| 'lg'` | Default `'md'`. No `Omit` needed — `<textarea>` has no native `size` attribute to collide with, unlike `<input>`. |
| Interaction (Default/Hover/Focus/Disabled) | **not a prop** | Same convention as Input — Hover/Focus-visible are native CSS states; Disabled is the native `disabled` attribute. |
| Validation (Default/Error) | `error?: boolean` | Default `false`. |
| — | `errorText?: React.ReactNode` | Same one-region, helper-or-error pattern as Input. |
| Label | `label?: React.ReactNode` | Renders a real `<label>` associated via `htmlFor`/`id`. |
| Show label (nested boolean) | **not a prop** | Derived: no `label` passed → no `<label>` rendered. |
| Support text | `helperText?: React.ReactNode` | Shown below the field unless superseded by `errorText`. |
| Show support text (nested boolean) | **not a prop** | Derived: no `helperText`/`errorText` content → no support region rendered. |
| — (native, no Figma equivalent) | `rows?: number` | Passed straight through; component defaults it to `3` when the caller doesn't supply one. |

### Size parity

| Size | Padding (all sides) | Label typography | Value typography | Support typography |
| --- | --- | --- | --- | --- |
| Sm | `space.inset.md` (12px) | `text.label.sm.medium` | `text.body.sm.regular` | `text.caption.sm.regular` |
| Md | `space.inset.lg` (16px) | `text.label.md.medium` | `text.body.md.regular` | `text.caption.md.regular` |
| Lg | `space.inset.xl` (20px) | `text.label.lg.medium` | `text.body.lg.regular` | `text.caption.md.regular` (no `caption.lg` token exists — same gap Input already documents) |

Padding is symmetric on all four sides — unlike Input, which only varies horizontal
padding to make room for icons, Textarea has no icon-adjacent asymmetry, so each size
reuses Input's own "no icon" horizontal inset value applied uniformly. Radius uses
`radius.control` (4px) at every size, same as Input.

### Color tokens by Interaction/Validation

Identical token set and precedence rules to Input's own table: `border.default` (Default),
`border.strong` (Hover), `border.danger` (Error, wins over Hover), focus ring layers on
top via `focus.ring`/`focus.ring-offset`, `border.subtle` + `surface.disabled` +
`text.disabled` (Disabled, always wins — Disabled+Error renders identically to
Disabled+Default). No new tokens were created.

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<textarea>` — never a styled `<div>`.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`.
- `aria-describedby` points at the generated support-text id only when support content is
  rendered.
- `aria-invalid="true"` set when `error` is true.
- `disabled` is the native HTML attribute.
- Focus-visible uses the native `:focus-visible` pseudo-class directly on the textarea
  (simpler than Input's `:has()` indirection, since there's no separate icon-bearing
  wrapper to target).
- **Resize stays enabled** (`resize: vertical`, never `resize: none`) — disabling it is a
  documented accessibility anti-pattern that removes a user's ability to see more of what
  they typed. The one exception is `:disabled`, where the browser itself prevents
  interaction.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable."

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Size, label, validation, disabled, support/error text, and the same
  spacing/color/typography contract as Input.
- **Not shared** (platform-owned): exact resize affordance/handle rendering, and native
  multi-line text input behavior/keyboard handling per platform.
- **Not claimed**: icon slots on any platform — explicitly out of scope for this
  component shape, not a gap.

## Select

- React: `src/components/Select/Select.tsx`
- Styles: `src/components/Select/Select.css`
- Storybook: `src/components/Select/Select.stories.tsx` (`Components/Select`)
- Figma: Select V1 (approved), flat 24-variant component set. Page `961:1846` ("Select"),
  component set `961:2074`. See `CLAUDE.md`'s Canonical Figma Source table for the
  current node references.

### Reference component

Input's field shell plus native form-control semantics — the selection/listbox behavior
itself is new, not inherited from Input.

### Confirmed architecture decision: native `<select>`

Presented as an open decision during the architecture pass and confirmed: **native
`<select>`**, not a custom listbox/combobox. Matches this system's consistent native-first
philosophy (Button/Input/Checkbox/Radio/Switch all wrap a real native element rather than
a custom ARIA widget) — full keyboard nav, mobile OS pickers, and screen-reader support
for free, with zero custom ARIA. Trade-off, accepted: the open option list is OS-rendered
chrome and cannot be styled.

### Figma architecture (current, authoritative)

Flat component set — no nested Content layer:

| Component set | Variant axes | Count | Owns |
| --- | --- | --- | --- |
| **Select** | Size × Interaction × Validation | 24 | Label/Show label, field container (border/background per Interaction+Validation), internally-owned chevron, optional leading icon (Show leading icon + Leading icon instance-swap), Support text/Show support text |

Same axis shape and count as Input's outer (24). The chevron is a fixed, always-present
internal vector — the named example in `docs/foundations/icons.md` ("use `<Icon
name="..." />` where the component itself owns a specific semantic icon, e.g. a Select's
chevron") — never a variant or property. The optional leading icon is a boolean +
instance-swap property pair (mirroring Input's Show label pattern), not a variant axis —
this is why the set stays flat instead of nesting a Content layer the way Input did for
its 4-value Icon Layout (a single optional icon has no asymmetric-padding cross-product to
factor out).

### Prop mapping

| Figma property | React prop | Notes |
| --- | --- | --- |
| Size (Sm/Md/Lg) | `size?: 'sm' \| 'md' \| 'lg'` | Default `'md'`. `Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>` is required — `<select>` has its own native `size` attribute (visible-row count), the same collision Input already solved for `<input>`. |
| Interaction (Default/Hover/Focus/Disabled) | **not a prop** | Same convention as Input. |
| Validation (Default/Error) | `error?: boolean` | Default `false`, plus `errorText?: React.ReactNode`. |
| Label / Show label | `label?: React.ReactNode` | Same pattern as Input. |
| Support text / Show support text | `helperText?: React.ReactNode` | Same pattern as Input. |
| Show leading icon (BOOLEAN) + Leading icon (INSTANCE_SWAP) | `leadingIcon?: React.ReactNode` | Derived from `Boolean(leadingIcon)`. Provider-neutral — Select never imports an icon library for this slot. |
| Chevron (internal, fixed) | **not a prop** | Internally owned — `<Icon name="chevron-down" />` inside `Select.tsx`, always rendered, `aria-hidden` + `pointer-events: none`. |
| — (Figma has no equivalent — native `<select>` has no placeholder attribute) | **not a prop** | The consumer supplies a disabled, empty-value `<option>` themselves — Select does not clone/inspect `children`, matching RadioGroup's "don't reach into children" philosophy. |
| Items (`<option>`/`<optgroup>`) | `children: React.ReactNode` | Required. Passed straight through to the native `<select>`. |

No `trailingIcon` prop exists — the trailing slot is owned by the internal chevron, not
consumer-provided, an intentional divergence from Input. `multiple` is not a supported V1
use case (not type-blocked via `Omit`, just out of the visual/architectural scope the 24
variants and chevron overlay assume).

### Size parity

| Size | Field height | Label typography | Value typography | Support typography | Icon |
| --- | --- | --- | --- | --- | --- |
| Sm | 32px (component constant, not a token — same convention as Input) | `text.label.sm.medium` | `text.body.sm.regular` | `text.caption.sm.regular` | `icon.sm` (16px) |
| Md | 40px (component constant) | `text.label.md.medium` | `text.body.md.regular` | `text.caption.md.regular` | `icon.md` (20px) |
| Lg | 48px (component constant) | `text.label.lg.medium` | `text.body.lg.regular` | `text.caption.md.regular` (no `caption.lg` token — same gap Input documents) | `icon.lg` (24px) |

Radius uses `radius.control` (4px) at every size, same as Input. Icon-to-text gap uses
`space.inline.sm`.

### Color tokens by Interaction/Validation

Identical token set and precedence rules to Input's own table — `border.default` /
`.strong` (Hover) / `.danger` (Error) / `.subtle` + `surface.disabled` (Disabled, always
wins), focus ring via `focus.ring`/`focus.ring-offset`. Chevron and leading icon use
`text.tertiary` normally, `text.disabled` when disabled — same fixed-per-state foreground
pattern Input's own icon slots use. No new tokens were created.

### Accessibility (implemented and spot-checked, not a certified audit)

- Native `<select>` — full role/state/keyboard semantics (arrow-key navigation, type-
  ahead, screen-reader announcement of value and position) for free, with **zero custom
  ARIA** — the single biggest accessibility win of the native-element decision above.
- `<label>` renders only when `label` is passed, associated via `htmlFor`/`id`.
- `aria-describedby`/`aria-invalid` — same pattern as Input.
- `disabled` is the native HTML attribute.
- Chevron is `aria-hidden="true"` and `pointer-events: none` — purely decorative overlay;
  clicks pass through to the native control beneath it, which is what actually opens the
  option list.
- Not yet verified: screen-reader spot-check, 200% zoom/reflow, full WCAG 2.2 AA sweep —
  per `governance/accessibility.md`, required before "stable."

### Cross-platform contract (shared design intent, not yet implemented elsewhere)

- **Shared**: Size, label, validation, disabled, an internally-owned "expand" affordance,
  and the intent "choose one from a fixed set of options."
- **Not shared** (platform-owned): the exact picker UI — other platforms should use their
  own native picker (SwiftUI `Picker`, Jetpack Compose `DropdownMenu`/`Spinner`) rather
  than reimplementing a web-style dropdown; the *shared* contract is "a native OS picker
  for one-of-many," not a pixel-identical popup.
- **Not claimed**: search/filter or multi-select on any platform — both are out of V1
  scope, not gaps.
