# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

A production-style React design system (single package, not a monorepo): design tokens,
components, and Storybook documentation, meant to also serve as a template for future
app projects.

## Structure

```
src/
  components/   # React components (exported from index.ts)
  patterns/     # documented pattern/template compositions — NOT exported (see docs/patterns/)
  examples/     # product example screens built from components + patterns (not exported)
  tokens/       # token source (core/, brands/<brand>/, semantic/) + generated build/ output
  index.ts      # public entry point / barrel export
.storybook/     # Storybook config
docs/           # design-to-code-mappings.md + foundations/ + patterns/ documentation
governance/     # accessibility, lifecycle, versioning rules + ADRs (decisions/)
.claude/skills/ # custom Claude Code skills (none yet)
```

## Source of truth

- **Figma** = design intent (what something should look like).
- **`src/tokens/{core,brands/*,semantic}/*.json`** = shipped token values. Figma should mirror
  these; if they disagree, code wins for anything already released.
- **Multi-brand**: components consume semantic tokens only and never know the brand; brands
  differ only in the `brand.*` contract (primary ramp, sans family, control/container radius).
  Runtime switch: `data-brand="brand-a|brand-b"` on `<html>` or any container; no attribute =
  Brand A. See `docs/foundations/theming.md` and ADR 0011.
- **React (`src/components/`)** = component behavior and public API.
- **Storybook** = the coded documentation of how components actually behave — treat a
  story as more authoritative than a written description if they conflict.
- **`docs/design-to-code-mappings.md`** = manually maintained map from Figma components
  to React components. There is no automated sync (Figma Code Connect is not used) —
  update this file by hand whenever a component ships.

## Canonical Figma Source

- **File**: Production Design System
- **File key**: `zE07Pl0ioDayHN2GK2set7`
- **URL**: https://www.figma.com/design/zE07Pl0ioDayHN2GK2set7/Production-Design-System

This is the single source-of-truth Figma file for this design system. All foundations
and component work — Button, Input, Checkbox, and anything built after them — targets
this file exclusively.

- Do not create or modify components in another Figma file unless explicitly instructed.
- Before making any Figma change, inspect the existing component/page first — reuse and
  extend what's there instead of duplicating it.
- Preserve existing component IDs and architecture where possible; a rebuild from scratch
  is a decision to confirm with the user, not a default.

### Known page / component-set references (verified 2026-09-11)

