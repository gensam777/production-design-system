import type { ReactNode } from 'react';

import { useTabsContext } from './Tabs';

export interface TabProps {
  /** Identifies this tab and the `TabPanel` it controls — must match a sibling
   * `TabPanel`'s `value`. */
  value: string;
  /** Disables this tab. Native `disabled` attribute — excluded from arrow-key
   * navigation automatically since `TabList` only queries enabled tabs. */
  disabled?: boolean;
  /** Icon rendered before the label. Any `ReactNode` — Tab never imports an icon
   * library. */
  leadingIcon?: ReactNode;
  /** Tab label. */
  children: ReactNode;
}

/**
 * `role="tab"` trigger — a real `<button>`. Roving tabindex: only the selected tab is
 * `tabIndex={0}`; every other tab is `-1`, so Tab/Shift+Tab from outside the tablist
 * lands on the selected tab, and arrow keys (handled by the parent `TabList`) move
 * focus — and, per V1's automatic-activation model, selection — among all tabs.
 */
export function Tab({ value, disabled = false, leadingIcon, children }: TabProps) {
  const { baseId, value: activeValue, setValue } = useTabsContext();
  const isSelected = value === activeValue;
  const tabId = `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const rootClasses = ['ds-tab', isSelected ? 'ds-tab--selected' : 'ds-tab--unselected']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      role="tab"
      id={tabId}
      data-value={value}
      className={rootClasses}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
    >
      <span className="ds-tab__content">
        {leadingIcon && (
          <span className="ds-tab__icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <span className="ds-tab__label">{children}</span>
      </span>
      <span className="ds-tab__indicator" aria-hidden="true" />
    </button>
  );
}

Tab.displayName = 'Tab';
