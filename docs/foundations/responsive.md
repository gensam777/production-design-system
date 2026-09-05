# Responsive / Breakpoint Foundation (V1)

Status: implemented (Figma + code). See
`governance/decisions/0009-responsive-token-architecture.md` for the architectural
decisions behind this foundation.

This foundation is deliberately small: three breakpoint thresholds, one derived layout
value, and documentation guidance that reuses tokens from other foundations rather than
inventing new ones.

## Primitives

Raw viewport breakpoint thresholds in `src/tokens/primitive/viewport.json`. Mobile-first
**`min-width`** scale — a breakpoint marks where a layout becomes viable at a larger
size, not where it breaks at a smaller one.

| Token | Value | Marks the point where... |
| --- | --- | --- |
| _(base, no token)_ | `0` | Default/mobile layout — single column, no query needed. |
| `viewport.md` | 768px | Tablet-and-up layout becomes viable (multi-column, side nav). |
| `viewport.lg` | 1024px | Small-laptop/desktop layout (full nav, wider grid). |
| `viewport.xl` | 1280px | Wide desktop — container caps out; extra width becomes margin, not stretch. |

### Why there is no `viewport.sm` in V1

A sub-768px split (large phone vs. small phone) is the exact failure mode this system's
other foundations already guard against: a token nobody has a real use for yet (compare
spacing's "no 80px step until a real layout needs it,"
`governance/decisions/0004-spacing-token-architecture.md`). Add `viewport.sm`
deliberately, when a real layout actually needs to distinguish phone widths — not
speculatively. Same reasoning rules out `viewport.2xl`: ultra-wide handling is already
covered by `layout.container.maxWidth` capping content width, so a fourth breakpoint
would duplicate that job.

### Naming

t-shirt sizes (`md`/`lg`/`xl`), not numeric (`bp-768`) and not device names
(`tablet`/`desktop`) — matching the convention every other foundation in this system
uses (`space.*`, `radius.*`, `font.size.*`). Device names are explicitly excluded: a
"tablet-width" browser window opens just as often on a laptop as on a tablet, so the name
would lie about what triggers it.

## Semantic tokens

`src/tokens/semantic/layout.json` — **one token**, not a restated copy of the primitive
scale:

| Semantic | → Primitive | px | Purpose |
| --- | --- | --- | --- |
| `layout.container.maxWidth` | `viewport.xl` | 1280 | Page/app-shell container cap. |

`layout.container.maxWidth` is a single value, not one per breakpoint. CSS `max-width`
is fluid (100%) below this width and capped above it — the same token produces both
behaviors, so there is nothing to alias per-breakpoint.

