import type { ReactNode } from 'react';

export interface TabPanelsProps {
  /** `TabPanel` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Plain wrapper around `TabPanel` elements — WAI-ARIA has no "tabpanels" role; this
 * exists purely to mirror `TabList`'s organizational shape, not to add semantics.
 */
export function TabPanels({ children, className }: TabPanelsProps) {
  const rootClasses = ['ds-tab-panels', className].filter(Boolean).join(' ');
  return <div className={rootClasses}>{children}</div>;
}

TabPanels.displayName = 'TabPanels';
