# Component contracts

Decision record: [ADR 0015](../../governance/decisions/0015-component-contracts.md).
Status: **rules only.** No schema or contract files exist yet (Phase 3). Until then the
"Cross-platform contract" subsections in `docs/design-to-code-mappings.md` are the record.

## What a contract is

The platform-neutral description of a component: its semantic API, states, behavior,
accessibility outcomes and token bindings. Every platform implements it natively. It is
**not** a React API, and it is **not** a code generator.

- Format: YAML, validated by JSON Schema.
- Location (Phase 3): `design/contracts/components/<kebab-name>.contract.yaml`, schema at
  `design/contracts/schema.json`.

## Rules

1. **Same meaning on all four platforms**, or it goes in `platform-notes`.
2. **Semantic names** — events by intent (`activate`, `change`, `dismiss`), mapped to each
   platform's idiom (`onClick` / `onPress` / `action:` / `onClick`).
3. **Typed slots**, never `ReactNode`: `text`, `icon` (an `IconName`; decorative unless
   stated), `action` (one interactive control with its own accessible name), `content`
   (free composition).
4. **Interaction visuals are platform-owned** — hover, pressed, focus. A contract may bind
   tokens to them but never require a state a platform doesn't have.
5. **Accessibility as outcomes** (role, name source, exposed states, announcements), never
   as a platform API.
6. **Semantic token paths only** — never Core, never `brand.*`.
7. **Visual size shared; hit target platform-owned** (web ≥ 24 px, iOS ≥ 44 pt, Android
   ≥ 48 dp). Expanding the hit target never changes the visual.
8. **Divergence is explicit** — `intentional-differences` with a reason, or it's drift.
9. **Per-platform status** — `planned | alpha | beta | stable | not-applicable`
   (`governance/component-lifecycle.md`).
10. **Contract and React agree.** Storybook stays authoritative for web behavior; conflicts
    are resolved in review.

## Field reference

| Field                     | Required | Content                                                                                |
| ------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `component`               | yes      | Shared PascalCase name (`Button`). Swift/Kotlin add `DS` / `Ds` prefixes in code only. |
| `status`                  | yes      | Map of `web`, `react-native`, `ios`, `android` → lifecycle status                      |
| `anatomy`                 | yes      | Named parts (`container`, `label`, …) — used as keys in `tokens`                       |
| `properties`              | yes      | Enums / booleans with `default`, optional `behavior` rules                             |
| `slots`                   | no       | Typed slots (`text`, `icon`, `action`, `content`) with `required` / `decorative`       |
| `events`                  | no       | Semantic events with payload shape                                                     |
| `states`                  | yes      | `shared` and `platform-owned` lists                                                    |
| `accessibility`           | yes      | `role`, `name`, `expose` (states), `announce`, notes                                   |
| `tokens`                  | yes      | Part → property → (variant / state) → semantic token path                              |
| `sizing`                  | no       | Shared visual sizes; hit-target policy                                                 |
| `figma`                   | no       | Component-set name and variant axes (validated against `properties`)                   |
| `platform-notes`          | no       | Per-platform base element / idiom / extra platform-only props                          |
| `intentional-differences` | no       | List of `{ platform, difference, reason }`                                             |

## Example — Button (illustrative; the real file is written in Phase 3)

```yaml
component: Button
status: { web: alpha, react-native: planned, ios: planned, android: planned }
anatomy: [container, label, leadingIcon, trailingIcon, spinner]

properties:
  variant: { enum: [primary, secondary, tertiary, danger], default: primary }
  size: { enum: [sm, md, lg], default: md }
  disabled: { type: boolean, default: false }
  loading:
    type: boolean
    default: false
    behavior: [preserves-width, blocks-activation, announces-busy, hides-content-visually]

slots:
  label: { type: text, required: true }
  leadingIcon: { type: icon, decorative: true }
  trailingIcon: { type: icon, decorative: true }

events:
  activate: {}

states:
  shared: [default, disabled, loading]
  platform-owned: [hover, pressed, focus]

accessibility:
  role: button
  name: label
  expose: [disabled, busy]

tokens:
  container:
    background:
      primary:
        {
          default: color.action.primary.default,
          hover: color.action.primary.hover,
          pressed: color.action.primary.active,
        }
    radius: radius.control
  label:
    color: { primary: color.action.primary.on-color }
    typography: { sm: text.label.sm.medium, md: text.label.md.medium, lg: text.label.lg.medium }

sizing:
  visual-height: { sm: 32, md: 40, lg: 48 }
  hit-target: platform-owned

figma:
  component-set: Button
  axes: { Variant: variant, Size: size, State: [states] }

platform-notes:
  web: { element: button, extra-props: [type, form, className], sibling: ButtonLink }
  react-native: { base: Pressable }
  ios: { base: 'Button + ButtonStyle', name: DSButton }
  android: { base: 'Button(colors = …)', name: DsButton }

intentional-differences:
  - platform: [react-native, ios, android]
    difference: Sm (32) keeps its visual height but expands its hit target to 44 pt / 48 dp.
    reason: Native touch-target guidance; web minimum is 24 px (WCAG 2.2 SC 2.5.8).
```

Token paths and typography roles above are placeholders to show the shape; the Phase 3
contract takes the real values from `Button.css` and `docs/design-to-code-mappings.md`.

## Platform naming of the same contract

| Contract             | Web (React)               | React Native            | SwiftUI                    | Compose                           |
| -------------------- | ------------------------- | ----------------------- | -------------------------- | --------------------------------- |
| `component: Button`  | `Button`                  | `Button`                | `DSButton`                 | `DsButton`                        |
| `variant: primary`   | `variant="primary"`       | `variant="primary"`     | `variant: .primary`        | `variant = ButtonVariant.Primary` |
| `events.activate`    | `onClick`                 | `onPress`               | `action:`                  | `onClick`                         |
| `slots.label` (text) | `children`                | `children` / `label`    | `title` / label view       | `text` / content lambda           |
| `slots.leadingIcon`  | `leadingIcon` (ReactNode) | `leadingIcon: IconName` | `leadingIcon: DSIconName?` | `leadingIcon: DsIconName?`        |
