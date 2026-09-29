# App shell (template)

**Problem:** the example nav had no `<nav>` landmark, used a Button for navigation, had no
way back to Dashboard, used a desktop-first breakpoint, and put the page gutter _inside_
the content cap.

## Anatomy

```
skip link (visible on focus)
header (surface.default, border.subtle bottom)
  brand · <nav aria-label="Main"> Links (aria-current) · secondary context
main#main-content
  page gutter  →  container (max-width layout.container.maxWidth = 1280)  →  page content
```

## Rules

- **Navigation is Links** (`<a href>`) in a labelled `<nav>`; the current page's item has
  `aria-current="page"`. Never Buttons.
- **Secondary context** (plan badge, user name) is non-essential and is **hidden, not
  reflowed**, below Medium. Never put navigation there.
- **Skip link** to `<main>` (WCAG 2.4.1), visible on focus.
- **Container model (approved):** viewport → responsive page gutter → 1280px max content
  width → content. The gutter sits **outside** the cap, so content is never narrower than
  1280px just because of the gutter.

## Responsive (viewport queries — allowed at app-shell level only)

| Range             | Gutter (nav + main)    | Nav height | Content gap       | Secondary |
| ----------------- | ---------------------- | ---------- | ----------------- | --------- |
| Compact (< 768)   | `space.layout.sm` (24) | 56px       | `space.stack.xl`  | hidden    |
| Medium (768–1023) | `space.layout.md` (32) | 64px       | `space.stack.2xl` | shown     |
| Wide (≥ 1024)     | `space.layout.lg` (40) | 64px       | `space.stack.2xl` | shown     |

Gutters follow the Grid guidance page-margin mapping in docs/foundations/responsive.md.
Nav heights are composition constants matching Figma 02 / 02b (not tokens).

## Known limits / next

- Link V1 has one style; a dedicated current-page nav treatment is future work.
- No mobile menu (needs IconButton + Menu, not built) — with two nav items none is needed.

## Implementation

- React: `src/patterns/AppShell`; used by Dashboard and Settings examples.
- Storybook: `Patterns/App shell` (Default, Compact 375 via iframe).
- Figma: Templates page → "App shell"; product frames 02/02b/03/03b/03c.
