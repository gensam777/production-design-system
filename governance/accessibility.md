# Accessibility Guidelines

## Baseline

Every component must meet **WCAG 2.2 AA** before it can be marked "stable" (see
[component-lifecycle.md](./component-lifecycle.md)).

## Checklist (applies to every component)

- **Keyboard**: fully operable without a mouse; visible focus indicator on every
  interactive element; logical tab order.
- **Semantics**: correct native element or ARIA role for the pattern; no `div`/`span`
  standing in for interactive controls.
- **Color contrast**: text and meaningful UI elements meet AA contrast minimums against
  every supported background/theme.
- **Screen reader**: name, role, and state are announced correctly; state changes
  (expanded, selected, disabled, loading) are communicated, not just visual.
- **Motion**: respects `prefers-reduced-motion` for any non-essential animation.
- **Zoom/reflow**: usable at 200% browser zoom without loss of content or function.

## Tooling

- `@storybook/addon-a11y` runs automated checks against every story — a clean run is
  necessary but not sufficient (automated tools catch roughly a third of real issues).
- `eslint-plugin-jsx-a11y` catches static issues (missing labels, invalid ARIA attributes)
  at write time.
- Manual keyboard and screen-reader spot checks are still required before a component
  moves to "stable."

## Ownership

Whoever reviews a component PR is responsible for verifying this checklist, not just
approving that automated checks passed.
