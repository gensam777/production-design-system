# Token portability

Decision record: [ADR 0014](../../governance/decisions/0014-token-source-portability.md).
Status: **Phase 1 implemented (2026-10-11).** Token source is platform-neutral and the build
runs source → resolved IR → guardrails → web emitter. Web CSS/JS output is byte-identical to
the pre-Phase-1 build. Native emitters (and everything under "Output shapes") are Phase 2.

## Portability rules

1. **Source values are data, not CSS.** Dimensions are px numbers; colors are hex /
   hex-alpha; relative values (letter-spacing em, line-height ratio) are unit-explicit and
   structured. No `rem`, `rgba()`, CSS function or fallback-stack strings in shared source.
2. **Platform-only tokens live in a platform tier** (`platform/web/`, `platform/native/`).
   A platform tier may add tokens, never override a shared semantic value.
3. **One resolved IR per brand.** Every output — web CSS and JS included — is an emitter over
   `resolved/<brand>.json`. No platform has its own resolution path.
4. **Guardrails run once, on the IR, keyed by token path.** Brand-contract completeness,
   shared-must-not-vary and WCAG contrast apply to every platform automatically.
5. **Only semantic (and component-scoped) tokens are emitted** to React Native, Swift and
   Kotlin. Core and `brand.*` stay internal.
6. **Shape intent beats magic numbers.** `radius.full` means "fully rounded"; each platform
   emits its own capsule/circle.
7. **Runtime accessibility settings are not tokens.** Reduced motion and text scaling are
   read from the OS at runtime on native; web keeps its generated `prefers-reduced-motion`
   override.

## Category audit

| Category                       | Portable as authored?                    | Notes                                                        |
| ------------------------------ | ---------------------------------------- | ------------------------------------------------------------ |
| Color (opaque hex)             | Yes                                      | —                                                            |
| `color.overlay.*`              | **No** — `rgba()` strings                | → hex-alpha / color object (Phase 1)                         |
| Space                          | Yes (px numbers)                         | Web emits rem, native emits pt/dp                            |
| Radius                         | Yes, except `radius.max = 9999`          | `full` becomes a shape on native                             |
| Icon size                      | Yes                                      | —                                                            |
| Font size                      | **No** — rem strings                     | → px numbers (Phase 1)                                       |
| Letter-spacing                 | **No** — em strings                      | → structured em (Phase 1)                                    |
| Line-height                    | Yes (ratio)                              | Native computes absolute values                              |
| Font weight                    | Yes (numeric)                            | Android RN / Compose need per-weight font files              |
| Font family                    | **No** — CSS fallback stack in `brand.*` | → single family name; fallbacks to `platform/web/` (Phase 1) |
| Elevation                      | Concept yes, encoding no                 | Per-platform mapping table (no spread on native)             |
| Motion duration / easing       | Yes                                      | Composite `transition` is a web shape                        |
| Reduced motion                 | Web-only mechanism                       | Native reads OS setting at runtime                           |
| Viewport, `layout.container.*` | **Web-only**                             | → `platform/web/` (Phase 1); never emitted to native         |

## Phase 1 source changes (implemented)

