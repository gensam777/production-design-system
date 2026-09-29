import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PasswordInput } from './PasswordInput';
import type { PasswordInputProps } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
  parameters: {
    docs: {
      description: {
        component:
          'PasswordInput V1 — a dedicated component built on Input (not an Input variant). ' +
          'Owns the visibility state and a real `<button type="button">` show/hide control ' +
          'in Input’s interactive `trailingAction` slot: static accessible name ("Show ' +
          'password"), state via `aria-pressed`, 24×24 minimum target, disabled with the ' +
          'input. Label, helper/error text, sizes and `autoComplete` are Input’s own. ' +
          'See `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    errorText: { control: 'text' },
    disabled: { control: 'boolean' },
    autoComplete: { control: 'select', options: ['current-password', 'new-password', 'off'] },
    visibilityToggleLabel: { control: 'text' },
  },
  args: {
    size: 'md',
    label: 'Password',
    helperText: 'At least 12 characters.',
    error: false,
    disabled: false,
    autoComplete: 'current-password',
    defaultValue: 'correct-horse',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PasswordInput>;

export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <PasswordInput key={size} {...args} size={size} label={`Password (${size})`} />
      ))}
    </div>
  ),
};

export const HelperAndError: Story = {
  name: 'Helper & error',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PasswordInput {...args} label="New password" autoComplete="new-password" />
      <PasswordInput
        {...args}
        label="New password"
        autoComplete="new-password"
        defaultValue="short"
        error
        errorText="Password must be at least 12 characters."
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const InsideForm: Story = {
  name: 'Inside a form (toggle never submits)',
  parameters: {
    docs: {
      description: {
        story:
          'Toggle visibility with the mouse or keyboard (Tab to the control, Space/Enter): ' +
          'the submit counter must not change. Only the Submit button submits.',
      },
    },
  },
  render: function InsideFormStory(args: PasswordInputProps) {
    const [submits, setSubmits] = useState(0);
    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmits((n) => n + 1);
    };
    return (
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PasswordInput {...args} name="password" />
        <button type="submit">Submit</button>
        <output aria-live="polite">Submitted {submits} times</output>
      </form>
    );
  },
};

export const LocalizedToggleLabel: Story = {
  name: 'Localized toggle label',
  args: {
    label: 'Contraseña',
    helperText: undefined,
    visibilityToggleLabel: 'Mostrar contraseña',
  },
};
