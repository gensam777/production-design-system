import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual treatment. Defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Control size. Defaults to `'md'`. */
  size?: ButtonSize;
  /**
   * Shows a spinner in place of the label/icons while keeping the button's width and
   * accessible name unchanged. Sets `aria-busy` and forces `disabled` (native V1
   * behavior — see `docs/design-to-code-mappings.md`).
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
    disabled,
    className,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  // Icon presence, not just the slot content, drives the horizontal-padding refinement
  // below — see Button.css's "Icon-adjacent padding" block and
  // docs/design-to-code-mappings.md for the approved per-size values.
  const hasLeadingIcon = Boolean(leadingIcon);
  const hasTrailingIcon = Boolean(trailingIcon);
  const classes = [
    'ds-button',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    loading && 'ds-button--loading',
    hasLeadingIcon && 'ds-button--has-leading-icon',
    hasTrailingIcon && 'ds-button--has-trailing-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading || undefined}
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
      {loading && <span className="ds-button__spinner" aria-hidden="true" />}
    </button>
  );
});

Button.displayName = 'Button';