| Token(s)                      | Before (CSS-shaped)           | After (portable)                                                         | Web output                     |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------------------ | ------------------------------ |
| `font.size.*`                 | `"1rem"` strings              | px numbers (`16`)                                                        | unchanged (`1rem`)             |
| `font.letterSpacing.*`        | `"-0.01em"` dimension strings | `number` fraction (`-0.01`) + `$extensions["com.pds"].unit: "em"`        | unchanged (`-0.01em`)          |
| `color.overlay.*`             | `rgba(0, 0, 0, 0.05)`         | hex8 (`#0000000D`)                                                       | unchanged (`rgba(…)` / `#…0d`) |
| `brand.font.family.sans`      | CSS stack array               | family identity (`Inter` / `Figtree`)                                    | unchanged (stack appended)     |
| `font.family.mono`            | CSS stack array               | `Roboto Mono`                                                            | unchanged                      |
| Font fallback stacks          | inside the family values      | `platform/web/semantic/font-fallback.json` (`font.fallback.{sans,mono}`) | appended, never emitted alone  |
| `viewport.*`                  | `core/viewport.json`          | `platform/web/core/viewport.json` (scope `web`)                          | unchanged                      |
| `layout.container.maxWidth`   | `semantic/layout.json`        | `platform/web/semantic/layout.json` (scope `web`)                        | unchanged                      |
| `radius.full`                 | `9999` (magic number only)    | still `9999` (Figma parity) + `$extensions["com.pds"].shape: "full"`     | unchanged (`9999px`)           |
| `elevation.flat`              | `"none"` (CSS keyword)        | `[]` (empty shadow list — matches Figma's empty effects)                 | unchanged (`none`)             |
| `motion.*` transition `delay` | `"0ms"`                       | `0` (ms number)                                                          | unchanged (`0ms`)              |

**Why letter-spacing is a `number`, not a DTCG `dimension`:** DTCG dimensions allow only `px`
and `rem`; letter-spacing is relative to font size. The fraction plus an explicit `em` unit
marker keeps it relative and unambiguous for every platform.

**Why `radius.full` keeps `9999`:** Figma's `radius/full` variable is 9999 and the design
audit compares radius in px. The `shape: "full"` marker is what native emitters (Phase 2) use
to output a capsule/circle instead of a number.

Figma Variables needed no change — Figma is already px-based, single-family per Brand mode,
and its Elevation/Flat style already has an empty effects list.

## Build pipeline (implemented)

```
src/tokens/{core, brands/<brand>, semantic} + platform/web/{core, semantic}
  → scripts/tokens/ir.mjs        resolve one brand (Style Dictionary, references only, no transforms)
  → src/tokens/build/ir/<brand>.json   platform-neutral IR
  → scripts/tokens/guards.mjs    brand contract (on source), scopes, shared invariance, contrast
  → scripts/tokens/emit-web.mjs  web CSS + JS (style-dictionary.config.mjs transforms/formats)
```

- **File merge order:** within the core and semantic layers, shared and platform-tier files
  merge as one list sorted by file name, so moving a file into a platform tier doesn't
  reorder generated output.
- **IR entry:** `{ path, type, value, tier, scope, description?, extensions?, ref? | refs?,
brandDependent, brandDependentSubs? }`, in source order. `brand.*` tokens never appear;
  `brandContract` lists the brand leaves. `scope` is `shared` or `web`; native emitters keep
  only `shared`.
- **Web emitter** reads only the IR. It appends font fallback stacks and converts units by each
  token's own path and type. The web JS output keeps its historical web shapes (font sizes
  as rem strings, letter-spacing as em strings, transition `delay` as `"0ms"`, `elevation.flat`
  as `"none"`) so it's unchanged.
- **Guardrails** are keyed by token path, so they apply to every future emitter.

**Gate (met):** all 8 web outputs (`css/variables.css`, `css/typography.css`,
`css/motion-reduced-motion.css`, `css/brands/brand-{a,b}.css`, `js/tokens{,.brand-a,.brand-b}.js`)
are byte-identical to the pre-Phase-1 build; the design-audit report is unchanged.

## Per-platform transforms

| Category       | Web CSS (unchanged) | React Native                                                        | SwiftUI                                | Compose                                 |
| -------------- | ------------------- | ------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| Color          | hex                 | hex string                                                          | `Color`                                | `Color(0xAARRGGBB)`                     |
| Space          | rem                 | number                                                              | `CGFloat`                              | `Dp`                                    |
| Radius         | px; full → 9999px   | number; full → 9999                                                 | `CGFloat`; full → `Capsule()`          | `Dp`; full → `CircleShape` / 50 %       |
| Icon size      | px                  | number                                                              | `CGFloat` (optionally `@ScaledMetric`) | `Dp`                                    |
| Font size      | rem                 | number                                                              | pt + `relativeTo:`                     | `sp`                                    |
| Line-height    | ratio               | size × ratio                                                        | `lineSpacing` = size × (ratio − 1)     | `(size × ratio).sp` + `LineHeightStyle` |
| Letter-spacing | em                  | em × size                                                           | `tracking` = em × size                 | `.em`                                   |
| Font weight    | numeric             | string; Android: per-weight family name                             | `Font.Weight` / per-weight font        | `FontWeight` + per-weight `Font`        |
| Elevation      | `box-shadow`        | iOS `shadow*`, Android `elevation`; `boxShadow` on New Architecture | `.shadow(color:radius:x:y:)`           | `Modifier.shadow(elevation)`            |
| Motion         | `transition`        | `{ duration, easing: [x1,y1,x2,y2] }`                               | `Animation.timingCurve`                | `tween(…, CubicBezierEasing(…))`        |
| Reduced motion | `@media` override   | `AccessibilityInfo.isReduceMotionEnabled`                           | `\.accessibilityReduceMotion`          | system animator duration scale          |

