import type { ReactNode } from 'react';

import './PageHeader.css';

export interface PageHeaderProps {
  /** Page title — rendered as the page's single `<h1>`. */
  title: ReactNode;
  /** Optional one-line description below the title. */
  description?: ReactNode;
  /** Optional page-level actions (Buttons / ButtonLinks), end-aligned on wide screens. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Page header (pattern — documented composition, not an exported DS component). The
 * page's `<h1>` + optional description + optional actions. Owns no outer margin: the
 * AppShell container's gap spaces it from the content below. See
 * `docs/patterns/page-header.md`.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  const classes = ['ds-pattern-page-header', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <div className="ds-pattern-page-header__text">
        <h1 className="ds-pattern-page-header__title">{title}</h1>
        {description && <p className="ds-pattern-page-header__description">{description}</p>}
      </div>
      {actions && <div className="ds-pattern-page-header__actions">{actions}</div>}
    </div>
  );
}

PageHeader.displayName = 'PageHeader';
