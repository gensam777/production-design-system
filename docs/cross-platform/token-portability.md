# Token portability

Decision records: [ADR 0014](../../governance/decisions/0014-token-source-portability.md)
(portable source, IR), [ADR 0016](../../governance/decisions/0016-native-token-mappings.md)
(native mappings and outputs).
Status: **Phase 2 implemented (2026-10-12).** The build runs source → resolved IR → guardrails
→ web CSS/JS (byte-identical to before) and React Native, Swift and Kotlin token outputs.
No native UI components exist yet (Phase 5).

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
src/tokens/{core, brands/<brand>, semantic} + platform/{web,native}/{core,semantic} + fonts/fonts.json
  → scripts/tokens/ir.mjs        resolve one brand (Style Dictionary, references only, no transforms)
  → src/tokens/build/ir/<brand>.json   platform-neutral IR (+ derived font manifest)
  → scripts/tokens/guards.mjs    brand contract + platform overrides (on source), scopes, shared
                                 invariance, contrast, fonts, native mappings
  → scripts/tokens/emit-web.mjs  web CSS + JS (style-dictionary.config.mjs transforms/formats)
  → scripts/tokens/native.mjs    native model (semantic shared tokens + native tier folded in)
      → emit-react-native.mjs / emit-swift.mjs / emit-kotlin.mjs
```

- **File merge order:** within the core and semantic layers, shared and platform-tier files
  merge as one list sorted by file name, so moving a file into a platform tier doesn't
  reorder generated output.
- **IR entry:** `{ path, type, value, tier, scope, description?, extensions?, ref? | refs?,
brandDependent, brandDependentSubs? }`, in source order. `brand.*` tokens never appear;
  `brandContract` lists the brand leaves. `scope` is `shared`, `web` or `native`; web emitters
  keep `shared` + `web`, native emitters expose semantic `shared` and fold in `native`. IR
  version 2 adds `fonts` (ADR 0016).
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
| Elevation      | `box-shadow`        | iOS `shadow*` (radius = blur ÷ 2), Android `elevation` dp (ADR 0016) | `.shadow(color:radius:x:y:)` (radius = blur ÷ 2) | `Surface(shadowElevation)` dp (ADR 0016) |
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

**Text-scaling anchors** (`src/tokens/platform/native/semantic/text-scaling.json`,
`textScaling.<group>.<size>`): the Apple text style each role scales with — `heading.xl/lg/md/sm`
→ `largeTitle/title1/title2/title3`, `body.lg/md` → `body`, `body.sm` → `subheadline`,
`label.lg/md/sm` → `callout/subheadline/caption1`, `caption.md/sm` → `footnote/caption1`,
`code.md/sm` → `body/caption1`. Full rationale in ADR 0016 §1. Android uses `sp` + system
nonlinear scaling, no anchors.

**Font asset catalog** (`src/tokens/fonts/fonts.json` + `fonts.schema.json`): family → license,
pinned source, `verified`, faces `{weight, style, file, postScriptName}`. Each brand's manifest
is derived into its IR (`ir.fonts.{sans,mono}`) from the brand's families and the weights its
roles use. Not tokens; no font files in the repo (ADR 0016 §3).

## Native outputs (implemented — Phase 2)

Generated into `src/tokens/build/` (gitignored); reviewed copies are committed in
`scripts/tokens/__tests__/__snapshots__/`.

| Output       | Files                                                              | Shape                                                                                                     |
| ------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| React Native | `react-native/index.ts`                                            | `Theme` type, `brandA`, `brandB`, `themes`, `defaultBrand`; pure data, no `react-native` import           |
| Swift        | `swift/PDSTokens/DSTheme.swift`, `DSTheme+BrandA.swift`, `+BrandB` | value types + one struct per group; `DSTheme.brandA/.brandB`, `DSTheme.all`; Swift stdlib only            |
| Kotlin       | `kotlin/com/pds/tokens/DsTheme.kt`, `BrandA.kt`, `BrandB.kt`       | value types + one data class per group; `BrandA`, `BrandB`, `DsThemes.all`; plain Kotlin, no Compose dep. |

Exposed: semantic `shared` tokens (134 per brand, component-scoped included) plus font roles.
Never exposed: Core, `brand.*`, web-only (`viewport.*`, `layout.*`, `font.fallback.*`).
Names follow ADR 0013: lowerCamelCase segments, numeric-leading steps → `xl2` / `xs3`, root
`text` → `typography`.

| Category      | React Native                                                                                | Swift (`PDSTokens`)                                                                                   | Kotlin (`com.pds.tokens`)                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Color         | `'#2563EB'`                                                                                 | `DSColorValue(rgba: 0x2563EBFF)`                                                                      | `DsColorValue(0xFF2563EBL)` (ARGB)                                                                        |
| Dimension     | `12`                                                                                        | `12` (`Double`)                                                                                       | `12f` (dp)                                                                                                |
| `radius.full` | `9999`                                                                                      | `DSCornerShape.full`                                                                                  | `DsCornerShape.Full`                                                                                      |
| Typography    | `{ fontFamily: 'Inter-SemiBold', fontSize, lineHeight, letterSpacing }` + `dynamicTypeRamp` | `DSTextStyle(postScriptName, size, lineHeight, lineSpacing, letterSpacing (em), tracking, textScale)` | `DsTextStyle(postScriptName, fontResourceName, fontWeight, fontSize sp, lineHeight em, letterSpacing em)` |
| Elevation     | `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }`                     | `DSShadow?` (`nil` = flat)                                                                            | `Float` dp                                                                                                |
| Motion        | `{ duration, delay (ms), easing: [x1, y1, x2, y2] }`                                        | `DSTransition` (seconds) + `DSCubicBezier`                                                            | `DsTransition(durationMillis, delayMillis, DsCubicBezier)`                                                |
| Fonts         | `fonts.sans/mono = { family, faces, fallback }`                                             | `DSFontFamily(name, faces)`                                                                           | `DsFontFamily(name, faces)`                                                                               |

Platform UI adapters (SwiftUI `Color`/`Font`, Compose `Color`/`Dp`/`TextStyle`/`FontFamily`,
`CompositionLocal` / environment providers) belong to `PDSUI` / `com.pds.compose` (Phase 5).

Web CSS keeps its current names and files (`variables.css`, `typography.css`,
`motion-reduced-motion.css`, `brands/<brand>.css`).

## Tests

`npm run tokens:test` (CI): every output vs its committed snapshot (web must stay
byte-identical), IR ↔ native parity, strict type-check of the RN module, design-audit resolver
↔ IR parity, and negative tests for every guardrail. After a reviewed change:
`npm run tokens:test:update`. CI also compiles the committed Swift (`swiftc -typecheck`,
Swift 6 mode) and Kotlin (`kotlinc`) snapshots.
