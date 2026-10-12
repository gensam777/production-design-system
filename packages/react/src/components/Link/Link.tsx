import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import './Link.css';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Destination. Required — a Link always navigates somewhere. Something that performs an
   * action instead (submit, save, open a dialog) is a Button, not a Link, and an element
   * that currently goes nowhere should not render as a link at all (there is deliberately
   * no `disabled` state).
   */
  href: string;
  /** Visible link text — also the accessible name, so make it meaningful out of context. */
  children: ReactNode;
}

/**
 * Production Link (V1). A real `<a href>` for navigation, with one visual style (no
 * variants) and no router dependency. All native anchor attributes (`target`, `rel`,
 * `download`, `onClick`, `aria-current`, …) and the ref pass straight through, so an app
 * can integrate a routing library later by intercepting `onClick` or wrapping this
 * component. See `docs/design-to-code-mappings.md` (Link section).
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { className, children, ...rest },
  ref,
) {
  const classes = ['ds-link', className].filter(Boolean).join(' ');

  return (
    <a ref={ref} className={classes} {...rest}>
      {children}
    </a>
  );
});

Link.displayName = 'Link';
