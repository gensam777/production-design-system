# Production Design System

A production-style React design system — tokens, components, and Storybook
documentation — built as a reusable template for future app projects.

## Status

Early scaffold. No components yet. See `governance/decisions/0001-single-package-structure.md`
for the current architectural decisions and what's deliberately deferred.

## Structure

- `src/components/` — React components
- `src/tokens/` — design token source (`primitive/`, `semantic/`, `themes/`) and generated
  output (`build/`, gitignored)
- `.storybook/` — Storybook configuration
- `docs/` — `design-to-code-mappings.md` and foundation documentation
- `governance/` — accessibility, component lifecycle, and versioning rules, plus
  architecture decision records in `decisions/`
- `.claude/skills/` — custom Claude Code skills (none yet)

## Getting started

```bash
npm install
npm run storybook       # start Storybook
npm run build           # build the library
npm run tokens:build    # regenerate token output from src/tokens source
npm run typecheck
npm run lint
```

## Source of truth

| Concern | Source of truth |
| --- | --- |
| Design intent | Figma |
| Shipped token values | `src/tokens/{primitive,semantic}/*.json` |
| Component behavior/API | React (`src/components/`) |
| Component documentation | Storybook |
| Figma ↔ component mapping | `docs/design-to-code-mappings.md` (manual) |

See `CLAUDE.md` for more detail and conventions.
