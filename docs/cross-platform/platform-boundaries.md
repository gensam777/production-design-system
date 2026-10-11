# Platform boundaries — what is shared, what stays native

Decision record: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md).

## The rule

A property, state or behavior is **shared** only if it means the same thing on web, React
Native, SwiftUI and Compose. Everything else is **platform-owned** — recorded in the
component contract's `platform-notes` / `intentional-differences`, never forced into a
shared shape.

| Shared (platform-neutral)                                     | Platform-owned                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| Semantic token names and resolved values per brand            | Units, transforms, how the theme is injected                  |
| Component name, enums, defaults, typed slots, semantic events | Native element / view, event idiom, prop-naming idiom         |
| State model, behavior rules                                   | Hover / pressed / focus visuals, ripple, haptics              |
| Accessibility outcomes                                        | Accessibility APIs, focus model, keyboard, target-size values |
| Icon catalog (`IconName`) and sizes (`sm`/`md`/`lg`)          | Icon asset format, provider binding                           |
| Pattern intent and rules                                      | Layout primitives, navigation, adaptive strategy              |
| Content and usage guidance                                    | Platform-only props                                           |

## Components

### Web/DOM-specific — never in a shared contract

- `extends *HTMLAttributes<…>`, `...rest` spreading, DOM `forwardRef` targets.
- `className`, `id` / `htmlFor` / `useId` wiring, `aria-*`, `type="submit"`, `form`, `name`,
  `autoComplete`, the native `size` attribute.
- `ReactNode` slots — the contract uses typed slots instead (ADR 0015).
- `href` and anchor semantics (Link, ButtonLink, AppShell nav items) — navigation is owned by
  each platform's router.
- Tooltip `placement` and `@floating-ui/react`.

### Per-component readiness

| Component                      | Shared contract                                                                                                                             | Native fit                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Button                         | variant, size, disabled, loading (width-preserving, blocks activation, announces busy), label, decorative leading/trailing icon, `activate` | High — custom-styled native button everywhere. **First reference component.**                                                              |
| Switch                         | on/off, disabled, label, `change`                                                                                                           | Highest — native `Toggle` / `Switch` / RN `Switch`. Second reference component.                                                            |
| Checkbox                       | unchecked / checked / indeterminate, disabled, label                                                                                        | Medium — Compose `TriStateCheckbox`; iOS has no checkbox (custom-drawn + traits).                                                          |
| Radio, RadioGroup              | exclusive selection, group label, validation                                                                                                | Medium — iOS idiom is a checkmark list / inline `Picker`. Web `fieldset`/`legend` is web-only.                                             |
| Input, PasswordInput, Textarea | label, helper / error text (error replaces helper, falls back to helper), size, decorative icons, trailing action, secure entry             | High in concept; keyboard type, autofill and IME actions are platform-owned.                                                               |
| Select                         | single choice from a list; the closed state looks like a field                                                                              | Concept only — `<select>` / `Picker`·`Menu` / `ExposedDropdownMenuBox`; React Native has no built-in.                                      |
| Badge, Divider                 | visual contract                                                                                                                             | Trivial.                                                                                                                                   |
| Card                           | variant (outlined / elevated), padding, free `content` slot                                                                                 | High; elevation needs the per-platform mapping (token-portability).                                                                        |
| Alert                          | status, title, body, dismissible, internally owned status icon, no announcement by default                                                  | High; announcement APIs are platform-owned.                                                                                                |
| Accordion                      | item expanded / collapsed, header activation                                                                                                | Medium — SwiftUI `DisclosureGroup`; Compose custom.                                                                                        |
| Tabs                           | in-page view switcher; `value` / `defaultValue` / `change`                                                                                  | **Divergent** — iOS segmented `Picker` (`TabView` is app navigation); Compose `TabRow`. Arrow-key automatic activation is a web ARIA rule. |
| Link                           | navigational text action                                                                                                                    | Web-centric; native uses router or `Link(destination:)` for external URLs.                                                                 |
| ButtonLink                     | —                                                                                                                                           | **Web-only** (`not-applicable` elsewhere).                                                                                                 |
| Tooltip                        | supplementary label                                                                                                                         | **Not ported to phone platforms** — maps to an accessibility hint / long-press; iPadOS pointer `.help` is optional.                        |

