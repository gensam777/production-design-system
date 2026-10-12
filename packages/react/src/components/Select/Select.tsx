import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes, ReactNode } from 'react';

import { Icon } from '../../icons';
import './Select.css';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Design-system size. Defaults to `'md'`.
   *
   * The native HTML `size` attribute (`size?: number` — visible-row count) is
   * intentionally omitted from this type via `Omit<..., 'size'>` — the same collision
   * Input already solved, for the same reason: `size` is reserved for this prop.
   */
  size?: SelectSize;
  /** Field label. Rendered as a real `<label>`, associated with the select via
   * `htmlFor`/`id` — never a substitute for a real accessible name. Omit entirely (don't
   * pass an empty string) to render no label. */
  label?: ReactNode;
  /** Helper text shown below the field. Replaced by `errorText` while `error` is true. */
  helperText?: ReactNode;
  /** Applies the error visual treatment (border, `aria-invalid`) and error-toned support
   * text. Independent of native constraint validation — this is an explicit, controlled
   * flag, not derived from `:invalid`. */
  error?: boolean;
  /** Shown in the support region instead of `helperText` while `error` is true. If
   * `error` is true and this is omitted, `helperText` is shown instead. */
  errorText?: ReactNode;
  /** Icon rendered before the selected value. Any `ReactNode` — Select never imports an
   * icon library for this slot. See `governance/decisions/0010-icon-token-architecture.md`. */
  leadingIcon?: ReactNode;
  /** `<option>`/`<optgroup>` elements. Select never clones or inspects `children` — the
   * consumer supplies them directly, exactly as they would with a plain `<select>`. */
  children: ReactNode;
}

/**
 * Production Select (V1). Native `<select>` (confirmed architecture decision — matches
 * this system's native-first philosophy across Button/Input/Checkbox/Radio/Switch rather
 * than a custom listbox/combobox). The trailing chevron is internally owned (an
 * `<Icon name="chevron-down" />`, the named example in `docs/foundations/icons.md`) —
 * always shown, never a prop. `leadingIcon` is the only consumer-facing icon slot,
 * provider-neutral like Input's. No `placeholder` prop — native `<select>` has no
 * placeholder attribute; supply a disabled, empty-value `<option>` yourself. See
 * `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = 'md',
    label,
    helperText,
    error = false,
    errorText,
    leadingIcon,
    id,
    className,
    disabled,
    children,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const supportTextId = `${selectId}-support`;

  const hasLeadingIcon = Boolean(leadingIcon);

  const supportContent = error && errorText !== undefined ? errorText : helperText;
  const hasSupportContent = supportContent !== undefined && supportContent !== null && supportContent !== '';

  const rootClasses = [
    'ds-select',
    `ds-select--${size}`,
    hasLeadingIcon && 'ds-select--has-leading-icon',
    error && 'ds-select--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {label && (
        <label htmlFor={selectId} className="ds-select__label">
          {label}
        </label>
      )}
      <div className="ds-select__field">
        {leadingIcon && (
          <span className="ds-select__icon ds-select__icon--leading" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <select
          ref={ref}
          id={selectId}
          className="ds-select__control"
          disabled={disabled}
          aria-invalid={error || undefined}
          aria-describedby={hasSupportContent ? supportTextId : undefined}
          {...rest}
        >
          {children}
        </select>
        <span className="ds-select__icon ds-select__icon--chevron" aria-hidden="true">
          <Icon name="chevron-down" size={size} />
        </span>
      </div>
      {hasSupportContent && (
        <span id={supportTextId} className="ds-select__support">
          {supportContent}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
