# Icon Foundation (V1)

Status: implemented (Figma + code, Button not yet updated to consume it). See
`governance/decisions/0010-icon-token-architecture.md` for the architectural decisions
behind this foundation.

## Provider model

```
Design System icon contract
  → default provider: Lucide (lucide-react)
  → future provider: Phosphor / another approved library (not built yet)
```

This design system does not own or redraw a full icon library. It owns a small,
provider-neutral **contract** — stable names, approved sizes, color behavior,
accessibility rules, and component integration — that any approved provider can fill.
Lucide is the current default/reference provider, not a hard-wired dependency: no public
API in this codebase exposes a Lucide-specific name.

## Stable DS icon names

`IconName` (`src/icons/types.ts`) — the only names a consumer may pass to
`<Icon name="..." />`:

| DS name        | Lucide implementation |
| -------------- | --------------------- |
| `plus`         | `Plus`                |
| `minus`        | `Minus`               |
| `check`        | `Check`               |
| `close`        | `X`                   |
| `search`       | `Search`              |
| `arrow-left`   | `ArrowLeft`           |
| `arrow-right`  | `ArrowRight`          |
| `chevron-down` | `ChevronDown`         |
| `chevron-up`   | `ChevronUp`           |
| `info`         | `Info`                |
| `warning`      | `TriangleAlert`       |
| `trash`        | `Trash`               |
| `edit`         | `Pencil`              |
| `settings`     | `Settings`            |

This is a small starter set, not the full Lucide catalog. Add a name only when a real
component/product needs it — see `governance/decisions/0010-icon-token-architecture.md`
for what updating this list requires.

## Sizes

Approved display sizes, matching the Figma Icons foundation exactly:

| Size           | Value | Semantic token | Primitive token |
| -------------- | ----- | -------------- | --------------- |
| `sm`           | 16px  | `icon.sm`      | `size.icon.sm`  |
| `md` (default) | 20px  | `icon.md`      | `size.icon.md`  |
| `lg`           | 24px  | `icon.lg`      | `size.icon.lg`  |

- `size.icon.*` (`src/tokens/primitive/icon.json`) is the raw scale, no meaning attached.
- `icon.*` (`src/tokens/semantic/icon.json`) is what `Icon.tsx` actually consumes, as a
  CSS custom property (`var(--icon-sm)`, `var(--icon-md)`, `var(--icon-lg)`) — the same
  consumption pattern as every other semantic token in this system.
- Px in both source and generated CSS, not rem — same reasoning as radius/shadow/
  viewport: icon size is fixed visual geometry paired with a fixed-px control, not
  something that should scale independently with root font-size.
- **Do not use spacing tokens for icon sizing.** `space.*` answers "how much space
  between things"; `icon.*` answers "how big is this icon" — two different questions
  that happen to share some numeric values by coincidence, not by design.

## Icon component

```tsx
import { Icon } from 'production-design-system';

<Icon name="plus" size="md" />;
```

| Prop         | Type                   | Default    | Notes                                            |
| ------------ | ---------------------- | ---------- | ------------------------------------------------ |
| `name`       | `IconName`             | _required_ | Provider-neutral catalog name (see table above). |
| `size`       | `'sm' \| 'md' \| 'lg'` | `'md'`     | Maps to the semantic `icon.*` tokens.            |
| `className`  | `string`               | —          | Passed through to the rendered SVG.              |
| `aria-label` | `string`               | —          | See Accessibility below.                         |

Deliberately **not** exposed: an arbitrary `color` prop, a `strokeWidth`/stroke-style
prop, any Lucide-specific prop, or an arbitrary numeric `size`. Color and stroke style
are provider/parent-controlled, not something a consumer should override per-instance —
see Color behavior below.

## Color behavior

Icons render with `currentColor` (Lucide's own default when no `color` prop is passed —
`Icon` never passes one). The `Icon` component owns no semantic action colors itself:
whatever CSS `color` is in effect on the icon's parent is what the icon renders in. This
is what lets a future Button apply its own semantic foreground token once (on the
button's text/icon color), and have both the label and any icon inherit it automatically
— no separate icon color prop, no risk of the icon and label drifting out of sync.

Never hardcode black, white, brand blue, or any other literal color for an icon.

## Accessibility

| Usage                               | Behavior                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Decorative icon beside visible text | `aria-hidden="true"` (default — no `aria-label` passed)                                                    |
| Meaningful standalone icon          | Pass `aria-label`; `Icon` renders `role="img"` with that label instead of `aria-hidden`                    |
| Icon-only interactive action        | Not `Icon`'s job — belongs to a future `IconButton`, which owns the accessible label on the control itself |

`Icon` always renders `focusable={false}` and stays presentational/non-interactive — it
is never turned into a button, link, or other interactive element itself.

## Reusable-component consumption rule

Reusable components should **not** import `lucide-react` (or any icon library) directly.
They should either:

- receive icon content as `React.ReactNode` from the consumer (Button's approach, see
  below), or
- use `<Icon name="..." />` where the component itself owns a specific semantic icon
  (e.g. a Select's chevron).

### Button specifically

Button has not been implemented yet, but its planned icon props are already decided and
must not change when it ships:

```ts
leadingIcon?: React.ReactNode;
trailingIcon?: React.ReactNode;
```

Button must not import Lucide (or `Icon`) directly. A consuming product passes whatever
it wants into these slots — a raw `lucide-react` element, an `<Icon name="..." />`, or
any other `ReactNode` — and Button only controls layout: size, alignment, and the gap
between icon and label, via its own semantic tokens.

## Figma ↔ code parity

|                      | Figma                                                                               | Code                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Default provider     | Lucide Icons (Community)                                                            | `lucide-react`                                                                                            |
| Sizes                | `size/icon/sm·md·lg` → `icon/sm·md·lg` (16/20/24)                                   | `size.icon.sm·md·lg` → `icon.sm·md·lg` (16/20/24)                                                         |
| Color                | Instance override per Button variant, bound to the same semantic token as the label | `currentColor`, inherited from the parent                                                                 |
| Provider-neutral API | Button's instance-swap properties are not Lucide-specific                           | Button's `leadingIcon`/`trailingIcon` accept any `ReactNode`; `Icon`'s `name` prop is not Lucide-specific |

**Not claimed**: identical vector artwork between the Figma Lucide library and the
`lucide-react` npm package. Both are named "Lucide" and track the same upstream icon
set, but this hasn't been verified pixel-for-pixel between the specific connected Figma
library version and the installed `lucide-react` version — treat them as the same
_icon intent_, not a guaranteed-identical asset, until checked.

## Known gap

Icon size variables existed in Figma (`size/icon/*`, `icon/*`) before this code
mirror was built. That gap is now closed by this foundation — flagging it here per
0010's "report the parity gap before hardcoding a competing system" rule, for the
record.

## Figma Variables (implemented)

- **`Primitive` collection**, scope `["WIDTH_HEIGHT"]`: `size/icon/sm` (16), `size/icon/md`
  (20), `size/icon/lg` (24).
- **`Semantic Icon` collection** (dedicated, single `Default` mode): `icon/sm`, `icon/md`,
  `icon/lg`, each aliasing the matching primitive above.
