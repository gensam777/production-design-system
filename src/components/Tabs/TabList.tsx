import type { KeyboardEvent, ReactNode } from 'react';

import { useTabsContext } from './Tabs';

export interface TabListProps {
  /** `Tab` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * `role="tablist"` container. Implements arrow-key navigation (roving tabindex) by
 * querying its own `[role="tab"]` DOM children at keydown time rather than maintaining
 * a separate JS registry — `Tab`'s id/value are already derivable from the DOM, so
 * there's nothing extra to keep in sync. Automatic activation: moving focus with arrow
 * keys also selects the newly-focused tab (see `Tabs`'s own doc comment).
 */
export function TabList({ children, className }: TabListProps) {
  const { setValue } = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );
    if (tabs.length === 0) return;

    const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex === -1 || currentIndex === tabs.length - 1 ? 0 : currentIndex + 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
    }

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    nextTab.focus();
    const nextValue = nextTab.dataset.value;
    if (nextValue !== undefined) {
      setValue(nextValue);
    }
  };

  const rootClasses = ['ds-tab-list', className].filter(Boolean).join(' ');

  // tablist is a composite widget: per WAI-ARIA, focus lives on its child `tab` elements
  // via roving tabindex (see Tab.tsx), never on the tablist container itself. The rule's
  // "interactive roles must be focusable" heuristic doesn't special-case composite
  // container roles (tablist/listbox/menu/grid), so this is a known false positive, not
  // a real accessibility gap.
  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div role="tablist" className={rootClasses} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

TabList.displayName = 'TabList';
