import type { ReactNode } from 'react';

import { Link } from '../../components/Link';
import './AppShell.css';

export interface AppShellNavItem {
  label: string;
  href: string;
  /** Marks the item for the page currently shown (`aria-current="page"`). */
  current?: boolean;
}

export interface AppShellProps {
  /** Page content, rendered inside the gutter + 1280px content container. */
  children: ReactNode;
  /** Product name / wordmark shown at the start of the nav bar. */
  brand?: ReactNode;
  /** Primary navigation. Rendered as `Link`s inside a labelled `<nav>` landmark. */
  navItems: AppShellNavItem[];
  /**
   * Non-essential context at the end of the nav bar (plan badge, user name). Hidden below
   * the `viewport.md` breakpoint rather than reflowed — never put navigation here.
   */
  secondary?: ReactNode;
  /** Id of the `<main>` element — the skip link's target. */
  mainId?: string;
  className?: string;
}

/**
 * App shell template (pattern — documented composition, not an exported DS component).
 * Skip link → header with brand, labelled primary `<nav>` of Links and optional secondary
 * content → `<main>` with the page gutter *outside* the 1280px content cap
 * (viewport → gutter → `layout.container.maxWidth` → content). See
 * `docs/patterns/app-shell.md`.
 */
export function AppShell({
  children,
  brand = 'Workspace',
  navItems,
  secondary,
  mainId = 'main-content',
  className,
}: AppShellProps) {
  const rootClasses = ['ds-pattern-app-shell', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <a className="ds-pattern-app-shell__skip" href={`#${mainId}`}>
        Skip to main content
      </a>
      <header className="ds-pattern-app-shell__nav">
        <span className="ds-pattern-app-shell__brand">{brand}</span>
        <div className="ds-pattern-app-shell__nav-end">
          <nav aria-label="Main">
            <ul className="ds-pattern-app-shell__nav-list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={item.current ? 'page' : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {secondary && <div className="ds-pattern-app-shell__secondary">{secondary}</div>}
        </div>
      </header>
      {/* tabIndex={-1} lets the skip link move focus here in every browser. */}
      <main id={mainId} tabIndex={-1} className="ds-pattern-app-shell__main">
        <div className="ds-pattern-app-shell__container">{children}</div>
      </main>
    </div>
  );
}

AppShell.displayName = 'AppShell';
