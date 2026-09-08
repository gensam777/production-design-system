import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import './Input.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Design-system size. Defaults to `'md'`.
   *
   * The native HTML `size` attribute (`size?: number` — a character-width hint) is
   * intentionally omitted from this type via `Omit<..., 'size'>`: `size` is reserved for
   * this prop instead, so the two never collide.
   */
  size?: InputSize;
  /** Field label. Rendered as a real `<label>`, associated with the input via
   * `htmlFor`/`id` — never a substitute for a real accessible name. Omit entirely (don't
   * pass an empty string) to render no label. */
  label?: ReactNode;
  /** Helper text shown below the field. Replaced by `errorText` while `error` is true. */
  helperText?: ReactNode;
  /** Applies the error visual treatment (border, `aria-invalid`) and error-toned support
   * text. Independent of native constraint validation — this is an explicit, controlled
   * flag, not derived from `:invalid`. */
  error?: boolean;
  /** Shown in the support region instead of `helperText` while `error` is true. If
   * `error` is true and this is omitted, `helperText` is shown instead (the support
   * region never disappears just because `errorText` wasn't provided). */
  errorText?: ReactNode;
  /** Icon rendered before the value/placeholder text. Any `ReactNode` — Input never
   * imports an icon library. See `governance/decisions/0010-icon-token-architecture.md`. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the value/placeholder text. Same contract as `leadingIcon`. */
  trailingIcon?: ReactNode;
}

/**
 * Production Input (V1). Native `<input>`, provider-neutral icon slots, native
 * placeholder/value behavior (no `hasValue`/`content` state). See
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    label,
    helperText,
    error = false,
    errorText,
    leadingIcon,
    trailingIcon,
    id,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  // Generated only when the caller doesn't pass their own id — the caller's id always
  // wins, so existing id-dependent integrations (form libraries, test selectors) aren't
  // disrupted by adopting label/support-text association.
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const supportTextId = `${inputId}-support`;

  // Icon presence, not a separate prop, drives the icon-adjacent padding refinement — see
  // Input.css's "Icon-adjacent padding" block and docs/design-to-code-mappings.md for the
  // approved per-size values. Mirrors Button's leadingIcon/trailingIcon-derived layout.
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);

  // Validation content priority: errorText while erroring, otherwise helperText. If
  // error is true but errorText wasn't provided, helperText still shows — error never
  // silently blanks the support region.
  const supportContent = error && errorText !== undefined ? errorText : helperText;
  const hasSupportContent = supportContent !== undefined && supportContent !== null && supportContent !== '';

  const rootClasses = [
    'ds-input',
    `ds-input--${size}`,
    hasLeadingIcon && 'ds-input--has-leading-icon',
    hasTrailingIcon && 'ds-input--has-trailing-icon',
    error && 'ds-input--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {label && (
        <label htmlFor={inputId} className="ds-input__label">
          {label}
        </label>
      )}
      <div className="ds-input__field">
        {leadingIcon && (
          <span className="ds-input__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className="ds-input__field-input"
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={hasSupportContent ? supportTextId : undefined}
          {...rest}
        />
        {trailingIcon && (
          <span className="ds-input__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>
      {hasSupportContent && (
        <span id={supportTextId} className="ds-input__support">
          {supportContent}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
