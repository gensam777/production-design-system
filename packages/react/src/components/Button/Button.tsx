import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment. Defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Control size. Defaults to `'md'`. */
  size?: ButtonSize;
  /**
   * The action has been triggered and its result is pending. Shows a spinner in place of the
   * label/icons (width, height and accessible name unchanged), keeps the variant's normal
   * colors, sets `aria-busy`, stays focusable and blocks activation — `onClick` doesn't run and
   * a submit button doesn't submit its form. Ignored while `disabled` is set: disabled wins
   * (contract `states.precedence`, `design/contracts/components/button.contract.yaml`).
   */
  loading?: boolean;
  /** Icon rendered before the label. Any `ReactNode` — Button never imports an icon library. */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label. Any `ReactNode` — Button never imports an icon library. */
  trailingIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Production Button (V1). Native `<button>`, provider-neutral icon slots, spinner-only
 * loading state. See `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping
 * and `governance/decisions/0010-icon-token-architecture.md` for why icon props stay
 * `ReactNode` instead of an `iconName` prop.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    children,
    type = 'button',
    disabled = false,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  // Disabled wins over loading: a disabled button is never busy and shows its label.
  const isLoading = loading && !disabled;
  // Icon presence, not just the slot content, drives the horizontal-padding refinement
  // below — see Button.css's "Icon-adjacent padding" block and
  // docs/design-to-code-mappings.md for the approved per-size values.
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    isLoading && 'ds-button--loading',
    hasLeadingIcon && 'ds-button--has-leading-icon',
    hasTrailingIcon && 'ds-button--has-trailing-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Loading is not `disabled` (that would drop focus and report the button as unavailable),
  // so activation is blocked here instead. Pointer, Enter/Space and a form's implicit
  // submission all arrive as a click on the button; preventDefault also stops the submit.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...rest}
    >
      <span className="ds-button__content">
        {/* aria-hidden set here, not left to whatever was passed in — leadingIcon/trailingIcon
            accept any ReactNode, and Button's own visible label already carries the
            accessible name, so the slot must never contribute a second one. */}
        {leadingIcon && (
          <span className="ds-button__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <span className="ds-button__label">{children}</span>
        {trailingIcon && (
          <span className="ds-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </span>
      {isLoading && <span className="ds-button__spinner" aria-hidden="true" />}
    </button>
  );
});

Button.displayName = 'Button';