**Page gutters and grid internal gaps are not new tokens here** — see
[Grid guidance](#grid-guidance) below for what they reuse instead.

## Naming convention

```
Primitive:  viewport.<step>              e.g. viewport.md, viewport.xl
Semantic:   layout.<role>                e.g. layout.container.maxWidth
```

Unlike every prior foundation, the semantic token's root key (`layout`) is **not** the
same as the primitive's root key (`viewport`) — see ADR 0009 for why, and for how the
Style Dictionary build handles this correctly.

**Components must consume semantic tokens only** for the container cap
(`layout.container.maxWidth`, never `viewport.xl` directly) — same rule as every other
foundation. Referencing `viewport.*` directly is expected and correct for the one thing
primitives are for here: authoring actual `@media (min-width: ...)` queries.

## Code output: px source, px for CSS — no rem

Unlike spacing/typography (which scale with the user's root font size on purpose),
`viewport.*` and `layout.container.maxWidth` stay **px in both source and CSS output** —
the same treatment as radius (0006) and shadow (0007). A breakpoint is a comparison
against the actual device viewport width in physical pixels; scaling it with root font
size would silently move *where* a layout changes shape, which isn't what that
accessibility mechanism is for.

- **CSS output** (`src/tokens/build/css/variables.css`): a new `size/viewport-px`
  Style Dictionary transform pre-formats these as `"Npx"` before the built-in `size/rem`
  transform runs, e.g. `--viewport-md: 768px;`, `--layout-container-max-width: 1280px;`.
  No device-name aliases are generated — only the four custom properties above.
- **JS/TS output** (`src/tokens/build/js/tokens.js`): plain px numbers, e.g.
  `export const ViewportMd = 768;`, `export const LayoutContainerMaxWidth = 1280;` — the
  `js` platform already excludes `size/rem` entirely, so this needed no new
  configuration.
- Existing `space.*`/`radius.*`/`shadow.*`/`motion.*` transforms are scoped to their own
  token paths and do not touch `viewport.*`/`layout.*` — verified against the generated
  output when this foundation was mirrored into code, not just assumed. See ADR 0009 for
  the one build-pipeline subtlety this foundation introduced (a semantic token aliasing a
  primitive under a different root key).

## Viewport responsiveness vs. container responsiveness

These are different concerns, handled by different mechanisms. Confusing them is the
most common way a "responsive" component library becomes unusable in a layout its
author didn't anticipate.

### Viewport media queries — page/app-shell only

Use `@media (min-width: var(--viewport-md))` (or the primitive value directly in a
non-custom-property context) for decisions that are genuinely about the **browser
window**:

- Page gutters (which `space.layout.*` value applies — see below).
- The container max-width cap (`layout.container.maxWidth`).
- Major navigation/layout changes (hamburger vs. horizontal nav, sidebar appearing).
- Overall grid composition (column count at the page level).

This lives in consuming apps' page templates and this system's own layout primitives (if
any exist) — never inside a reusable component like Button, Card, or Input.

### Container queries — the default for reusable components

Every reusable component in `src/components/` should respond to **the width of its own
parent/container** (CSS `@container`), not to viewport breakpoints or device
assumptions. A Card doesn't know if it's on a phone; it knows it has 320px of width
because its parent gave it 320px — that's true whether the parent is a phone-width
viewport or a narrow sidebar on a 4K monitor.

**Do not make Button/Card/Input/etc. depend directly on a viewport breakpoint unless
there is a real, documented exception.** If a component's behavior needs to change with
available space, reach for a container query first.

### Intrinsic layout first — before any breakpoint at all

Before adding explicit breakpoint behavior (viewport *or* container), prefer layout that
adapts on its own:

- `flex` with `flex-wrap`.
- `grid` with `minmax()` and `repeat(auto-fit, ...)` / `repeat(auto-fill, ...)`.
- Fluid widths (`%`, `1fr`, `clamp()`) instead of fixed pixel widths.
- Natural wrapping instead of a hard column-count switch.

A breakpoint (viewport or container) is for the cases intrinsic layout genuinely can't
cover — a real change in composition, not a fallback for skipping fluid layout in the
first place.

## Grid guidance

Mirrors the three Figma Grid Styles (`Grid/Compact`, `Grid/Medium`, `Grid/Wide`)
approved in the Responsive Specimen. **These are designer/developer reference
conventions, not automatic CSS Grid output** — implementing an actual grid in a layout
is a separate, deliberate step in that layout's own code, using the values below.

| Convention | Columns | Page margin | Internal grid gap | Applies at |
| --- | --- | --- | --- | --- |
| Compact | 4 | 24px | 16px | Base (below `viewport.md`) |
| Medium | 8 | 32px | 24px | `viewport.md`–`viewport.lg` |
| Wide | 12 | 40px | 24px | `viewport.lg` and up (including `viewport.xl`) |

### Page margin vs. grid gap — different tokens, on purpose

These two numbers are **not the same value** in this system (they were in an earlier
draft of the Figma work and were deliberately split):

- **Page margin** (the space between the viewport edge and the content) reuses the
  existing `space.layout.*` semantic spacing tokens (0004) — `space.layout.sm` (24px)
  at Compact, `space.layout.md` (32px) at Medium, `space.layout.lg` (40px) at Wide/above.
  **No new token was created for this** — it is a documentation mapping over tokens that
  already exist.
- **Internal grid gap** (the space between columns) reuses the **primitive** spacing
  scale directly — `space.md` (16px) at Compact, `space.xl` (24px) at Medium and Wide.
  This intentionally does not go through a semantic alias: none of the existing semantic
  spacing categories (`inset`/`stack`/`inline`/`layout`) are documented for "gap between
  grid columns" specifically, and inventing one would be exactly the kind of
  grid-specific spacing token this foundation was explicitly told not to create. Reusing
  the primitive scale directly keeps the number traceable to a real existing token
  without stretching another category's meaning.

Both mappings match the live variable bindings used in the three Figma Grid Styles
exactly — verified during the Figma↔code audit for this foundation (see the Final audit
note in the PR/commit this file ships with).

## Accessibility / reflow requirements

- **WCAG 1.4.10 Reflow**: layouts must support 320 CSS px width (equivalent to 400%
  zoom on a 1280px design) with **no loss of content or functionality** and no
  two-dimensional scrolling.
- **Reflow before hiding**: if content must adapt at a small width, prefer reflow
  (stacking, wrapping) over hiding. Hiding is a last resort, reserved for genuinely
  non-essential content — never for content or controls that have no other path to the
  same function.
- **Hidden controls must remain functionally reachable.** Anything visually collapsed at
  a breakpoint (e.g. into a menu) must still be operable by keyboard and announced to
  assistive technology — visual hiding is not the same as removing a feature.
- **Logical/DOM reading order must be preserved.** A component that reorders content
  visually via CSS only (without reordering the DOM) breaks keyboard and screen-reader
  navigation, even if it looks correct visually.
- **Touch targets must not shrink below the minimum** (WCAG 2.5.8, 24×24px) at any
  breakpoint or container width — a fluid/resize strategy must never scale an
  interactive control below that floor.

See `governance/accessibility.md` for the full checklist every component must meet
regardless of this foundation — these bullets are the responsive-specific additions to
it, not a replacement for it.

## Figma Variables (implemented)

Built Figma-first, like spacing and radius — Variables and the Responsive Specimen were
created and approved before this code mirror.

- **`Primitive` collection**, single `Value` mode: `viewport/md`, `viewport/lg`,
  `viewport/xl` — `FLOAT`, scope `["WIDTH_HEIGHT"]` (real usable scope, not hidden — used
  to size the specimen's reference frames themselves).
- **`Semantic Layout` collection** (new, single `Default` mode): `container/maxWidth`,
  aliasing `Primitive`'s `viewport/xl` — the one-collection-per-concern pattern from
  `governance/decisions/0005-semantic-collection-split.md` applied here too.
- **Three named Figma Grid Styles** (`Grid/Compact`, `Grid/Medium`, `Grid/Wide`) — reusable
  style assets, not Variables. Margin bound live to `Semantic Space`'s `layout/sm·md·lg`;
  internal gap bound live to `Primitive`'s `space/md`/`space/xl`. Applied to the
  Responsive Specimen's reference frames via `setGridStyleIdAsync`.
- A **"Responsive Specimen — V1"** frame documents the primitive/semantic values and
  contains four static reference frames (375/768/1024/1280px) showing viewport width,
  margin, grid, container cap, and mobile-first progression.

### Figma limitation: reference frames are static, not a live simulation

Figma Variable modes do not switch automatically based on a frame's actual width the way
a CSS media query does — there is no equivalent of "resize the window and watch it
reflow." The four reference frames in the specimen are manually built at fixed widths to
illustrate the token values at each breakpoint; **they do not simulate real responsive
behavior**. Likewise, the Figma Layout Grid overlays are a design-time guide (visible on
canvas, not in flattened exports) — they are not translated into CSS Grid automatically.
Validate actual reflow behavior in Storybook or a browser, never in Figma.

## Native/cross-platform note

The token *values* in this foundation (`viewport.md/lg/xl`, `layout.container.maxWidth`,
and the margin/gap numbers in the Grid guidance table) are cross-platform — a native
mobile or desktop app consuming this design system's JS/TS output gets the same numbers.
**The viewport-media-query mechanism itself is web-specific.** A native platform
expresses the same underlying decisions (page margin, container cap, column count at a
given size class) through its own layout system (e.g. size classes, adaptive layout
APIs) — using these tokens as input, not by porting `@media` queries directly.
