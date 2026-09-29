# Page header

**Problem:** every page repeated the same title + description block by hand, with
inconsistent spacing (Settings added an extra margin Dashboard didn't).

## Anatomy

`<h1>` title (`text.heading.sm.semibold`, `text.primary`) → optional description
(`text.body.sm.regular`, `text.secondary`), `space.stack.xs` between → optional actions,
end-aligned, wrapping below the text when narrow.

## Rules

- Exactly **one `<h1>` per page**, and it is the page header's title. Section titles
  inside the page are `<h2>`.
- **No outer margin** — the App shell container gap (`space.stack.xl` Compact /
  `space.stack.2xl` Medium+) spaces it from the content.
- Actions are page-level only (e.g. "New project"); form actions belong in an Action group.

## Implementation

- React: `src/patterns/PageHeader`; used by `src/examples/Dashboard` and
  `src/examples/Settings`.
- Storybook: `Patterns/Page header`.
- Figma: Patterns page → "Page header"; product frames use a `page-heading` frame.
- Centered-card screens (Login, Success) put their `<h1>` in the card instead — see
  [Centered card layout](./centered-card-layout.md).
