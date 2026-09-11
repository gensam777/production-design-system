import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import './Radio.css';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Field label. Rendered as a real `<label>`, associated with the radio via
   * `htmlFor`/`id` — never a substitute for a real accessible name. Omit entirely (don't
   * pass an empty string) to render no label; provide `aria-label`/`aria-labelledby`
   * directly (they pass through natively) to keep an accessible name in that case. */
  label?: ReactNode;
}

/**
 * Production Radio (V1). Native `<input type="radio">`, one fixed visual size (16×16
 * circle, 24×24 minimum interaction target) — same convention as Checkbox, its closest
 * reference component. Hover, Focus-visible, and Disabled are native CSS states, not
 * React props. Radio has no group concept of its own — mutual exclusivity comes from
 * giving sibling Radios the same native `name`, exactly like plain HTML; see `RadioGroup`
 * for the `<fieldset>`/`<legend>` wrapper. See `docs/design-to-code-mappings.md` for the
 * full Figma ↔ code mapping.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, id, className, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const radioId = id ?? generatedId;

  const rootClasses = ['ds-radio', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <span className="ds-radio__control">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className="ds-radio__input"
          disabled={disabled}
          {...rest}
        />
        {/* Purely decorative — the native input above already carries radio
            semantics/state, so every visual node here is aria-hidden. */}
        <span className="ds-radio__box" aria-hidden="true">
          <span className="ds-radio__dot" />
        </span>
      </span>
      {label != null && (
        <label htmlFor={radioId} className="ds-radio__label">
          {label}
        </label>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';
