# Action group

**Problem:** the same "Cancel / Save" footer was hand-built in several places with
inconsistent order, spacing and dividers.

## Anatomy

Optional decorative `Divider` (`separated`) → a row of Buttons, end-aligned,
`space.inline.md` between them, `space.stack.lg` below the divider.

## Rules

- **Order: secondary first, primary last** — in the DOM and visually (no `row-reverse`),
  so tab order always matches reading order.
- **One primary** per group. Cancel/Back is `tertiary` (Settings) or `secondary` (wizard
  "Back"); destructive uses `danger`.
- **Actions vs navigation**: Buttons act (`type="submit"` for the primary in a form,
  `type="button"` for the rest). A button-looking control that navigates is a
  `ButtonLink`, not a Button.
- Single full-width CTA in a narrow card (Login "Log in", Success "Back to dashboard") is
  not an action group — just a full-width Button / ButtonLink.

## Responsive

Container query: below **24rem** of available width the Buttons stack full-width in DOM
order (primary at the bottom); from 24rem they sit in an end-aligned row. 24rem is a
composition constant, not a token.

## Tokens

`space.inline.md` (between actions), `space.stack.lg` (divider → actions), Divider
`border.subtle`.

## Implementation

- React: `src/patterns/ActionGroup` (`<ActionGroup separated>`), used by
  `SettingsSection`.
- Storybook: `Patterns/Action group`.
- Figma: Patterns page → "Action group"; product frames 03/03b/03c use an `action-group`
  frame (Divider instance + end-aligned Cancel/Save).
