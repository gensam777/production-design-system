import type { ReactNode } from 'react';

import { Card } from '../../components/Card';
import './CenteredCardLayout.css';

export type CenteredCardLayoutWidth = 'narrow' | 'regular';

export interface CenteredCardLayoutProps {
  /** Card title — rendered as the page's single `<h1>`. */
  title: ReactNode;
  /** Optional supporting line below the title. */
  description?: ReactNode;
  /**
   * `'narrow'` (400px) for short forms such as sign-in; `'regular'` (440px) for
   * confirmation / message content. Defaults to `'narrow'`. Composition constants that
   * match the approved Figma frames — not tokens.
   */
  width?: CenteredCardLayoutWidth;
  children: ReactNode;
  className?: string;
}

/**
 * Centered card layout (template — documented composition, not an exported DS component).
 * A single outlined Card, horizontally and vertically centered on the canvas, for focused
 * flows outside the app shell (sign-in, confirmation). See
 * `docs/patterns/centered-card-layout.md`.
 */
export function CenteredCardLayout({
  title,
  description,
  width = 'narrow',
  children,
  className,
}: CenteredCardLayoutProps) {
  const classes = ['ds-pattern-centered-card', className].filter(Boolean).join(' ');
  return (
    <main className={classes}>
      <Card
        variant="outlined"
        padding="lg"
        className={`ds-pattern-centered-card__card ds-pattern-centered-card__card--${width}`}
      >
        <h1 className="ds-pattern-centered-card__title">{title}</h1>
        {description && <p className="ds-pattern-centered-card__description">{description}</p>}
        {children}
      </Card>
    </main>
  );
}

CenteredCardLayout.displayName = 'CenteredCardLayout';
