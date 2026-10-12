import { forwardRef, useEffect, useId, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Field label. Rendered as a real `<label>`, associated with the checkbox via
   * `htmlFor`/`id` — never a substitute for a real accessible name. Omit entirely (don't
   * pass an empty string) to render no label; provide `aria-label`/`aria-labelledby`
   * directly (they pass through natively) to keep an accessible name in that case. */
  label?: ReactNode;
  /**
   * Mixed/partial-selection state. Not a third value a user can pick — set this only from
   * derived group-selection state (see `docs/design-to-code-mappings.md`).
   *
   * `indeterminate` is a DOM property, not an HTML attribute, so it can't be set via JSX
   * the way `checked` can — this prop is synchronized onto the underlying `<input>` via a
   * ref effect. When both `checked` and `indeterminate` are true, `indeterminate` wins
   * visually (native `:indeterminate` CSS is ordered after `:checked` in `Checkbox.css`),
   * matching the approved Figma Selection precedence.
   */
  indeterminate?: boolean;
}

/**
 * Production Checkbox (V1). Native `<input type="checkbox">`, internal SVG check/dash
 * marks (never Lucide/`Icon` — see `docs/design-to-code-mappings.md`), one fixed visual
 * size (16×16 box, 24×24 minimum interaction target). Hover, Focus-visible, and Disabled
 * are native CSS states, not React props — same convention as Button/Input.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate = false, id, className, disabled, ...rest },
  ref,
) {
  // Internal ref is required regardless of whether the caller also forwards one:
  // `indeterminate` is a DOM property with no JSX/HTML attribute equivalent, so it can
  // only be set imperatively on the actual <input> node — see the effect below.
  const internalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  // Merge the internal ref (needed for the indeterminate sync above) with whatever ref
  // the caller passed in, supporting both the callback and object-ref forms of `ref`.
  const setRefs = (node: HTMLInputElement | null) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const rootClasses = ['ds-checkbox', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <span className="ds-checkbox__control">
        <input
          ref={setRefs}
          type="checkbox"
          id={checkboxId}
          className="ds-checkbox__input"
          disabled={disabled}
          {...rest}
        />
        {/* Purely decorative — the native input above already carries checkbox
            semantics/state, so every visual node here is aria-hidden. */}
        <span className="ds-checkbox__box" aria-hidden="true">
          <svg
            className="ds-checkbox__mark ds-checkbox__mark--check"
            viewBox="0 0 16 16"
            focusable="false"
          >
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
          </svg>
          <svg
            className="ds-checkbox__mark ds-checkbox__mark--dash"
            viewBox="0 0 16 16"
            focusable="false"
          >
            <path d="M4 8H12" />
          </svg>
        </span>
      </span>
      {label != null && (
        <label htmlFor={checkboxId} className="ds-checkbox__label">
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';
