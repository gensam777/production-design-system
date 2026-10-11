# 0014: Token source portability and per-platform outputs

- **Status**: Accepted (Phase 0 — rules only; token source and build are **not** changed yet)
- **Date**: 2026-10-11
- **Extends**: 0011 (multi-brand) — brand propagation to non-web platforms. Refines the
  per-foundation output decisions in 0003, 0004, 0006–0010 for non-CSS targets; their web
  CSS output stays exactly as decided there.
- **Related**: [0013 cross-platform architecture](./0013-cross-platform-architecture.md),
  [`docs/cross-platform/token-portability.md`](../../docs/cross-platform/token-portability.md),
  [`docs/cross-platform/multi-brand.md`](../../docs/cross-platform/multi-brand.md)

## Context

The token **names and layering** (Core → Brand → Semantic → component-scoped) are
platform-neutral. Several **source values** and the **build** are not:

| Finding                                                                                           | Where                                                    |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `font.size.*` authored as rem strings (`"1rem"`)                                                  | `src/tokens/core/typography.json`                        |
| `font.letterSpacing.*` authored as em strings (`"-0.01em"`)                                       | `src/tokens/core/typography.json`                        |
| `color.overlay.*` authored as `rgba(…)` CSS function strings                                      | `src/tokens/core/color.json`                             |
| `brand.font.family.sans` is a CSS fallback stack (`-apple-system`, …)                             | `src/tokens/brands/*/brand.json`                         |
| `radius.max = 9999` — a CSS "always a capsule" trick                                              | `src/tokens/core/radius.json`                            |
| `viewport.*`, `layout.container.maxWidth` — browser-viewport concepts                             | `core/viewport.json`, `semantic/layout.json`             |
| Elevation is a CSS `box-shadow` composite with `spread`                                           | `semantic/elevation.json`                                |
| Reduced motion is a generated `@media` override file                                              | `scripts/build-tokens.mjs`                               |
| Contrast pairs keyed by **CSS custom-property names**; resolution runs through the `css` platform | `scripts/build-tokens.mjs` (`CONTRAST_PAIRS`, `analyze`) |
| Brand delivery relies on CSS cascade scoping (`[data-brand]` files)                               | `scripts/build-tokens.mjs`                               |
| JS output is 256 flat PascalCase constants (`TextHeadingXlBold`)                                  | `src/tokens/build/js/tokens.js`                          |

## Decision

### 1. Source values are platform-neutral data, never CSS syntax

- Dimensions are authored as **numbers in px** (the Figma unit). Units a platform needs
  (rem, pt, dp, sp) are produced by that platform's transform. This is already true for
  space, radius, shadow, icon size and viewport; **font size changes to px** in Phase 1.
- Relative values that are genuinely relative stay relative but **unit-explicit and
  structured** — letter-spacing is a fraction of font size (em), line-height a unitless
  ratio. No CSS strings (`"-0.01em"`) in source. The exact encoding (DTCG structured
  dimension vs. a number plus documented unit) is fixed in Phase 1 against what Style
  Dictionary v5 resolves correctly.
- Colors are hex (`#RRGGBB`) or hex with alpha (`#RRGGBBAA`) / a DTCG color object — **never
  `rgb()`/`rgba()`/`hsl()` strings**. `color.overlay.*` changes in Phase 1.
- `brand.font.family.sans` holds a **single family name** (`Inter`, `Figtree`). The web
  fallback stack moves to a web platform tier.
- "Fully rounded" is a **shape intent**, not a number: `radius.full` keeps its name; web may
  still emit `9999px`, native emits a capsule/circle shape.

### 2. Platform tiers for platform-only tokens

- `platform/web/` — `viewport.*`, `layout.container.maxWidth`, font fallback stacks. Web
  outputs only.
- `platform/native/` — e.g. minimum touch target (44 iOS / 48 Android), the typography role →
  Dynamic Type text-style map. Native outputs only.
- Platform tiers may **add** tokens; they may never **override** a shared semantic value.

### 3. One resolved IR per brand; every output is an emitter over it

The build becomes: **resolve + guard → resolved IR (`resolved/<brand>.json`) → per-platform
emitters** (web CSS, web JS, React Native TS, Swift, Kotlin).

- Guardrails (brand-contract completeness, shared-must-not-vary, per-brand WCAG contrast) run
  **once on the IR**, keyed by **token path** (`color.text.link`), not by an output name. Every
  platform inherits them.
- Native and React Native outputs emit **semantic tokens only** (plus component-scoped tokens
  such as `switch.*`). Core and `brand.*` are never emitted — the same rule that already keeps
  `brand.*` out of CSS and Core out of components.
- The web CSS output must stay byte-identical across the refactor (Phase 1 exit criterion).

