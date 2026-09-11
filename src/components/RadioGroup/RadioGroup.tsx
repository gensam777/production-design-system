import { forwardRef, useId } from 'react';
import type { FieldsetHTMLAttributes, ReactNode } from 'react';

import './RadioGroup.css';

export interface RadioGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children'> {
  /** Group label. Rendered as a real `<legend>` inside the `<fieldset>` — never a
   * substitute for a real accessible name. Named `legend`, not `label` (unlike
   * Input/Checkbox), to stay honest about what it actually renders. If omitted, pass
   * `aria-label` or `aria-labelledby` directly (both pass through natively) — a
   * RadioGroup must never ship with no accessible name at all. */
  legend?: ReactNode;
  /** Helper text shown below the group. Replaced by `errorText` while `error` is true. */
  helperText?: ReactNode;
  /** Applies the error-toned support text. Purely visual/textual — unlike Input's
   * `error`, this never sets `aria-invalid`: a `<fieldset>` has no native invalid-state
   * equivalent to `<input>`'s constraint-validation model. See
   * `docs/design-to-code-mappings.md` for the full reasoning. */
  error?: boolean;
  /** Shown in the support region instead of `helperText` while `error` is true. If
   * `error` is true and this is omitted, `helperText` is shown instead (the support
   * region never disappears just because `errorText` wasn't provided). */
  errorText?: ReactNode;
  /** The group's `Radio` items. RadioGroup does not clone or inject props into these —
   * give each `Radio` the same native `name` yourself, exactly as you would with plain
   * HTML radios; this component stays purely structural. */
  children: ReactNode;
}

/**
 * Production RadioGroup (V1). Native `<fieldset>`/`<legend>` — not `role="radiogroup"` —
 * so the group role and accessible name come from the browser natively. Purely
 * structural: does not generate or inject a shared `name` onto its children, and native
 * `disabled` on the `<fieldset>` already cascades to every descendant form control for
 * free (no extra code needed). See `docs/design-to-code-mappings.md` for the full Figma
 * ↔ code mapping.
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { legend, helperText, error = false, errorText, children, id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const groupId = id ?? generatedId;
  const supportTextId = `${groupId}-support`;

  // Validation content priority: errorText while erroring, otherwise helperText. If
  // error is true but errorText wasn't provided, helperText still shows — error never
  // silently blanks the support region. Same rule as Input.
  const supportContent = error && errorText !== undefined ? errorText : helperText;
  const hasSupportContent = supportContent !== undefined && supportContent !== null && supportContent !== '';

  const rootClasses = ['ds-radio-group', error && 'ds-radio-group--error', className]
    .filter(Boolean)
    .join(' ');

  return (
    <fieldset
      ref={ref}
      id={groupId}
      className={rootClasses}
      aria-describedby={hasSupportContent ? supportTextId : undefined}
      {...rest}
    >
      {legend != null && <legend className="ds-radio-group__legend">{legend}</legend>}
      {/* Legend stays a direct <fieldset> child in native document flow (see
          RadioGroup.css for why) — content is a separate flex column so the
          legend-to-content gap is a plain margin, not a flex `gap` that would require
          <legend> to participate correctly in flex-item layout, which browsers are
          inconsistent about. */}
      <div className="ds-radio-group__content">
        <div className="ds-radio-group__items">{children}</div>
        {hasSupportContent && (
          <span id={supportTextId} className="ds-radio-group__support">
            {supportContent}
          </span>
        )}
      </div>
    </fieldset>
  );
});

RadioGroup.displayName = 'RadioGroup';
