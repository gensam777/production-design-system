import type { ReactNode } from 'react';

import { useTabsContext } from './Tabs';

export interface TabPanelProps {
  /** Must match the `value` of the `Tab` this panel belongs to. */
  value: string;
  children: ReactNode;
}

/**
 * `role="tabpanel"` — associated back to its `Tab` via `aria-labelledby`. `tabIndex={0}`
 * per WAI-ARIA APG guidance, so a keyboard user can focus and scroll the panel region
 * itself even when its content has no focusable elements of its own. Inactive panels
 * use the native `hidden` attribute (no open/close animation is intended for tab
 * switching, unlike Accordion's panel reveal) — content is not mounted, so there is no
 * `role="region"`/inert question here the way there was for Accordion.
 */
export function TabPanel({ value, children }: TabPanelProps) {
  const { baseId, value: activeValue } = useTabsContext();
  const isSelected = value === activeValue;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      hidden={!isSelected}
      className="ds-tab-panel"
    >
      {isSelected && children}
    </div>
  );
}

TabPanel.displayName = 'TabPanel';
