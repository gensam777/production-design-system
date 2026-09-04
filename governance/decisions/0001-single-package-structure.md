# 0001: Single-package structure, no Code Connect, minimal tooling at start

- **Status**: Accepted
- **Date**: 2026-09-02

## Context

This is a new design system, starting from nothing, intended to also serve as a reusable
template for future app projects. An earlier proposal considered a pnpm monorepo
(separate `tokens`, `react`, `figma-code-connect` packages) and Figma Code Connect for
automated design-to-code mapping.

## Decision

- Keep this as a **single package** (no monorepo tooling) until there's an actual need
  to version/publish tokens and components independently.
- Do **not** adopt Figma Code Connect. Design-to-code mapping is a manually maintained
  file: `docs/design-to-code-mappings.md`.
- Token pipeline: **Style Dictionary**, source files in `src/tokens/{primitive,semantic,themes}`,
  generated output in `src/tokens/build/` (gitignored).
- Defer: Vitest/Testing Library, Changesets, CI/CD, npm publishing, dark mode/theming
  implementation, and custom Claude Code skills — none of these are needed to start the
  Color foundation work, and setting them up now would be speculative.

## Consequences

- Splitting into a monorepo later is a known, deferred migration, not a blocker now.
- Design-to-code mapping accuracy depends on discipline (manual updates), not tooling —
  acceptable at this scale; revisit if drift becomes a recurring problem.
- Token build output is regenerated via `npm run tokens:build`; it is never hand-edited.
- Versioning is manual until Changesets is introduced (see
  [versioning.md](../versioning.md)).
