# Multi-brand across platforms

Decision records: [ADR 0011](../../governance/decisions/0011-multi-brand-token-architecture.md)
(brand architecture), [ADR 0014](../../governance/decisions/0014-token-source-portability.md)
§7 (propagation), [ADR 0016](../../governance/decisions/0016-native-token-mappings.md)
(native outputs, fonts). Web behavior today: [`docs/foundations/theming.md`](../foundations/theming.md).
Status: web implemented; native **token outputs implemented** (Phase 2 — both brands in every
output); native providers and components are Phase 5.

## Flow

```
brands/<brand>/brand.json ──┐
core + semantic ────────────┤
platform/{web,native}/ ─────┼─► resolve + guard ─► build/ir/<brand>.json (IR) ─┬─► web CSS   [data-brand] scopes
fonts/fonts.json ───────────┘   (contract, shared-   + derived font manifest   ├─► React Native  themes['brand-x']           (provider: Phase 5)
  (catalog — metadata,           must-not-vary,                                ├─► Swift     DSTheme.brandX / DSTheme.all   (environment: Phase 5)
   no font files)                contrast, fonts,                              └─► Kotlin    BrandX / DsThemes.all          (CompositionLocal: Phase 5)
                                 native mappings)
```

## Rules

1. **One brand contract, every platform.** Brands differ only in `brand.color.primary.*`,
   `brand.font.family.sans`, `brand.radius.control`, `brand.radius.container` (ADR 0011).
   Adding a brand is a JSON change that every platform picks up from the next build.
2. **Components never know the brand** — on any platform. They read semantic values from the
   injected theme (web: CSS custom properties; native: the theme object).
3. **Guardrails are platform-neutral.** Contract completeness, shared-must-not-vary and
   per-brand WCAG contrast run once on the IR; a brand that fails cannot ship on any
   platform.
4. **Ship all brands; select at runtime.** Every platform output contains every brand.
   - Web: `data-brand="brand-a|brand-b"` on `<html>` or any container; none = Brand A.
   - React Native: a theme provider (React context) holding `themes[brand]`.
   - SwiftUI: `DSTheme` in the environment.
   - Compose: `DsTheme` in a `CompositionLocal`.
5. **Brand is a subtree property.** Nested scopes / providers are allowed on every platform,
   matching web's contained `[data-brand]` previews.
6. **Default brand is Brand A everywhere** — web's no-attribute default, and the default value
   of the native environment key / `CompositionLocal`.
7. **Build-time pinning is an app choice.** A single-brand app may select one brand via Xcode
   scheme, Gradle flavor or RN environment and drop the rest; the library ships one shape.
8. **Fonts are the only native-specific brand asset.** Each brand uses its sans family (Inter,
   Figtree — both OFL-1.1) plus the shared Roboto Mono (Apache-2.0). One catalog
   (`design/fonts/fonts.json`) lists files and PostScript names; each brand's manifest is
   derived from it and exposed as `fonts.sans` / `fonts.mono` in every native theme. A missing
   face falls back to the system font, never to another brand's family. Font files are
   bundled in Phase 5. Web keeps its fallback stack in the web platform tier.
9. **Brand × ColorScheme.** Native theme types should reserve the color-scheme axis (only
   `light` populated); dark mode remains deferred and is independent of brand, as in Figma
   (`Brand` collection modes vs. a future Light/Dark on `Semantic Color`). **Open:** the Phase 2
   outputs don't carry this axis yet — decide its shape before any native consumer exists
   (Phase 5 at the latest).
10. **Figma is unchanged.** The `Brand` collection's Brand A / Brand B modes remain the design
    source; Figma's `Brand/font/weight/*` style-name adapter stays Figma-only.
