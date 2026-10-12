import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import './Switch.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> {
  /** Field label. Rendered as a real `<label>`, associated with the switch via
   * `htmlFor`/`id` — never a substitute for a real accessible name. Omit entirely (don't
   * pass an empty string) to render no label; provide `aria-label`/`aria-labelledby`
   * directly (they pass through natively) to keep an accessible name in that case. */
  label?: ReactNode;
}

/**
 * Production Switch (V1). Native `<input type="checkbox" role="switch">` — the
 * established WAI-ARIA switch pattern, not a custom widget: every native checkbox
 * behavior (checked/unchecked state, name/value form participation, Space to toggle,
 * label association) works unchanged, while `role="switch"` makes assistive tech
 * announce it as "switch, on/off" instead of "checkbox, checked". `type`/`role` are
 * omitted from `SwitchProps` and hardcoded internally so neither can be overridden.
 * One fixed visual size (36×20 track, 16×16 thumb, 40×24 minimum interaction target) —
 * same convention as Checkbox/Radio, its closest reference components. Hover,
 * Focus-visible, and Disabled are native CSS states, not React props. Use Switch only for
 * settings that take effect immediately (no separate form-submit step) — see
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, id, className, disabled, ...rest },
  ref,
) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const rootClasses = ['ds-switch', className].filter(Boolean).join(' ');

  return (
    <div className={rootClasses}>
      <span className="ds-switch__control">
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={switchId}
          className="ds-switch__input"
          disabled={disabled}
          {...rest}
        />
        {/* Purely decorative — the native input above already carries switch
            semantics/state, so every visual node here is aria-hidden. */}
        <span className="ds-switch__track" aria-hidden="true">
          <span className="ds-switch__thumb" />
        </span>
      </span>
      {label != null && (
        <label htmlFor={switchId} className="ds-switch__label">
          {label}
        </label>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';