| Component | Page (canvas) | Component set(s) | Notes |
| --- | --- | --- | --- |
| Button | `180:10` ("Button") | Outer: `115:224` (72 variants — Variant × Size × State). Nested: `678:802` ("Button Content", 36 variants — Size × Icon Layout × Tone). | See `docs/design-to-code-mappings.md` (Button section) for the full architecture. Outer set's own properties are Variant/Size/State only — Label and icons live on the exposed nested `content` instance (three unwired outer duplicates removed 2026-09-29). |
| Input | `714:10` ("Input") | Outer: `722:305` (24 variants — Size × Interaction × Validation). Nested Input Content, six sets (one per Size × Tone, 8 variants each = 48 total): `736:1018` (Sm/Default), `746:9` (Md/Default), `746:1018` (Lg/Default), `736:1019` (Sm/Disabled), `746:1017` (Md/Disabled), `746:1019` (Lg/Disabled). | See `docs/design-to-code-mappings.md` (Input section) for the full architecture. React `trailingAction` slot (interactive, not aria-hidden) added 2026-09-29 — no Figma property. |
| Password Input (verified 2026-09-29) | `1036:9` ("Password Input") | `1039:86` (4 variants — Visibility × Toggle) | Dedicated component built on Input (not an Input axis): each variant wraps an exposed nested Input instance named `input`, trailing icon swapped to Lucide `eye`/`eye-off`. React: `src/components/PasswordInput/PasswordInput.tsx`. |
| Checkbox | `769:9` ("Checkbox") | `769:74` (12 variants — Selection × Interaction) | Flat set, no nesting. Box radius bound to shared `Semantic Radius/checkbox` (not the brandable `radius/control`) so it stays square in every brand. |
| Radio (Figma only — React not yet built, verified 2026-09-11) | `903:9` ("Radio") | `905:44` (8 variants — Selected × Interaction) | Flat set, no nesting — mirrors Checkbox minus Indeterminate. Reference component: Checkbox. |
| Radio Group (Figma only — React not yet built, verified 2026-09-11) | `907:1396` ("Radio Group") | `907:1435` (2 variants — Validation) | Composes Radio instances; maps to native `<fieldset>`/`<legend>` in code, not `role="radiogroup"` (user-confirmed decision). No `docs/design-to-code-mappings.md` entry yet — deferred until the React implementation pass per the component-production skill's step ordering. |
| Switch (Figma only — React not yet built, verified 2026-09-11) | `934:9` ("Switch") | `934:50` (8 variants — State × Interaction) | Flat set, no nesting — mirrors Checkbox/Radio. Reference components: Checkbox, Radio. Off-track fill uses new component-scoped tokens `switch.track.background.off.{default,hover,disabled}` (`src/tokens/semantic/color.json`, deliberately not a shared `action.neutral.*` family — Switch-only until a second consumer justifies promotion); On-track fill reuses `action.primary.*` directly, no new token. Future React implementation must use `<input type="checkbox" role="switch">` (user-confirmed architecture), not a custom widget. No `docs/design-to-code-mappings.md` entry yet — deferred until the React implementation pass. |
| Badge (verified 2026-09-12) | `958:9` ("Badge") | `958:1573` (10 variants — Status × Emphasis) | Flat set, no nesting. Status: neutral/info/success/warning/danger — first real consumer of `color.feedback.*`. One size only (Checkbox/Radio/Switch precedent). Icon is `ReactNode`, optional, consumer-provided (not internally owned). React: `src/components/Badge/Badge.tsx`. |
| Alert (verified 2026-09-12) | `961:9` ("Alert") | `961:1634` (5 variants — Status only) | Flat set, no nesting. Icon is internally owned per status (fixed per variant, not a prop) — added two new stable DS icon-catalog names, `success` (Lucide `CircleCheck`) and `danger` (Lucide `CircleX`), to `src/icons/types.ts` + `src/icons/providers/lucide.ts` + `docs/foundations/icons.md` (per ADR 0010). Subtle emphasis only in V1; no action slot. No default ARIA live-region role (user-confirmed decision). React: `src/components/Alert/Alert.tsx`. |
| Textarea (verified 2026-09-12) | `961:1669` ("Textarea") | `961:1811` (24 variants — Size × Interaction × Validation) | Flat set, no nesting (no icon slots in V1, so no Icon-Layout-shaped axis to factor out). Reference component: Input. No fixed height constant — height is content-driven. React: `src/components/Textarea/Textarea.tsx`. |
| Select (verified 2026-09-12) | `961:1846` ("Select") | `961:2074` (24 variants — Size × Interaction × Validation) | Flat set, no nesting. Reference: Input field shell + native `<select>` (user-confirmed architecture — native element over a custom listbox/combobox). Chevron is a fixed, internally-owned icon (never a prop). Optional leading icon is a boolean + instance-swap property pair, not a variant axis. React: `src/components/Select/Select.tsx`. |
| Card (verified 2026-09-12; slot added 2026-09-29) | `967:9` ("Card") | `967:1625` (6 variants — Variant × Padding) | Flat set, no nesting. Native Figma slot property `Content` (added 2026-09-29) — the Figma equivalent of React `children`. No compound sub-parts (Header/Body/Footer) — consumer composes freely inside `children`. `outlined` (border.default) / `elevated` (surface.raised + elevation.raised, no border). React: `src/components/Card/Card.tsx`. |
| Tooltip (verified 2026-09-12) | `968:9` ("Tooltip") | `968:10` (single component, no variant axis) | Placement is a code-only layout prop, not a Figma variant. Uses `@floating-ui/react` (new runtime dependency, installed) for positioning/viewport-collision handling (flip/shift). Trigger wraps `children` in a plain span (not `cloneElement`) — works correctly even when the trigger itself is disabled. React: `src/components/Tooltip/Tooltip.tsx`. |
| Accordion (verified 2026-09-12) | `968:1638` ("Accordion") | `968:1736` ("Accordion Item", 8 variants — State × Interaction) | Flat set, no nesting. Custom `<button aria-expanded>` + panel composition (WAI-ARIA Accordion Pattern) — not native `<details>`/`<summary>`. Panel does **not** get `role="region"` by default (accessibility correction applied during React implementation — see `docs/design-to-code-mappings.md`). `Accordion`/`AccordionItem` compound API is core structure, not optional composition sugar. React: `src/components/Accordion/{Accordion,AccordionItem}.tsx`. |
| Tabs (verified 2026-09-12) | `968:1781` ("Tabs") | `968:1847` ("Tab", 8 variants — State × Interaction) | Flat set, no nesting. Automatic activation (arrow keys switch panels immediately), per WAI-ARIA's own "recommended in most instances" guidance. Compound API: `Tabs`/`TabList`/`Tab`/`TabPanels`/`TabPanel`. Horizontal only in V1. React: `src/components/Tabs/{Tabs,TabList,Tab,TabPanels,TabPanel}.tsx`. |
| Link (verified 2026-09-29) | `1036:11` ("Link") | `1038:15` (3 variants — Interaction) | Flat set, `Label` text property. Native `<a href>` (href required), one visual style, no router dependency. React: `src/components/Link/Link.tsx`. |
| Divider (verified 2026-09-29) | `1036:10` ("Divider") | `1037:11` (single component) | 1px `border/subtle`, horizontal only. `<hr>` by default; `decorative` adds `aria-hidden` (code-only). React: `src/components/Divider/Divider.tsx`. |
| Token collections (verified 2026-09-29) | — | `Core` (renamed from `Primitive`; shared scales + hue ramps incl. `color/violet/*`), `Brand` (modes **Brand A / Brand B**: `color/primary/*`, `font/family/sans`, `font/weight/*` style-name adapters, `radius/control`, `radius/container`), `Semantic Color/Space/Radius/Motion/Layout/Icon` (unchanged names, resolve through Brand + Core) | Preview a brand by setting a frame's **Brand** collection mode — see the "Brand B preview" section on Examples / Playground (`1063:1925`). ADR 0011. |
| Product examples (verified 2026-09-29) | `180:11` ("Examples / Playground") | Frames: `998:9` (01 Login), `1001:1726` (01b Login · Error), `998:10` (02 Dashboard), `1006:242` (02b Dashboard · Mobile), `998:11` (03 Settings · Profile tab), `1045:468` (03b Settings · Notifications), `1045:509` (03c Settings · Plan), `998:12` (04 Success) | Moved from Templates 2026-09-29. Built from DS instances (Card via its `Content` slot; PasswordInput, Link, Divider). One settings domain per tab. React counterparts: `src/examples/`. |
| Patterns (verified 2026-09-29) | `150:83` ("Patterns") | Doc frames: `1048:216` Form validation, `1048:275` Action group, `1048:309` Settings section, `1048:330` Page header | Documented compositions (not components). Guidelines: `docs/patterns/`. React reference compositions: `src/patterns/`. |
| Templates (verified 2026-09-29) | `150:84` ("Templates") | App shell (doc + Wide 1440 / Compact 375 specimens), Centered card layout (doc + narrow 400 / regular 440 specimens) | Same status as Patterns. ButtonLink has no Figma component — it is the Button component; `<a>` vs `<button>` is code-only. |

