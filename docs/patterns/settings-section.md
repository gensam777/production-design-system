# Settings section & form layout

**Problem:** the Settings screen mixed several settings domains in one visual form with
per-panel Save buttons sharing one state (unclear what "Save" saved), duplicated a heading
as a fieldset legend ("Plan" / "Plan"), and switched a nested field row with a viewport
query.

## Rules

1. **One settings domain = one section = one `<form>` = one save scope** (approved
   decision). Domains are independent: saving or cancelling one never touches another. In
   a tabbed settings page, **each tab is one domain** (Profile · Notifications · Plan ·
   Security) — no tab ever holds two save scopes.
2. Each section: outlined Card → `<form aria-labelledby>` → `<h2>` section title
   (optional description) → fields → Action group (`separated`: Cancel, Save).
3. **Cancel** restores the section's last saved values; **Save** (`type="submit"`) commits
   only this section. Enter in a field submits this section only.
4. **Heading vs. legend:** the `<h2>` names the domain ("Plan"); a fieldset legend names
   the specific choice ("Choose a plan"). Never use the same text for both — it is
   announced twice.
5. Save feedback / errors follow [Form validation](./form-validation.md).

## Form layout

- Fields stack in one column with `space.stack.lg`.
- `FieldRow` puts 2 (rarely 3) closely related fields side by side (first + last name)
  when the **container** is ≥ 30rem wide; stacked below. A container query, because the
  row lives inside a Card, not at page level (docs/foundations/responsive.md). 30rem is a
  composition constant.
- A group of related toggles (Switches) stacks with `space.stack.md`.

## Accessibility

- The form is a named landmark via `aria-labelledby` → its `<h2>`.
- Tabs: the `tabpanel` is labelled by its tab; the section `<h2>` inside it may be more
  specific ("Profile information").
- Radio choices use `RadioGroup` (native `<fieldset>`/`<legend>`), not a bare set of Radios.

## Tokens

Title `text.label.lg.semibold`, description `text.body.sm.regular` / `text.secondary`,
field gap `space.stack.lg`, row gap `space.inline.md`, Card outlined / `space.inset.lg`.

## Implementation

- React: `src/patterns/SettingsSection` (`SettingsSection`, `FieldRow`); applied in
  `src/examples/Settings` (4 tabs, 3 independent save scopes).
- Storybook: `Patterns/Settings section`.
- Figma: Patterns page → "Settings section"; Examples → 03 (Profile), 03b (Notifications),
  03c (Plan).
