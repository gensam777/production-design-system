import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import './Card.css';

export type CardVariant = 'outlined' | 'elevated';
export type CardPadding = 'none' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual treatment. `'outlined'` (border, no shadow) or `'elevated'` (shadow, no
   * border). Defaults to `'outlined'`. */
  variant?: CardVariant;
  /** Internal padding. Defaults to `'lg'`. `'none'` covers the common edge-to-edge
   * content case (e.g. a card wrapping an image). */
  padding?: CardPadding;
}

/**
 * Production Card (V1). Plain `<div>` — a generic surface for grouping content. No
 * compound sub-parts (`Card.Header`/`Card.Body`/`Card.Footer`); the consumer composes
 * freely inside `children`. No interaction semantics — Card is not clickable and has no
 * onClick/role of its own; a consumer wanting a clickable card composes their own
 * `<button>`/`<a>` inside or around it. See `docs/design-to-code-mappings.md` for the
 * full Figma ↔ code mapping.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'outlined', padding = 'lg', className, children, ...rest },
  ref,
) {
  const rootClasses = [
    'ds-card',
    `ds-card--${variant}`,
    `ds-card--padding-${padding}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={rootClasses} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';
