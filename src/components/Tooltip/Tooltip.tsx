import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';

import './Tooltip.css';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip content. */
  content: ReactNode;
  /** Preferred side. Floating UI flips/shifts away from this when there isn't room —
   * see `flip()`/`shift()` below. Defaults to `'top'`. */
  placement?: TooltipPlacement;
  /** The trigger. Wrapped in a plain `<span>` (never cloned) so Tooltip works correctly
   * even when the trigger itself is a disabled native control, which fires no
   * mouse/focus events of its own. */
  children: ReactElement;
}

/**
 * Production Tooltip (V1). Floating UI (`@floating-ui/react`) handles positioning,
 * viewport collision (flip/shift), and the WAI-ARIA tooltip role/`aria-describedby`
 * wiring via `useRole`. Shown on both hover and keyboard focus of the trigger, dismissed
 * on Escape or on losing hover/focus. No arrow/pointer in V1. See
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export function Tooltip({ content, placement = 'top', children }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  // useRole wires up role="tooltip" on the floating element and aria-describedby on the
  // reference element automatically — no manual id bookkeeping needed.
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  // A disabled native control fires no mouse/focus events of its own, so the reference
  // ref + interaction props live on this wrapping span rather than being cloned onto
  // `children` — this is what lets a tooltip work on a disabled trigger.
  return (
    <>
      <span
        ref={refs.setReference}
        className="ds-tooltip-trigger"
        {...getReferenceProps()}
      >
        {children}
      </span>
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="ds-tooltip"
          {...getFloatingProps()}
        >
          {content}
        </div>
      )}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
