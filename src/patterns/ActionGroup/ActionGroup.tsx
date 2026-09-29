import type { ReactNode } from 'react';

import { Divider } from '../../components/Divider';
import './ActionGroup.css';

export interface ActionGroupProps {
  /**
   * The actions, in reading order: secondary/cancel first, the primary action **last**.
   * DOM order is the visual order at every width (no `row-reverse`), so tab order always
   * matches what is seen.
   */
  children: ReactNode;
  /** Draws a decorative Divider above the actions (form/section footers). */
  separated?: boolean;
  className?: string;
}

/**
 * Action group (pattern — documented composition, not an exported DS component). End-
 * aligned row of Buttons with the primary action last; stacks full-width when its
 * container is narrow. See `docs/patterns/action-group.md`.
 */
export function ActionGroup({ children, separated = false, className }: ActionGroupProps) {
  const classes = ['ds-pattern-action-group', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      {separated && <Divider decorative />}
      <div className="ds-pattern-action-group__actions">{children}</div>
    </div>
  );
}

ActionGroup.displayName = 'ActionGroup';
