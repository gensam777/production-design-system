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
