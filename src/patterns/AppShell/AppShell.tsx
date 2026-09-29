import type { ReactNode } from 'react';

import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import './AppShell.css';

export interface AppShellProps {
  /** Page content, rendered inside the capped/centered main region. */
  children: ReactNode;
  /** Shown in the nav bar; hidden below the mobile breakpoint (non-essential context —
   * see AppShell.css). Defaults to a neutral placeholder name. */
  userName?: string;
  /** Plan Badge label; hidden below the mobile breakpoint alongside `userName`. */
  planLabel?: string;
  onNavigateSettings?: () => void;
  className?: string;
}

/**
 * Shared nav + capped/centered content shell for the multi-screen product flow example
 * (Dashboard, Settings). Not a design-system component — a local composition pattern
 * built from Badge/Button plus this system's `layout.container.maxWidth` and
 * `space.layout.*` tokens, matching the "App shell: nav + capped container" pattern
 * identified during the Figma flow pass. Lives under `src/examples/`, not exported from
 * `src/index.ts`.
 */
export function AppShell({
  children,
  userName = 'Jordan Lee',
  planLabel = 'Free plan',
  onNavigateSettings,
  className,
}: AppShellProps) {
  const rootClasses = ['ds-example-app-shell', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <header className="ds-example-app-shell__nav">
        <span className="ds-example-app-shell__brand">Workspace</span>
        <div className="ds-example-app-shell__nav-right">
          <Badge className="ds-example-app-shell__plan-badge">{planLabel}</Badge>
          <Button variant="tertiary" size="sm" onClick={onNavigateSettings}>
            Settings
          </Button>
          <span className="ds-example-app-shell__user-name">{userName}</span>
        </div>
      </header>
      <main className="ds-example-app-shell__body">{children}</main>
    </div>
  );
}

AppShell.displayName = 'AppShell';