## Typography mapping

| Property       | CSS                | React Native                                                 | SwiftUI                                                           | Compose                                                           |
| -------------- | ------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Family         | stack (web tier)   | one family name; **Android: one name per weight file**       | `Font.custom("Inter", size:, relativeTo:)`, fonts in `Info.plist` | `FontFamily(Font(R.font.inter_semibold, FontWeight.SemiBold), …)` |
| Size           | rem                | number + `allowFontScaling`, cap via `maxFontSizeMultiplier` | pt, scaled by Dynamic Type via `relativeTo`                       | `sp`                                                              |
| Weight         | 400–700            | `'400'`–`'700'`                                              | `.regular` … `.bold`                                              | `FontWeight.Normal` … `Bold`                                      |
| Line-height    | unitless ratio     | absolute; scale with font scale                              | extra spacing via `lineSpacing`                                   | `sp` or `em`                                                      |
| Letter-spacing | em                 | absolute                                                     | `tracking` (pt)                                                   | `em`                                                              |
| Role           | expanded longhands | `TextStyle` object                                           | `DSTextStyle` → `Font` + modifiers                                | `TextStyle`                                                       |

**Text-scaling anchors** (Phase 1, `platform/native/`): each `text.*` role maps to a system
text style for Dynamic Type / font scale — e.g. `heading.xl` → `.largeTitle`, `heading.lg` →
`.title`, `heading.md` → `.title2`, `heading.sm` → `.title3`, `body.*` → `.body`, `label.*` →
`.callout` / `.subheadline`, `caption.*` → `.caption`, `code.*` → `.body` (monospaced). The
exact table is reviewed with design in Phase 1.

**Font asset manifest** (`fonts/<brand>.fonts.json`, Phase 2): family × weight → file name
and PostScript name. Native counterpart of Figma's `Brand/font/weight/*` style-name adapter.
Not a token.

## Output shapes (illustrative — Phase 2)

Names follow ADR 0013: lowerCamelCase segments, numeric-leading steps → `xl2` / `xs3`,
typography under `typography`.

```ts
// @pds/tokens — React Native
export const brandA = {
  color: { text: { primary: '#111827', linkHover: '#1D4ED8' } },
  space: { inset: { md: 12 }, stack: { xl2: 32 } },
  radius: { control: 4, container: 12 },
  typography: {
    body: {
      md: {
        regular: { fontFamily: 'Inter-Regular', fontSize: 16, lineHeight: 24, letterSpacing: 0 },
      },
    },
  },
} as const satisfies Theme;
export const themes = { 'brand-a': brandA, 'brand-b': brandB } as const;
```

```swift
// PDSTokens
public struct DSTheme: Sendable { public let color: DSColors; public let space: DSSpace; public let radius: DSRadius; public let typography: DSTypography }
public extension DSTheme { static let brandA = DSTheme(/* generated */); static let brandB = DSTheme(/* generated */) }
```

```kotlin
// com.pds.tokens
@Immutable data class DsTheme(val color: DsColors, val space: DsSpace, val radius: DsRadius, val typography: DsTypography)
val BrandA = DsTheme(/* generated */)
val LocalDsTheme = staticCompositionLocalOf { BrandA }
```

Web CSS keeps its current names and files (`variables.css`, `typography.css`,
`motion-reduced-motion.css`, `brands/<brand>.css`).
