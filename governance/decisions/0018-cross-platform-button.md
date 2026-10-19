# 0018: Cross-platform Button — platform versions and contract decisions

- **Status**: Accepted — decisions approved 2026-10-12 (Phase 5 of
  [0013](./0013-cross-platform-architecture.md)). Web, Figma alignment and React Native
  implemented (React Native 2026-10-19); SwiftUI and Compose pending.
- **Date**: 2026-10-12
- **Related**: [0010](./0010-icon-token-architecture.md), [0015](./0015-component-contracts.md),
  [0016](./0016-native-token-mappings.md), [0017](./0017-workspace-structure.md),
  [0019](./0019-icon-catalog.md),
  [`button.contract.yaml`](../../design/contracts/components/button.contract.yaml)

## Context

Phase 3 left the Button contract with five open questions and two web implementation gaps,
and Phase 4 left the native build decisions (deployment targets, Android toolchain, React
Native range) for the first native component. Phase 5 builds Button on React Native, SwiftUI
and Compose and brings web in line with the contract first.

## Decision

### Platform versions

| Item                  | Decision                                                                                                                                    | Trade-off                                                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS                   | 17.0                                                                                                                                        | iOS 16 adds a few percent of devices but lacks `@Observable` and newer SwiftUI accessibility/focus APIs `PDSUI` will want over its life.                                                                            |
| macOS                 | 14.0 — build and test host only, not a supported product platform                                                                           | Package platforms are package-wide; macOS 14 lets `PDSUI` compile and run unit tests without a simulator. SwiftUI does not build on Linux: the Linux CI job builds `--target PDSTokens`, a macOS job tests `PDSUI`. |
| Swift                 | tools 6.0, Swift 6 language mode (unchanged)                                                                                                |                                                                                                                                                                                                                     |
| React Native          | peer `react-native >=0.81.0`, `react >=19.1.0`; development pinned to the React Native version of the newest Expo SDK                       | Button is pure JS; a floor below the upstream support window (latest three minors) is low-risk and covers Expo SDK 54+. CI tests the pinned version only.                                                           |
| Android minSdk        | 23                                                                                                                                          | The AndroidX floor; a library should not be stricter than its dependencies.                                                                                                                                         |
| Android compileSdk    | 36                                                                                                                                          | Newest Compose releases need 37, and a library compiling against 37 forces consumers to 37. Bump in a minor release when 37 is common.                                                                              |
| Android Gradle Plugin | 9.1.x, with a committed Gradle wrapper at the Gradle 9.x version AGP requires                                                               | AGP 9 has built-in Kotlin: no separate `kotlin-android` plugin.                                                                                                                                                     |
| Kotlin                | 2.2.x for `:tokens` and `:compose`; Compose compiler plugin at the same version; JVM 17                                                     |                                                                                                                                                                                                                     |
| Compose               | `platform(BOM)` at the newest BOM that supports compileSdk 36; `foundation`, `ui`, `animation`, `ui-tooling-preview` only — **no Material** | Avoids coupling to Material theming; consumers' BOMs can override upward.                                                                                                                                           |

Exact patch versions are pinned when each native module lands, against the then-current
compatibility tables.

### Button contract decisions

1. **Disabled colors.** Filled variants (primary, danger) swap their color for the neutral
   disabled fill (`color.action.primary.disabled`, new `color.action.danger.disabled` =
   gray.300); outline (secondary) and ghost (tertiary) keep their container and only the
   label and icons fade to `color.text.disabled`. Replaces the web V1 shared treatment
   (`surface.disabled` for secondary/tertiary/danger), which made a disabled ghost button gain
   a fill and disagreed with Figma.
2. **Height.** `visual-height` is a **minimum** (`sizing.height: minimum`). Block padding
   `space.inset.xs / sm / sm` lets the button grow with the label under text scaling instead
   of clipping it; at the default text size it is exactly 32 / 40 / 48. The label may wrap
   rather than truncate when scaled text no longer fits. On native platforms icons and the
   spinner scale with the label (iOS `@ScaledMetric` on the label's text-scaling anchor,
   Android `sp`, React Native font scale); on web they stay px (ADR 0010).
3. **Figma typography.** Button Content labels use the `text/label/{sm,md,lg}/medium` text
   styles (line height 125%), not Core font-size variables.
