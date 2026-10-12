# 0016: Native token mappings and outputs (Phase 2)

- **Status**: Accepted and implemented 2026-10-12 (Phase 2). The Android elevation values are
  **provisional** until Phase 5 visual validation on real native components.
- **Date**: 2026-10-12
- **Extends**: [0014 token source portability](./0014-token-source-portability.md) §4–§6
  (resolves the per-platform typography, elevation and font decisions it deferred, and changes
  its font-manifest format — see §3).
- **Related**: [0013 cross-platform architecture](./0013-cross-platform-architecture.md),
  [0011 multi-brand](./0011-multi-brand-token-architecture.md),
  [0003 typography](./0003-typography-token-architecture.md),
  [0007 elevation](./0007-elevation-token-architecture.md),
  [`docs/cross-platform/token-portability.md`](../../docs/cross-platform/token-portability.md)

## Context

Phase 1 made the token source platform-neutral and built a resolved IR per brand. Three
decisions blocked native outputs: how typography scales per platform, how elevation maps
without copying CSS `box-shadow`, and how native platforms find font files.

## Decision

### 1. Typography: same roles and values everywhere, native text scaling

Every platform uses the same roles, sizes, weights, line-height ratios and letter-spacing.
Only how text scales with the OS setting differs.

| Role (all weights)          | Size    | iOS anchor (`relativeTo:` / RN `dynamicTypeRamp`) |
| --------------------------- | ------- | ------------------------------------------------- |
| `heading.xl`                | 36      | `largeTitle`                                      |
| `heading.lg`                | 30      | `title1`                                          |
| `heading.md`                | 24      | `title2`                                          |
| `heading.sm`                | 20      | `title3`                                          |
| `body.lg` / `body.md`       | 18 / 16 | `body`                                            |
| `body.sm`                   | 14      | `subheadline`                                     |
| `label.lg`                  | 16      | `callout`                                         |
| `label.md`                  | 14      | `subheadline`                                     |
| `label.sm`                  | 12      | `caption1`                                        |
| `caption.md` / `caption.sm` | 14 / 12 | `footnote` / `caption1`                           |
| `code.md` / `code.sm`       | 14 / 12 | `body` / `caption1`                               |

- **Anchors** (`design/tokens/platform/native/semantic/text-scaling.json`) don't change sizes;
  they pick the Dynamic Type scaling curve. Rule: the role's own family first, then the
  nearest default size. Title curves grow less at accessibility sizes, so large headings don't
  take over the screen. Code follows the body text it sits in.
- **Android** has no anchors: `sp` plus Android 14+ nonlinear font scaling.
- **Line-height** keeps the exact ratio, no rounding: RN absolute `size × ratio`; SwiftUI
  `lineSpacing = size × (ratio − 1)` (scaled with `@ScaledMetric(relativeTo:)`); Compose
  `ratio.em` with `LineHeightStyle(Center, Trim.None)` and `includeFontPadding = false`.
- **Letter-spacing** is an em fraction: Compose `.em`; RN and SwiftUI `tracking` `em × size`.
- **Intentional differences:** none in sizes, weights or ratios (body stays 16, not iOS's
  17). Large text grows less than body on iOS (anchors) and Android (nonlinear scaling);
  SwiftUI `lineSpacing` makes single-line text shorter than on web, so component heights
  come from size tokens. No size caps in tokens — `maxFontSizeMultiplier` is per component.

### 2. Elevation: native behavior, not a box-shadow copy

| Role      | Web (unchanged)  | SwiftUI and RN iOS                          | Compose and RN Android |
| --------- | ---------------- | ------------------------------------------- | ---------------------- |
| `flat`    | `none`           | no shadow (`nil`)                           | `0` dp                 |
| `raised`  | `0 1 2 0` α .05  | black, opacity .05, radius 1, offset (0, 1) | `1` dp                 |
| `overlay` | `0 2 6 0` α .08  | black, opacity .08, radius 3, offset (0, 2) | `3` dp                 |
| `modal`   | `0 4 12 0` α .12 | black, opacity .12, radius 6, offset (0, 4) | `6` dp                 |

- **iOS** derives from the shared token: radius = blur ÷ 2, opacity = the shadow color's
  alpha (2 decimals), spread dropped. Apply to the background shape, not the container.
- **Android** uses its own light model at Material 3 levels 1–3 — not derivable from the web
  shadow, so the values live in `design/tokens/platform/native/semantic/elevation.json`
  (`elevationHeight.*`). Compose: `Surface(shadowElevation = …, tonalElevation = 0.dp)`.
  If Phase 5 finds Android's shadow too heavy, tune shadow color alpha (Android 9+) there.
- **React Native** gets one style object for both platforms (iOS ignores `elevation`, Android
  ignores `shadowOffset/Opacity/Radius`). RN `boxShadow` and Compose `dropShadow` are rejected:
  they copy CSS mechanically.
- **System overlays win** — native sheets, menus, popovers and dialogs keep their own
  presentation; these tokens are for our own surfaces.
