import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import './Divider.css';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /**
   * Hide the divider from assistive technology. Defaults to `false`.
   *
   * - `false` (default): a native `<hr>` — announced as a separator. Use it for a
   *   meaningful break between distinct groups of content (e.g. Settings sections).
   * - `true`: same `<hr>` and identical visuals, plus `aria-hidden="true"`. Use it for
   *   visual rhythm inside something already structured — rows of a list, the rule above
   *   an action bar — where announcing a separator would only be noise.
   */
  decorative?: boolean;
}

/**
 * Production Divider (V1). 1px horizontal rule (`border.subtle`) that fills its
 * container's width and owns no margin — the parent's gap controls spacing. Horizontal
 * only; no vertical orientation until a real consumer needs one. See
 * `docs/design-to-code-mappings.md` (Divider section).
 */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { decorative = false, className, ...rest },
  ref,
) {
  const classes = ['ds-divider', className].filter(Boolean).join(' ');

  return <hr ref={ref} className={classes} aria-hidden={decorative || undefined} {...rest} />;
});

Divider.displayName = 'Divider';
