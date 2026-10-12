import { useId, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { Icon } from '../../icons';
import { useAccordionContext } from './Accordion';

export interface AccordionItemProps {
  /** Identifies this item for `Accordion`'s open-state tracking (and, with
   * `allowMultiple`, `defaultValue`). Must be unique among sibling items. */
  value: string;
  /** Header label. */
  label: ReactNode;
  /** Disables the trigger. Native `disabled` attribute — native button Space/Enter
   * activation and focus removal are never reimplemented manually. */
  disabled?: boolean;
  /** Panel content, shown only while this item is expanded. */
  children: ReactNode;
}

/**
 * Production AccordionItem (V1). The trigger is a real `<button type="button">` inside
 * an `<h3>` — `aria-expanded`/`aria-controls` describe the relationship to the panel,
 * which is associated back via `aria-labelledby`. Native button keyboard behavior
 * (Space/Enter activation, focus handling) is never reimplemented — there is no
 * `onKeyDown` on the trigger at all.
 *
 * The panel does **not** get `role="region"` by default — per WAI-ARIA authoring
 * guidance, adding a landmark region to every panel in a long accordion creates
 * excessive landmark noise for screen-reader users navigating by landmark. Add
 * `role="region"` yourself (it passes through via a wrapping element you control, since
 * this component doesn't expose a panel `...rest`) only when a specific panel's content
 * genuinely warrants a landmark.
 *
 * The collapsed panel uses the `inert` attribute (not `hidden`) so it can be excluded
 * from focus/the accessibility tree while still being animatable (a `display: none`
 * panel, which `hidden` would force, cannot transition height).
 *
 * Collapse technique: a measured `max-height`, not the CSS Grid `grid-template-rows:
 * 0fr` trick this previously used — that relied on a bare `<flex>` track value being
 * treated as `minmax(auto, <flex>)` with `overflow` neutralizing the `auto` floor, which
 * held per spec but leaked visible content in a live browser regardless. `max-height: 0`
 * + `overflow: hidden` (see `Accordion.css`) is unconditional box-model clipping with no
 * equivalent ambiguity. `useLayoutEffect` measures `panelInnerRef.current.scrollHeight`
 * — which reports the content's true height even while it's currently clipped to 0, so
 * there's no "measure before it's hidden" ordering problem — and applies it as an inline
 * `max-height` before the browser paints, so the collapsed-by-default value in
 * `Accordion.css` is never actually visible mid-flash. No dependency: this is the whole
 * measurement, no `ResizeObserver`. Known V1 limitation: if a panel's content resizes
 * *while already expanded* (e.g. an image finishes loading), the measured `max-height`
 * doesn't automatically grow to match until something else re-triggers this effect —
 * not solved here, matching this system's practice of stating a limitation rather than
 * adding resize-observation machinery a real consumer hasn't asked for yet.
 */
export function AccordionItem({ value, label, disabled = false, children }: AccordionItemProps) {
  const { openValues, toggle } = useAccordionContext();
  const isExpanded = openValues.has(value);
  const generatedId = useId();
  const headerId = `${generatedId}-header`;
  const panelId = `${generatedId}-panel`;
  const panelRef = useRef<HTMLDivElement>(null);
  const panelInnerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const inner = panelInnerRef.current;
    if (!panel || !inner) return;
    panel.style.maxHeight = isExpanded ? `${inner.scrollHeight}px` : '0px';
  }, [isExpanded, children]);

  return (
    <div className="ds-accordion-item">
      <h3 className="ds-accordion-item__heading">
        <button
          type="button"
          id={headerId}
          className="ds-accordion-item__trigger"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          disabled={disabled}
          onClick={() => toggle(value)}
        >
          <span className="ds-accordion-item__label">{label}</span>
          <Icon
            name="chevron-down"
            size="md"
            className={
              'ds-accordion-item__chevron' + (isExpanded ? ' ds-accordion-item__chevron--expanded' : '')
            }
          />
        </button>
      </h3>
      <div
        ref={panelRef}
        id={panelId}
        aria-labelledby={headerId}
        inert={!isExpanded}
        className={
          'ds-accordion-item__panel' + (isExpanded ? ' ds-accordion-item__panel--expanded' : '')
        }
      >
        <div ref={panelInnerRef} className="ds-accordion-item__panel-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

AccordionItem.displayName = 'AccordionItem';
