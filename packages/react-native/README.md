# @pds/react-native

React Native reference implementation of the shared component contracts in
[`design/contracts/`](../../design/contracts/) — Phase 5 (ADR
[0013](../../governance/decisions/0013-cross-platform-architecture.md),
[0018](../../governance/decisions/0018-cross-platform-button.md)). Components read the
generated, brand-aware React Native token themes (`@pds/tokens/react-native`) through
`PDSThemeProvider`. Never import `@pds/react` (DOM components) or web CSS here.

| Status | Component                                                                     |
| ------ | ----------------------------------------------------------------------------- |
| alpha  | `Button` — [contract](../../design/contracts/components/button.contract.yaml) |

A library, not an app: it ships TypeScript source (the consuming app's Metro compiles it).
The visual preview is the Expo app in [`packages/react-native-example`](../react-native-example/).

## Requirements

Peer dependencies: `react >=19.1.0`, `react-native >=0.81.0`, `react-native-svg ^15`
(ADR 0018). `lucide-react-native` is a dependency pinned to the icon catalog's provider
version (`design/icons/icons.json`, ADR 0019). Development is pinned to Expo SDK 58's
React Native 0.88.0 / React 19.3.0 and needs Node ≥ 22.13.

## Usage

```tsx
import { Button, PDSThemeProvider } from '@pds/react-native';

export function Checkout({ fontsLoaded }: { fontsLoaded: boolean }) {
  return (
    <PDSThemeProvider brand="brand-b" fontsLoaded={fontsLoaded}>
      <Button leadingIcon="check" loading={submitting} onPress={submit}>
        Place order
      </Button>
    </PDSThemeProvider>
  );
}
```

### Theme

- `PDSThemeProvider` — `brand` (`'brand-a' | 'brand-b'`, default `brand-a`), `fontsLoaded`
  (default `false`). Providers nest, so a subtree can switch brand (web's `data-brand` on a
  container). Without a provider components use the default brand with system fonts.
- `usePDSTheme()` — `{ brand, theme, fontsLoaded, textStyle }`. `theme` is the generated
  `Theme`; `textStyle(theme.typography.body.md.regular)` returns a React Native text style.
- `resolveTextStyle(theme, token, { fontsLoaded })` — the same, outside React.
- **Fonts are not bundled** (ADR 0016). Register each brand's faces under the PostScript
  names in `theme.fonts.sans.faces[].postScriptName` (e.g. with expo-font, see the example
  app's `src/fonts.ts`), then pass `fontsLoaded`. Until then text uses the platform system
  family (`System` / `sans-serif`) at the same weight — never another brand's family.
- `useReducedMotion()` — the OS reduce-motion setting, live.
- `IconName` — the catalog names (same union as web). The Lucide artwork stays internal.

### Button

| Prop                        | Type                                                 | Default     |
| --------------------------- | ---------------------------------------------------- | ----------- |
| `children`                  | `string` — the label and accessible name             | required    |
| `variant`                   | `'primary' \| 'secondary' \| 'tertiary' \| 'danger'` | `'primary'` |
| `size`                      | `'sm' \| 'md' \| 'lg'`                               | `'md'`      |
| `disabled`                  | `boolean`                                            | `false`     |
| `loading`                   | `boolean`                                            | `false`     |
| `leadingIcon`               | `IconName`                                           | —           |
| `trailingIcon`              | `IconName`                                           | —           |
| `onPress`                   | `(event: GestureResponderEvent) => void`             | —           |
| `accessibilityHint`         | `string`                                             | —           |
| `loadingAccessibilityValue` | `string` — localized busy text                       | `'Loading'` |
| `testID`                    | `string`                                             | —           |
| `style`                     | `StyleProp<ButtonLayoutStyle>` — layout keys only    | —           |
| `ref`                       | `Ref<HostInstance>` (the pressable view)             | —           |

Behavior (contract `properties`, `states`, `accessibility`):

- **Loading** — spinner only; label and icons keep their space (size unchanged); variant
  colors kept; `accessibilityState.busy` plus the `loadingAccessibilityValue` value (not every
  screen reader announces busy); **not** disabled, stays focusable; `onPress` is blocked.
- **Disabled** — `onPress` blocked, reported disabled. **Disabled + loading: disabled wins** —
  label visible, no spinner, not busy.
- **Text scaling** — the label scales (`allowFontScaling`, iOS `dynamicTypeRamp` from the
  role's text-scaling anchor) and wraps instead of clipping; heights 32 / 40 / 48 are
  minimums. Icons and the spinner scale with the OS font scale.
- **Touch target** — expanded to 44pt (iOS) / 48dp (Android) with hit-slop computed from the
  measured size; the visual size and layout don't change. Hit-slop can't reach outside the
  parent's bounds on Android — give tightly packed buttons room.
- **Reduced motion** — the spinner stops rotating (busy still exposed) and the
  `motion.micro` container color transition snaps.
- **Icons and spinner** are hidden from assistive technology; the name is always the label.
- **Pressed** uses the contract's pressed cells; **hover** only with a hover pointer (iPad,
  Android mouse); **focus**: Android draws the contract focus indicator on keyboard / D-pad
  focus, iOS keeps its system focus effect.
- **`style`** accepts `BUTTON_LAYOUT_STYLE_KEYS` only (margins, `flex*`, `alignSelf`, `width`
  / `minWidth` / `maxWidth`); anything else is dropped with a development warning. React
  Native stretches children in a column by default — use `alignSelf` to hug.
- **Part test IDs** (for e2e): `<testID>.label`, `.leadingIcon`, `.trailingIcon`, `.spinner`.

## Structure

```
src/
  index.ts                       public API
  components/Button/             Button.tsx · Button.tokens.ts (contract token paths) · buttonTheme.ts (resolved per theme)
  components/Spinner/            internal
  icons/                         IconName · internal Icon · providers/lucide.ts (per-icon imports)
  theme/                         PDSThemeProvider · usePDSTheme · typography · tokenPath
  hooks/useReducedMotion.ts
__tests__/                       Jest + React Native Testing Library
```

## Checks

```
npm run tokens:build          # generates @pds/tokens/react-native (gitignored)
npm run test:react-native     # Jest: behavior, accessibility, contract token parity (both brands)
npm run typecheck             # every workspace
npm run contracts:validate    # includes react-native-reference (enums, defaults, token set)
npm run icons:test            # RN IconName + Lucide map + pinned lucide-react-native
```

`__tests__/buttonTokens.test.ts` compares `Button.tokens.ts` with the contract's `tokens`
section cell by cell and resolves every bound token in Brand A and Brand B.