- **Provisional:** values are accepted for Phase 2 and re-validated visually in Phase 5.

### 3. Fonts: one catalog, per-brand manifests derived at build time

`design/fonts/fonts.json` (+ `fonts.schema.json`) lists each family with license, pinned
source, `verified` flag and faces `{weight, style, file, postScriptName}`. It replaces 0014's
hand-written `fonts/<brand>.fonts.json`: a brand's manifest is **derived** into its IR
(`ir.fonts`) from the brand's resolved families and the weights its roles use, so `brand.json`
stays the only place a brand picks a family and the shared mono family isn't duplicated.

| Brand | Role | Family      | Weights         | PostScript name (= RN `fontFamily`)                 | Android resource     | License    |
| ----- | ---- | ----------- | --------------- | --------------------------------------------------- | -------------------- | ---------- |
| A     | sans | Inter       | 400/500/600/700 | `Inter-Regular` / `-Medium` / `-SemiBold` / `-Bold` | `inter_regular` …    | OFL-1.1    |
| B     | sans | Figtree     | 400/500/600/700 | `Figtree-Regular` / … / `Figtree-Bold`              | `figtree_regular` …  | OFL-1.1    |
| A + B | mono | Roboto Mono | 400             | `RobotoMono-Regular`                                | `robotomono_regular` | Apache-2.0 |

- Static files per weight, not variable fonts (RN Android can't select a weight from one).
- Native outputs reference exact faces; RN styles omit `fontWeight` (no synthetic bold).
- **No font files in the repo yet.** Phase 2 emits names only. Bundling (iOS `PDSUI`
  resources + `CTFontManagerRegisterFontsForURL`; Android `res/font/` in `com.pds.compose`;
  RN assets / `expo-font`) is Phase 5. PostScript names are `verified: false` until checked
  against the real files.
- **Fallback:** the system font at the same size, scaling and weight (`.monospaced()` /
  `FontFamily.Monospace` / `Menlo`·`monospace` for mono). Never another brand's family.

### 4. Output architecture

```
design/tokens/{core, brands/<brand>, semantic, platform/{web,native}} + design/fonts/fonts.json
  → resolved IR per brand (ir.mjs)                       packages/tokens/build/ir/<brand>.json
  → guardrails (guards.mjs)
  → web CSS/JS           (emit-web.mjs)                   unchanged, byte-identical
  → native model         (native.mjs)                     semantic shared tokens only
      → React Native TS  (emit-react-native.mjs)          build/react-native/index.ts
      → Swift PDSTokens  (emit-swift.mjs)                 platforms/ios/Sources/PDSTokens/*.swift  (committed, ADR 0017)
      → Kotlin com.pds.tokens (emit-kotlin.mjs)           platforms/android/tokens/src/main/kotlin/com/pds/tokens/*.kt  (committed)
```

- **Exposed:** semantic `shared` tokens (component-scoped ones included) and font roles. Core,
  `brand.*` and web-only tokens never are. Native-tier tokens are folded into the typography
  and elevation values, not exposed on their own.
- **Names** (ADR 0013): lowerCamelCase (`on-color` → `onColor`), `2xl` → `xl2`, root `text` →
  `typography`.
- **Pure data:** the RN module imports nothing from `react-native`; Swift uses only the
  standard library; Kotlin has no Android/Compose dependency. Platform UI adapters (SwiftUI
  `Color`/`Font`, Compose `Color`/`Dp`/`TextStyle`) are Phase 5 (`PDSUI`, `com.pds.compose`).
  This keeps the outputs compilable in plain CI toolchains.
- **Brands:** a full theme per brand plus a by-name map (`themes`, `DSTheme.all`,
  `DsThemes.all`) for runtime selection. Guarded: every brand has the identical shape.

### 5. Guardrails added

The build fails on: a platform tier overriding a shared token; an invalid font catalog or a
family × weight with no face; a typography role without a valid anchor, or an orphan anchor;
an elevation role without an Android height, or heights that don't grow with the shadow; a
token type with no native mapping; two paths mapping to one native name; brands with
different theme shapes.

`npm run tokens:test` compares every output (8 web files, 1 RN, 3 Swift, 3 Kotlin) with
committed snapshots in `packages/tokens/__tests__/__snapshots__/`, checks IR ↔ output parity,
type-checks the RN module, checks the design audit's resolver against the IR, and runs negative
tests for every guardrail. CI compiles the committed Swift (`swiftc -typecheck`, Swift 6
mode) and Kotlin (`kotlinc`) snapshots.

## Consequences

- Native outputs exist for both brands on all three platforms; web output is unchanged.
- Changing any output — web or native — now fails CI until the snapshot is reviewed and
  updated (`npm run tokens:test:update`).
- Swift and Kotlin compile only in CI (no local toolchains on the current dev machine);
  locally they are covered by snapshots and text-level parity tests.
- Font PostScript names, the RN Android scaling behavior and the Android elevation weight must
  be confirmed when native components exist (Phase 5).
