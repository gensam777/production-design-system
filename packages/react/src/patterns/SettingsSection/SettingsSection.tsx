import { useId } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ActionGroup } from '../ActionGroup/ActionGroup';
import './SettingsSection.css';

export interface SettingsSectionProps {
  /** Section title — an `<h2>` that also names the `<form>` (via `aria-labelledby`). */
  title: ReactNode;
  /** Optional supporting line below the title. */
  description?: ReactNode;
  /** The section's fields. One settings domain = one section = one save scope. */
  children: ReactNode;
  /** Called on submit (Save button or Enter in a field). `preventDefault` is handled. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  /** Called by Cancel — typically resets this section's draft to its last saved values. */
  onCancel?: () => void;
  /** Puts the Save button into its loading state while this section saves. */
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
}

/**
 * Settings section (pattern — documented composition, not an exported DS component).
 * One settings domain as one real `<form>` with its own heading and its own Cancel/Save
 * action group, inside an outlined Card. Never share a save scope across domains. See
 * `docs/patterns/settings-section.md`.
 */
export function SettingsSection({
  title,
  description,
  children,
  onSubmit,
  onCancel,
  saving = false,
  submitLabel = 'Save changes',
  cancelLabel = 'Cancel',
  className,
}: SettingsSectionProps) {
  const headingId = useId();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <Card variant="outlined" padding="lg" className={className}>
      <form
        className="ds-pattern-settings-section"
        aria-labelledby={headingId}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="ds-pattern-settings-section__header">
          <h2 id={headingId} className="ds-pattern-settings-section__title">
            {title}
          </h2>
          {description && <p className="ds-pattern-settings-section__description">{description}</p>}
        </div>
        <div className="ds-pattern-settings-section__fields">{children}</div>
        <ActionGroup separated>
          <Button type="button" variant="tertiary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {submitLabel}
          </Button>
        </ActionGroup>
      </form>
    </Card>
  );
}

SettingsSection.displayName = 'SettingsSection';

export interface FieldRowProps {
  /** Two (occasionally three) closely related fields, e.g. first + last name. */
  children: ReactNode;
}

/**
 * Form layout helper: places closely related fields side by side when the *container* is
 * wide enough, stacked otherwise (container query, not viewport). See
 * `docs/patterns/settings-section.md`.
 */
export function FieldRow({ children }: FieldRowProps) {
  return <div className="ds-pattern-field-row">{children}</div>;
}

FieldRow.displayName = 'FieldRow';
