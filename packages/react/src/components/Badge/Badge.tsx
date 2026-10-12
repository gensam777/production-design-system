import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import './Badge.css';

export type BadgeStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BadgeEmphasis = 'subtle' | 'strong';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Status color. Defaults to `'neutral'`. First real consumer of `color.feedback.*`
   * for `info`/`success`/`warning`/`danger`; `neutral` reuses `surface.sunken`/
   * `text.secondary` (subtle) and `surface.inverse`/`text.inverse` (strong). */
  status?: BadgeStatus;
  /** Visual weight. `'subtle'` (tinted background, colored text/icon) or `'strong'`
   * (solid background, on-color text/icon). Defaults to `'subtle'`. */
  emphasis?: BadgeEmphasis;
  /** Optional leading icon. Any `ReactNode` — Badge never imports an icon library. See
   * `governance/decisions/0010-icon-token-architecture.md`. */
  icon?: ReactNode;
  /** Badge label text. */
  children: ReactNode;
}

/**
 * Production Badge (V1). Plain `<span>` — static, non-interactive status/category label.
 * No dismiss, no interaction states, one fixed size (matches Checkbox/Radio/Switch's
 * "stays visually stable relative to surrounding text" precedent). See
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { status = 'neutral', emphasis = 'subtle', icon, className, children, ...rest },
  ref,
) {
  const rootClasses = [
    'ds-badge',
    `ds-badge--${status}`,
    `ds-badge--${emphasis}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span ref={ref} className={rootClasses} {...rest}>
      {icon && (
        <span className="ds-badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ds-badge__label">{children}</span>
    </span>
  );
});

Badge.displayName = 'Badge';
