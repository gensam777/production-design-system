# Centered card layout (template)

**Problem:** Login and Success duplicated byte-identical page wrappers and heading styles,
with two unexplained card widths.

## Anatomy

`<main>` (`surface.canvas`, `space.layout.xl` top/bottom, `space.layout.sm` side gutter,
centered) → outlined Card (`space.inset.lg`) → `<h1>` title → optional description →
content (`space.stack.lg` between everything by default; `space.stack.md` with `compact`).

## Rules

- For **focused flows outside the app shell**: sign-in, password reset, confirmation.
  Inside the product, use the App shell.
- The card title is the page's single `<h1>`.
- **Widths (decided):** `regular` = 440px for sign-in (Login) and confirmation/message
  content (Success); `narrow` = 400px remains available for very short forms. Composition
  constants matching Figma, not tokens. (Login moved from `narrow` to `regular` on
  2026-09-30 to match the updated Figma Login frames.)
- **Spacing (decided):** default `space.stack.lg` (16px). `compact` = `space.stack.md`
  (12px) for form-dense screens — Login uses it, and its form's own field gap matches
  (`space.stack.md`) so the whole card reads as one 12px rhythm, as in the flat Figma
  Content slot. Opt-in per screen, not a density system; Success keeps the default.
  (Login moved to `compact` on 2026-09-30.)
- Primary action is a single full-width Button (acts) or ButtonLink (navigates).
- Confirmation: heading + description + primary action; add an Alert only for extra,
  different information (e.g. "you'll receive an email").

## Accessibility

- When a single-page app routes to a centered-card screen (e.g. after submitting), move
  focus to the `<h1>` or update `document.title` so the change is announced (the example
  screens don't, to avoid stealing focus in Storybook).

## Implementation

- React: `src/patterns/CenteredCardLayout` (`width="narrow" | "regular"`, `compact`); used
  by Login (regular, compact) and Success (regular). `narrow` has no product-screen consumer
  today.
- Storybook: `Patterns/Centered card layout`.
- Figma: Templates page → "Centered card layout"; product frames 01/01b (440) and 04 (440).
