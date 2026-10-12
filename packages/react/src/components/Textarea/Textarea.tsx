import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes, ReactNode } from 'react';

import './Textarea.css';

export type TextareaSize = 'sm' | 'md' | 'lg';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Design-system size. Defaults to `'md'`. Unlike `Input`, `<textarea>` has no native
   * `size` attribute to collide with, so no `Omit` is needed here.
   */
  size?: TextareaSize;
  /** Field label. Rendered as a real `<label>`, associated with the textarea via
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
   * `error` is true and this is omitted, `helperText` is shown instead (the support
   * region never disappears just because `errorText` wasn't provided). */
  errorText?: ReactNode;
}

/**
 * Production Textarea (V1). Native `<textarea>`, no icon slots (intentional divergence
 * from Input — icons in a height-growing multi-line field are not an established
 * pattern), no fixed height constant (height is content-driven via `rows` + padding,
 * not a component constant like Input/Button). Resize stays enabled
 * (`resize: vertical`, never `none`) — disabling it is a documented accessibility
 * anti-pattern. See `docs/design-to-code-mappings.md` for the full Figma ↔ code mapping.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = 'md',
    label,
    helperText,
    error = false,
    errorText,
    id,
    className,
    disabled,
    rows = 3,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const supportTextId = `${textareaId}-support`;

  const supportContent = error && errorText !== undefined ? errorText : helperText;
  const hasSupportContent = supportContent !== undefined && supportContent !== null && supportContent !== '';

  const rootClasses = ['ds-textarea', `ds-textarea--${size}`, error && 'ds-textarea--error', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {label && (
        <label htmlFor={textareaId} className="ds-textarea__label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className="ds-textarea__field"
        disabled={disabled}
        rows={rows}
        aria-invalid={error || undefined}
        aria-describedby={hasSupportContent ? supportTextId : undefined}
        {...rest}
      />
      {hasSupportContent && (
        <span id={supportTextId} className="ds-textarea__support">
          {supportContent}
        </span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
