# CLAUDE.md

Guidance for Claude Code when working in this repo.

## What this is

A production-style React design system (single package, not a monorepo): design tokens,
components, and Storybook documentation, meant to also serve as a template for future
app projects.

## Structure

```
src/
  components/   # React components (none yet)
  tokens/       # token source (primitive/, semantic/, themes/) + generated build/ output
  index.ts      # public entry point / barrel export
.storybook/     # Storybook config
docs/           # design-to-code-mappings.md + foundations documentation
governance/     # accessibility, lifecycle, versioning rules + ADRs (decisions/)
.claude/skills/ # custom Claude Code skills (none yet)
```

## Source of truth

- **Figma** = design intent (what something should look like).
- **`src/tokens/{primitive,semantic}/*.json`** = shipped token values. Figma should mirror
  these; if they disagree, code wins for anything already released.
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
| Button | `180:10` ("Button") | Outer: `115:224` (72 variants — Variant × Size × State). Nested: `678:802` ("Button Content", 36 variants — Size × Icon Layout × Tone). | See `docs/design-to-code-mappings.md` (Button section) for the full architecture. |
| Input | `714:10` ("Input") | Outer: `722:305` (24 variants — Size × Interaction × Validation). Nested Input Content, six sets (one per Size × Tone, 8 variants each = 48 total): `736:1018` (Sm/Default), `746:9` (Md/Default), `746:1018` (Lg/Default), `736:1019` (Sm/Disabled), `746:1017` (Md/Disabled), `746:1019` (Lg/Disabled). | See `docs/design-to-code-mappings.md` (Input section) for the full architecture. |
| Checkbox | `769:9` ("Checkbox") | `769:74` (12 variants — Selection × Interaction) | Flat set, no nesting. |
| Radio (Figma only — React not yet built, verified 2026-09-11) | `903:9` ("Radio") | `905:44` (8 variants — Selected × Interaction) | Flat set, no nesting — mirrors Checkbox minus Indeterminate. Reference component: Checkbox. |
| Radio Group (Figma only — React not yet built, verified 2026-09-11) | `907:1396` ("Radio Group") | `907:1435` (2 variants — Validation) | Composes Radio instances; maps to native `<fieldset>`/`<legend>` in code, not `role="radiogroup"` (user-confirmed decision). No `docs/design-to-code-mappings.md` entry yet — deferred until the React implementation pass per the component-production skill's step ordering. |
| Switch (Figma only — React not yet built, verified 2026-09-11) | `934:9` ("Switch") | `934:50` (8 variants — State × Interaction) | Flat set, no nesting — mirrors Checkbox/Radio. Reference components: Checkbox, Radio. Off-track fill uses new component-scoped tokens `switch.track.background.off.{default,hover,disabled}` (`src/tokens/semantic/color.json`, deliberately not a shared `action.neutral.*` family — Switch-only until a second consumer justifies promotion); On-track fill reuses `action.primary.*` directly, no new token. Future React implementation must use `<input type="checkbox" role="switch">` (user-confirmed architecture), not a custom widget. No `docs/design-to-code-mappings.md` entry yet — deferred until the React implementation pass. |

Node IDs are internal Figma identifiers, not a stable public API — re-verify with the
Figma MCP tools (`get_metadata`/`get_design_context`) before relying on them if this file
has been edited since the date above.

## Commands

- `npm run build` — build the library (tsup) → `dist/`
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (includes `eslint-plugin-jsx-a11y`)
- `npm run format` / `npm run format:check` — Prettier
- `npm run tokens:build` — Style Dictionary: `src/tokens/{primitive,semantic}` → `src/tokens/build/`
  (CSS output is split across three files: `css/variables.css` for most tokens
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
Figma Code Connect, dark mode/theming implementation, custom Claude skills. See
`governance/decisions/0001-single-package-structure.md` for why.
