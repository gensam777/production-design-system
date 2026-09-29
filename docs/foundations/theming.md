# Theming — multi-brand / white-label (V1)

Decision record: [ADR 0011](../../governance/decisions/0011-multi-brand-token-architecture.md).

**Principle: shared component contract → semantic token contract → brand-specific values.**
Components, patterns, templates and layouts are identical for every brand; only token values
change. Components never read the brand — they consume semantic CSS custom properties.

## Brands

| Id        | Figma mode | Status                                         | Primary | Sans    | Control / container radius |
| --------- | ---------- | ---------------------------------------------- | ------- | ------- | -------------------------- |
| `brand-a` | Brand A    | Default — the current Production Design System | blue    | Inter   | 4 / 12px                   |
| `brand-b` | Brand B    | Fictional demo brand (proves white-labelling)  | violet  | Figtree | 8 / 16px                   |

## Using a brand

```html
<html>
  <!-- no attribute → Brand A (default) -->
  <html data-brand="brand-b">
    <!-- whole app in Brand B -->
    <section data-brand="brand-a"><!-- contained preview, any depth --></section>
  </html>
</html>
```

- Switching is instant at runtime: change the attribute. Nothing re-renders.
- The package CSS (`dist/index.css`) contains both brands. Unknown ids fall back to Brand A.
- **Fonts are the app's job**, as before: load Inter for Brand A, Figtree for Brand B
  (Storybook loads both via `@fontsource`).

In Storybook, use the **Brand** toolbar; `Brands/Side by side` renders both brands at once.
Chromatic snapshots every story once per brand (modes `Brand A`, `Brand B`).

## What a brand may change (the brand contract)

`src/tokens/brands/<id>/brand.json`, exactly these 13 tokens:

| Token                          | Drives (semantic)                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand.color.primary.{50…900}` | `color.action.primary.{default,hover,active}` (600/700/800), `color.text.link` (600), `color.text.link-hover` (700), `color.focus.ring` (600) |
| `brand.font.family.sans`       | `font-family` of every sans `text.*` role                                                                                                     |
| `brand.radius.control`         | `radius.control` (buttons, inputs, selects, tabs, tooltips)                                                                                   |
| `brand.radius.container`       | `radius.container` (cards, alerts, panels)                                                                                                    |

Values should reference Core (`{color.violet.600}`, `{radius.md}`); add a Core ramp first
if a brand needs a new hue.

**Everything else is shared** — neutrals, feedback colors, on-colors, spacing, type scale,
weights, letter spacing, mono, elevation, motion, breakpoints, layout, icons, component
dimensions — and `radius.checkbox` (Checkbox keeps a square 4px box in every brand so it
never looks like Radio).

## Adding a brand

1. `src/tokens/brands/<id>/brand.json` with the 13 contract tokens.
2. Add `<id>` to `BRANDS` in `scripts/build-tokens.mjs`; import
   `tokens/build/css/brands/<id>.css` in `src/index.ts` and `.storybook/preview.ts`; add a
   toolbar item and a Chromatic mode.
3. Figma: add a mode to the **Brand** collection with the same variables (including the
   `font/weight/*` style names for the new font).
4. `npm run tokens:build` — it fails on a missing/extra contract token, a brand file that
   touches anything outside `brand.*`, or any contrast pair below its minimum.

## Guardrails

| Check                       | Where                                    | Fails when                                                                 |
| --------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| Brand contract completeness | `tokens:build`                           | a brand is missing or adds a `brand.*` token, or defines non-brand roots   |
| Shared-token consistency    | `tokens:build`                           | a brand-independent token resolves differently between brands              |
| Per-brand contrast (WCAG)   | `tokens:build`                           | any of 14 pairs is below its minimum (4.5:1 text, 3:1 non-text/focus)      |
| Semantic-only consumption   | `lint` (`scripts/check-token-usage.mjs`) | a component/pattern uses a Core primitive, `--brand-*`, or a raw hex color |

## Figma

Collections: **Core** (shared, 1 mode) · **Brand** (Brand A / Brand B) · **Semantic \***
(unchanged names). Set a frame's **Brand** collection mode to preview a brand (see the
"Brand B preview" section on Examples / Playground). `Brand/font/weight/*` holds font
_style names_ per family ("Semi Bold" vs "SemiBold") — a Figma-only adapter, not a brandable
weight. Brand is independent of the future Light/Dark mode on `Semantic Color`.

## Native platforms (later)

The semantic token names are the cross-platform contract; each brand becomes one generated
value set: React Native theme object (context), SwiftUI `DSTheme` (`@Environment`), Jetpack
Compose (`CompositionLocal`). Fonts and elevation mapping are platform-owned.