Node IDs are internal Figma identifiers, not a stable public API — re-verify with the
Figma MCP tools (`get_metadata`/`get_design_context`) before relying on them if this file
has been edited since the date above.

## Commands

- `npm run build` — build the library (tsup) → `dist/`
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (includes `eslint-plugin-jsx-a11y`) + `scripts/check-token-usage.mjs`
  (components/patterns/examples may not use Core primitives, `--brand-*`, or raw hex colors;
  documented exceptions only via `scripts/token-usage-exceptions.json`)
- `npm run format` / `npm run format:check` — Prettier
- `npm run tokens:build` — `scripts/build-tokens.mjs`: Style Dictionary once per brand over
  `src/tokens/{core,brands/<brand>,semantic}` → `src/tokens/build/`. Fails on an incomplete
  brand contract, a shared token that differs between brands, or a per-brand contrast pair
  below WCAG minimums. Brand-dependent tokens go to `css/brands/<brand>.css`
  (ADR 0011); shared CSS is split across three files: `css/variables.css` for most tokens
  (colors, typography primitives, spacing, radius, elevation, motion),
  `css/typography.css` for the expanded composite typography roles (see
  `governance/decisions/0003-typography-token-architecture.md`), and
  `css/motion-reduced-motion.css` for the `prefers-reduced-motion` override (see
  `governance/decisions/0008-motion-token-architecture.md`))
- `npm run storybook` — Storybook dev server
- `npm run build-storybook` — static Storybook build

## Conventions

- Token source files use the DTCG format (`$value`, `$type`, `$description`). Never
  hand-edit anything under `src/tokens/build/` — it's generated.
- New components go in `src/components/<ComponentName>/`, exported from `src/index.ts`.
- Every component needs a Storybook story before it can leave "Alpha" — see
  `governance/component-lifecycle.md`.
- Accessibility bar: WCAG 2.2 AA. Full checklist in `governance/accessibility.md`;
  `eslint-plugin-jsx-a11y` and `@storybook/addon-a11y` are the automated first pass, not
  the whole check.
- Governance policy text lives in `governance/*.md` — link to it, don't duplicate it here.

## Git workflow

- Trunk-based: short-lived branches off `main` (`feat/...`, `fix/...`, `docs/...`).
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Versioning is currently manual (see `governance/versioning.md`) — Changesets tooling
  is deferred, not yet wired up.

## Currently deferred (do not assume these exist)

Vitest/Testing Library, Changesets automation, CI/CD, npm publishing, monorepo tooling,
Figma Code Connect, dark mode (Light/Dark color scheme — multi-brand theming IS implemented,
see ADR 0011), brand-specific neutrals, native (RN/SwiftUI/Compose) token outputs, custom
Claude skills. See
`governance/decisions/0001-single-package-structure.md` for why.
