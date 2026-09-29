import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import type { ButtonSize, ButtonVariant } from '../Button';
import '../Button/Button.css';
import './ButtonLink.css';

/** Navigation is never destructive, so Button's `danger` variant is not offered. */
export type ButtonLinkVariant = Exclude<ButtonVariant, 'danger'>;

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Destination. Required — a ButtonLink always navigates. */
  href: string;
  /** Visual treatment, same as Button. Defaults to `'primary'`. */
  variant?: ButtonLinkVariant;
  /** Control size, same as Button. Defaults to `'md'`. */
  size?: ButtonSize;
  /** Icon rendered before the label. Any `ReactNode`, decorative (`aria-hidden`). */
  leadingIcon?: ReactNode;
  /** Icon rendered after the label. Any `ReactNode`, decorative (`aria-hidden`). */
  trailingIcon?: ReactNode;
  children: ReactNode;
}

/**
 * Production ButtonLink (V1). Navigation that is *designed* as a button (e.g. a primary
 * "Back to dashboard" call to action): a real `<a href>` wearing Button's exact styling —
 * same classes, tokens and states. Use Button for actions, Link for ordinary navigation,
 * and ButtonLink only when a navigation target must carry button emphasis.
 *
 * Deliberately not offered: `loading`, `disabled` (an anchor can't be disabled — don't
 * render a link to somewhere the user can't go) and the `danger` variant. In Figma this
 * is the regular Button component — the element difference is code-only. See
 * `docs/design-to-code-mappings.md` (ButtonLink section).
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'primary', size = 'md', leadingIcon, trailingIcon, children, className, ...rest },
  ref,
) {
  const classes = [
    'ds-button',
    'ds-button-link',
    `ds-button--${variant}`,
    `ds-button--${size}`,
    leadingIcon && 'ds-button--has-leading-icon',
    trailingIcon && 'ds-button--has-trailing-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a ref={ref} className={classes} {...rest}>
      <span className="ds-button__content">
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
    </a>
  );
});

ButtonLink.displayName = 'ButtonLink';