4. **Figma icon sizes.** Icon instances and the spinner bind to `icon/sm|md|lg`.
5. **Spinner thickness.** 2 (px / pt / dp) at every size, inside the spinner box, flat ends,
   270° arc. Figma's ring becomes inner radius 0.75 / 0.80 / 0.8333.
6. **Spinner motion.** New semantic `motion.spinner` — a transition composite (Core
   `motion.duration.loop` 600 ms + `motion.easing.linear`, delay 0) so every emitter handles
   it unchanged. Reduced motion stops the rotation; busy stays exposed.
7. **On-color.** Label, icons and spinner use `color.action.{primary,danger}.on-color`. Figma's
   Tone axis splits into Default / On-primary / On-danger / Disabled (Button Content
   36 → 48 variants), because one tone can't bind two variables and per-instance overrides
   don't survive icon swaps.
8. **Loading** keeps the variant colors, stays focusable, exposes busy and blocks activation;
   **disabled wins** over loading (precedence disabled > loading > default).

### Web implementation (done)

`Button.tsx`: native `disabled` follows `disabled` only; `isLoading = loading && !disabled`
drives `aria-busy`, the spinner and the loading class; a click while loading is
default-prevented (also stops form submission) and doesn't reach `onClick`. `Button.css`: the
disabled rule above, `min-height` + `padding-block`, hover/pressed excluded while loading,
`animation: ds-button-spin var(--motion-spinner) infinite`. Public props unchanged; the
behavior change is an alpha change (see `governance/versioning.md`).

### React Native implementation (done, 2026-10-19)

`@pds/react-native` `Button` + `PDSThemeProvider` / `usePDSTheme`. Development is pinned to
Expo SDK 58 (React Native 0.88.0, React 19.3.0 — the whole workspace now shares React 19.3.0,
`react-dom` included, within `@pds/react`'s existing range; Node ≥ 22.13). `Pressable` with
`accessibilityState { disabled, busy }`; `isLoading = loading && !disabled` blocks `onPress`
without disabling, and adds a localized `accessibilityValue` (`loadingAccessibilityValue`,
default "Loading") because busy alone isn't announced everywhere — this replaces the planned
`loadingAccessibilityLabel` name, which would have suggested renaming the button. Hit-slop to
44pt / 48dp from the measured size (6/2/0 · 8/4/0 at the default text size). Label
`allowFontScaling` + iOS `dynamicTypeRamp`, no line limit; icons and spinner × font scale.
Spinner: `react-native-svg` 270° arc, 2 stroke, `motion.spinner` loop, static under Reduce
Motion; container colors animate on `motion.micro` and snap under Reduce Motion. Android draws
the contract focus indicator (no system effect on a custom pressable); iOS keeps its own.
`style` is layout-only. The token bindings are kept as contract paths
(`Button.tokens.ts`); Jest compares them to the contract cell by cell and resolves each in
both brands, and `contracts:validate` gained a `react-native-reference` check. Fonts stay
unbundled: `fontsLoaded` selects the brand faces, otherwise the system family at the same
weight. Preview: `packages/react-native-example` (Expo).

## Consequences

- Both Phase 3 implementation gaps are closed; the contract tests now guard the behavior
  (`npm run contracts:test`).
- Token output adds `color.action.danger.disabled`, `motion.duration.loop`,
  `motion.easing.linear` and `motion.spinner` on every platform; every existing web CSS/JS
  value is unchanged (reviewed snapshot update).
- Live Figma was aligned on 2026-10-12: `action/danger/disabled`, minimum-height masters with
  bound vertical padding, label Text Styles, `icon/*`-bound icon and spinner sizes, a 2px
  spinner ring, the Tone split (Button Content 36 → 48 variants), and reference motion
  variables (`motion/duration/loop`, `motion/easing/linear`, `spinner/duration`,
  `spinner/easing` — Figma cannot bind motion variables to a node). The contract has no open
  questions; the Focus-visible rendering difference stays intentional.
- The React Native Button is implemented (contract status `alpha`); SwiftUI and Compose
  Buttons follow the plan in `docs/cross-platform/migration.md` (Phase 5), one pull request
  per platform.
