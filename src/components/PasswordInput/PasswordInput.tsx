import { forwardRef, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, Ref } from 'react';

import { Input } from '../Input';
import type { InputProps, InputSize } from '../Input';
import { Icon } from '../../icons';
import type { IconSize } from '../../icons';

export interface PasswordInputProps extends Omit<
  InputProps,
  'type' | 'trailingIcon' | 'trailingAction'
> {
  /**
   * Accessible name of the show/hide control. Defaults to `'Show password'`.
   *
   * The name is intentionally **static** — the control's state is conveyed by
   * `aria-pressed` (`false` while the value is hidden, `true` while it is shown), so
   * assistive technology announces e.g. "Show password, toggle button, pressed". Do not
   * pass a label that changes with the state (such as "Hide password") — that would give
   * the control two competing ways of announcing the same state. Override only to
   * localize.
   */
  visibilityToggleLabel?: string;
}

// PasswordInput owns its show/hide icon (like Checkbox owns its check mark), so it maps
// the Input size to the matching approved icon size itself. Input's action slot also
// sizes the svg to 100% of the slot, so this only sets the intrinsic width/height.
const ICON_SIZE: Record<InputSize, IconSize> = { sm: 'sm', md: 'md', lg: 'lg' };

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) (ref as { current: T | null }).current = value;
}

/**
 * Production PasswordInput (V1). A dedicated component built on Input — not an Input
 * variant — that owns the password visibility state and an accessible show/hide control
 * rendered in Input's interactive `trailingAction` slot. Every other Input behavior
 * (label, helper/error text, `aria-invalid`/`aria-describedby`, sizes, disabled) is
 * Input's own. See `docs/design-to-code-mappings.md` (PasswordInput section).
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { visibilityToggleLabel = 'Show password', size = 'md', id, disabled, ...rest },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Selection captured just before the type switch, restored right after it — some
    // browsers reset the caret/selection when an input's `type` changes.
    const pendingSelection = useRef<[number | null, number | null] | null>(null);

    const generatedId = useId();
    const inputId = id ?? generatedId;

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    useLayoutEffect(() => {
      const input = inputRef.current;
      const selection = pendingSelection.current;
      pendingSelection.current = null;
      if (!input || !selection) return;
      const [start, end] = selection;
      if (start !== null && end !== null) input.setSelectionRange(start, end);
    }, [visible]);

    const toggle = () => {
      const input = inputRef.current;
      pendingSelection.current = input ? [input.selectionStart, input.selectionEnd] : null;
      setVisible((v) => !v);
    };

    // Mouse/pen users keep focus (and the caret) in the field while toggling; keyboard
    // users still reach the control with Tab and keep focus on it, so its aria-pressed
    // change is announced.
    const keepFieldFocus = (event: MouseEvent<HTMLButtonElement>) => {
      if (document.activeElement === inputRef.current) event.preventDefault();
    };

    return (
      <Input
        {...rest}
        ref={setInputRef}
        id={inputId}
        size={size}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        // A revealed password is plain text: stop mobile keyboards and spellcheck from
        // capitalizing, "correcting" or underlining it. Harmless while masked.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        trailingAction={
          <button
            type="button"
            className="ds-password-input__toggle"
            aria-label={visibilityToggleLabel}
            aria-pressed={visible}
            aria-controls={inputId}
            disabled={disabled}
            onMouseDown={keepFieldFocus}
            onClick={toggle}
          >
            <Icon name={visible ? 'eye-off' : 'eye'} size={ICON_SIZE[size]} />
          </button>
        }
      />
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