### 4. Per-category transform rules

| Category          | Web CSS (unchanged)         | React Native                                                             | SwiftUI                                  | Compose                                         |
| ----------------- | --------------------------- | ------------------------------------------------------------------------ | ---------------------------------------- | ----------------------------------------------- |
| Color             | hex                         | hex string                                                               | `Color`                                  | `Color(0xAARRGGBB)`                             |
| Space             | rem                         | number (dp)                                                              | `CGFloat` (pt)                           | `Dp`                                            |
| Radius            | px; `full` → 9999px         | number; `full` → 9999                                                    | `CGFloat`; `full` → `Capsule()`          | `Dp`; `full` → `CircleShape` / 50 %             |
| Icon size         | px                          | number                                                                   | `CGFloat` (optionally `@ScaledMetric`)   | `Dp`                                            |
| Font size         | rem                         | number (scaled by `allowFontScaling`)                                    | pt + `relativeTo:` Dynamic Type style    | `sp`                                            |
| Line-height       | unitless ratio              | absolute = size × ratio                                                  | `lineSpacing` = size × (ratio − 1)       | `sp` (= size × ratio) + `LineHeightStyle`       |
| Letter-spacing    | em                          | absolute = em × size                                                     | `tracking` = em × size                   | `em`                                            |
| Font weight       | numeric                     | string weight; **Android: per-weight family name**                       | `Font.Weight` / per-weight custom font   | `FontWeight` + `FontFamily(Font(…, weight))`    |
| Elevation         | `box-shadow`                | iOS `shadow*` / Android `elevation` (or `boxShadow` on New Architecture) | `.shadow(color:radius:x:y:)` (no spread) | `Modifier.shadow(elevation)` (no spread/offset) |
| Motion            | `transition` shorthand      | duration + bezier config                                                 | `Animation.timingCurve`                  | `tween(durationMillis, CubicBezierEasing)`      |
| Reduced motion    | generated `@media` override | runtime: `AccessibilityInfo.isReduceMotionEnabled`                       | runtime: `\.accessibilityReduceMotion`   | runtime: system animator scale                  |
| Viewport / layout | px custom properties        | not emitted                                                              | not emitted                              | not emitted                                     |

Elevation is a **per-platform mapping table** reviewed by design, not a formula: no native
platform has spread, and Compose cannot honor offset or color on older API levels.

### 5. Typography roles carry a text-scaling anchor

Each of the 35 `text.*` roles gets a native text-scaling anchor (e.g. `heading.xl` →
`.largeTitle`, `body.md` → `.body`, `caption.*` → `.caption`) in `platform/native/`, so
Dynamic Type and Android font scale behave per role. Font files per family × weight live in a
**font asset manifest** per brand (`fonts/<brand>.fonts.json`) — platform asset metadata, not
tokens; the native counterpart of Figma's `Brand/font/weight/*` style-name adapter.

### 6. Output shapes and names

Outputs are **nested and typed**, one value set per brand, with a shared type:
RN `Theme` + `themes['brand-a']`, Swift `DSTheme.brandA`, Kotlin `DsTheme` + `BrandA`. Path
segments become lowerCamelCase (`link-hover` → `linkHover`); numeric-leading steps become
`xl2`, `xs3`. See ADR 0013 Naming and
[`docs/cross-platform/token-portability.md`](../../docs/cross-platform/token-portability.md)
for examples.

### 7. Brand propagation (extends 0011)

- The brand contract is unchanged and identical on every platform: `brand.color.primary.*`,
  `brand.font.family.sans`, `brand.radius.control`, `brand.radius.container`.
- Every brand is emitted for every platform (**ship all brands**). Selection is **runtime**:
  web `data-brand` scope, RN theme provider, SwiftUI `.environment(\.dsTheme, …)`, Compose
  `CompositionLocalProvider(LocalDsTheme provides …)`. Brand is a **subtree** property on every
  platform (nested providers allowed), matching web's contained `[data-brand]` previews.
- A single-brand app may pin a brand at build time (Xcode scheme, Gradle flavor, RN env) and
  drop the others; that is an app choice, not a second library mode.
- Native theme types are shaped **Brand × ColorScheme** from day one (only `light` populated
  while dark mode stays deferred), so adding dark mode is not an API break.

## Consequences

- Phase 1 is a source + build refactor with a hard "web output unchanged" gate. The
  token-production skill gains the portability rules as checks.
- Figma stays px-based, so moving font size to px source aligns code with Figma rather than
  away from it.
- The contrast checker can no longer silently reject non-opaque colors as a side effect of
  `rgba()` strings — overlays become valid hex-alpha data.
- Adding a platform = adding an emitter over the IR, never a new resolution path.