### Behaviors shared conceptually

Loading semantics; error-text priority; controlled / uncontrolled value with a change event;
decorative-by-default icons; internally owned fixed icons (Alert status, Select chevron,
PasswordInput toggle); Alert's "no live announcement by default"; Tabs' automatic activation
_intent_ (selection follows focus/navigation).

### Must remain native

Focus visuals (`:focus-visible` ring vs. native focus / ripple), press feedback, hover
(absent on touch; present with iPadOS pointer and Android mouse), keyboard models, hit-target
expansion, text-input keyboards and autofill, haptics, gestures.

## Patterns

| Pattern              | Classification                                  | Native direction                                                                                     |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Form validation      | **Cross-platform concept**                      | Same rules (inline error, summary, focus first invalid, announce); native focus + announcement APIs. |
| Settings section     | **Concept shared, separate implementations**    | iOS `Form`/`List` `Section`; Android preference-style list. Not the web card layout.                 |
| Action group         | **Concept shared, order/layout platform-owned** | Hierarchy shared; button order and stacking follow HIG / Material.                                   |
| Page header          | **Mostly web**                                  | Native navigation bar title (`navigationTitle`, `TopAppBar`); only content hierarchy is shared.      |
| App shell            | **Web-only**                                    | `TabView` / `NavigationSplitView`; Compose `NavigationSuiteScaffold`.                                |
| Centered card layout | **Web-only**                                    | Mobile-app auth screens are a plain surface (see `src/examples/MobileLogin/`).                       |

Product examples (`src/examples/`) are reference screens, not portable code. `MobileLogin`
is a web rendering of a mobile-app design and is the natural acceptance target for the first
native screen.

## Layout and responsive — four different concepts

| Concept                  | Mechanism                                                                                                                                                        | Tokens                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Web responsive**       | `@media (min-width)` at 768 / 1024 / 1280 for page/app-shell; container queries for components                                                                   | `viewport.*`, `layout.container.maxWidth` → **web platform tier** (ADR 0014) |
| **Mobile device layout** | Safe areas, fluid width, keyboard avoidance, OS chrome; no breakpoints                                                                                           | Spacing only                                                                 |
| **Tablet layout**        | Split views, multi-column, both orientations, pointer + keyboard, multitasking widths                                                                            | Spacing only                                                                 |
| **Native adaptive**      | iOS size classes (compact / regular); Compose `WindowSizeClass` (compact < 600dp, medium 600–840, expanded ≥ 840); RN `useWindowDimensions` + an explicit policy | None of the web values                                                       |

**CSS breakpoints do not apply to native.** 768 is not 600dp, and size classes are not
widths. If a shared vocabulary is ever needed it is a semantic _layout intent_
(`compact | medium | expanded`) that each platform resolves from its own signal — web from
`viewport.*`. Not introduced until a real cross-platform pattern needs it.

## Icons

- **Shared:** the `IconName` catalog (today `src/icons/types.ts`, 18 names) and `IconSize`
  (`sm`/`md`/`lg` → 16/20/24). In Phase 2+ the catalog becomes a platform-neutral manifest
  (`design/icons/manifest.json`) that generates a TS union, Swift `enum DSIconName: String`,
  Kotlin `enum class DsIconName`.
- **Artwork:** Lucide everywhere by default — SVG → web (`lucide-react`), React Native
  (`lucide-react-native` / `react-native-svg`), iOS asset catalog (template-rendered), Android
  VectorDrawable (generated). Each platform has a provider file mapping `IconName` → artwork,
  as `src/icons/providers/lucide.ts` does today; a platform may swap providers without
  changing the catalog.
- **Color:** always inherited — `currentColor` / `.foregroundStyle` (template image) /
  `LocalContentColor` / an explicit RN `color` from the parent component's foreground token.
- **Accessibility:** decorative by default; a label makes it a meaningful image. Icon-only
  interactive controls are IconButton's job on every platform, never Icon's.
