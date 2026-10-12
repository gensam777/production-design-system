import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import './Accordion.css';

interface AccordionContextValue {
  openValues: Set<string>;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export function useAccordionContext(): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionItem must be rendered inside an <Accordion>.');
  }
  return context;
}

export interface AccordionProps {
  /** When `false` (default), opening an item closes any other open item — the
   * traditional, exclusive "accordion" behavior. When `true`, any number of items may
   * be open at once. */
  allowMultiple?: boolean;
  /** Initially open item value(s), by `AccordionItem`'s `value` prop. Uncontrolled —
   * there is no `value`/`onValueChange` pair in V1. */
  defaultValue?: string | string[];
  /** `AccordionItem` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Production Accordion (V1) — root. Manages which item(s) are open; see `AccordionItem`
 * for the trigger/panel implementation. Custom `<button aria-expanded>` + panel
 * composition (WAI-ARIA Accordion Pattern) — confirmed decision over native
 * `<details>`/`<summary>`, chosen for animatable open/close height and trivial
 * `allowMultiple` exclusive-group logic. See `docs/design-to-code-mappings.md` for the
 * full Figma ↔ code mapping.
 */
export function Accordion({ allowMultiple = false, defaultValue, children, className }: AccordionProps) {
  const [openValues, setOpenValues] = useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  });

  const toggle = useCallback(
    (value: string) => {
      setOpenValues((prev) => {
        const isOpen = prev.has(value);
        if (allowMultiple) {
          const next = new Set(prev);
          if (isOpen) {
            next.delete(value);
          } else {
            next.add(value);
          }
          return next;
        }
        return isOpen ? new Set<string>() : new Set([value]);
      });
    },
    [allowMultiple],
  );

  const rootClasses = ['ds-accordion', className].filter(Boolean).join(' ');

  return (
    <AccordionContext.Provider value={{ openValues, toggle }}>
      <div className={rootClasses}>{children}</div>
    </AccordionContext.Provider>
  );
}

Accordion.displayName = 'Accordion';
