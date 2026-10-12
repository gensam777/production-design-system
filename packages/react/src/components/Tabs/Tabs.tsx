import { createContext, useContext, useId, useState } from 'react';
import type { ReactNode } from 'react';

import './Tabs.css';

interface TabsContextValue {
  baseId: string;
  value: string | undefined;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab/TabList/TabPanel/TabPanels must be rendered inside a <Tabs>.');
  }
  return context;
}

export interface TabsProps {
  /** Controlled active tab value. */
  value?: string;
  /** Initial active tab value (uncontrolled). */
  defaultValue?: string;
  /** Called whenever the active tab changes — via click or arrow-key navigation
   * (V1 uses automatic activation: moving focus with the arrow keys also activates the
   * newly-focused tab). */
  onValueChange?: (value: string) => void;
  /** `TabList` and `TabPanels` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Production Tabs (V1) — root. Horizontal only; automatic activation (WAI-ARIA
 * guidance's own recommendation "in most instances"). See `TabList`/`Tab`/`TabPanels`/
 * `TabPanel` for the rest of the composition, and
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export function Tabs({ value, defaultValue, onValueChange, children, className }: TabsProps) {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  const rootClasses = ['ds-tabs', className].filter(Boolean).join(' ');

  return (
    <TabsContext.Provider value={{ baseId, value: activeValue, setValue }}>
      <div className={rootClasses}>{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.displayName = 'Tabs';
