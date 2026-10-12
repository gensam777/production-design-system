import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';

import { Icon } from '../../icons';
import type { IconName } from '../../icons';
import './Alert.css';

export type AlertStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const STATUS_ICON: Record<AlertStatus, IconName> = {
  neutral: 'info',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Status color and icon. Defaults to `'info'`. Same five-value vocabulary as Badge,
   * intentionally shared across both components. The icon is internally owned per
   * status — there is no icon prop. */
  status?: AlertStatus;
  /** Optional title, rendered above `children`. Omit entirely (don't pass an empty
   * string) to render no title.
   *
   * The native `title` HTML attribute (a hover tooltip string) is intentionally omitted
   * from this type via `Omit<..., 'title'>` — `title` is reserved for this richer,
   * `ReactNode`-typed prop instead, so the two can never collide. */
  title?: ReactNode;
  /** Description content — the alert's required message body. */
  children: ReactNode;
  /** Shows a dismiss (close) affordance. Defaults to `false`. The consumer owns removing
   * the Alert from the tree via `onDismiss` — this component holds no open/closed state
   * itself. */
  dismissible?: boolean;
  /** Called when the dismiss button is activated. Only relevant when `dismissible` is
   * true. */
  onDismiss?: () => void;
}

/**
 * Production Alert (V1). Static, content-flow status banner — not a toast/snackbar,
 * which is a separate, out-of-scope component. Subtle emphasis only (no solid/strong
 * variant), no action slot (e.g. an inline Retry button) — both deferred to a future
 * version. No default ARIA live-region role: `role="alert"`/`role="status"` are for
 * content dynamically inserted after page load, and applying either unconditionally to
 * a statically-rendered Alert would interrupt screen readers on every page load — a
 * consumer dynamically injecting an Alert should pass the appropriate `role` themselves
 * (it passes through via `...rest`). See `docs/design-to-code-mappings.md` for the full
 * Figma ↔ code mapping.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { status = 'info', title, children, dismissible = false, onDismiss, className, ...rest },
  ref,
) {
  const rootClasses = ['ds-alert', `ds-alert--${status}`, className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={rootClasses} {...rest}>
      <span className="ds-alert__icon" aria-hidden="true">
        <Icon name={STATUS_ICON[status]} size="md" />
      </span>
      <div className="ds-alert__content">
        {title && <div className="ds-alert__title">{title}</div>}
        <div className="ds-alert__description">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="ds-alert__dismiss"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
});

Alert.displayName = 'Alert';
