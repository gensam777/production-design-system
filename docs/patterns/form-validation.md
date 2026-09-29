# Form validation & feedback

**Problem:** forms fail in two different ways — a field's value is wrong, or the whole
submission is rejected — and each needs a different, accessible treatment. The audit found
Login blaming the password field for an authentication failure and Settings with no real
`<form>` at all.

## Rules

1. **Use a real `<form>`** with a `type="submit"` primary Button, so Enter submits and
   there is one place to validate. Non-submitting controls inside it (Cancel, the
   PasswordInput toggle) are `type="button"`.
2. **Field errors (client-side, the value is wrong)** — on submit (not on every keystroke):
   - set `error` + `errorText` on each invalid field (Input, PasswordInput, Textarea,
     Select, RadioGroup). This sets `aria-invalid` and points `aria-describedby` at the
     message;
   - move focus to the **first** invalid field;
   - error text says what to do ("Enter an email address, like name@example.com."), not
     just what is wrong;
   - keep `helperText` for guidance that applies before an error ("At least 12
     characters.") — `errorText` replaces it while `error` is true.
3. **Form-level errors (the submission failed — authentication, server, conflict)**:
   - one danger `Alert` at the **top of the form**, inside it, with `role="alert"` (it is
     injected after submit; Alert has no default live-region role by design);
   - **no field is marked invalid** for an authentication failure — never reveal or imply
     which credential was wrong ("Your email or password is incorrect.");
   - keep the entered values; keep focus where it is (the alert announces itself).
4. **Loading**: the submit Button's `loading` state; don't disable the whole form.
5. **Success**: confirm in context — a success `Alert` (static, or `role="status"` if
   injected) or navigate to a confirmation screen (Centered card layout). Don't stack a
   success Alert under a heading that already says the same thing.
6. Use `noValidate` on the form when you render your own messages, so native browser
   bubbles don't compete with DS error text.

## Accessibility

- Error state is never color-only: `errorText` is visible text and announced via
  `aria-describedby`.
- `role="alert"` only for content inserted after an interaction — never on page load.
- Focus management: first invalid field (client errors); unchanged (form-level errors).

## Implementation

- Storybook: `Patterns/Form validation` (Client-side field errors, Form-level
  authentication error). Applied in `src/examples/Login` (form-level only).
- Figma: Patterns page → "Form validation"; Examples → 01b Login · Error state (Alert
  only, password field in its default state).
