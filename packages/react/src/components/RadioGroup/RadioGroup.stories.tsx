import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RadioGroup } from './RadioGroup';
import { Radio } from '../Radio/Radio';

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    docs: {
      description: {
        component:
          'RadioGroup V1 — composes `Radio` instances under a native `<fieldset>`/' +
          '`<legend>`, with helper/error support text (same `helperText`/`error`/' +
          '`errorText` precedence as `Input`). Does not generate or inject a shared ' +
          '`name` — give every contained `Radio` the same `name` yourself. See ' +
          '`docs/design-to-code-mappings.md` for the full Figma ↔ code mapping, ' +
          'including why `error` never sets `aria-invalid` here (unlike `Input`).',
      },
    },
  },
  argTypes: {
    legend: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    errorText: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    legend: 'Shipping method',
    helperText: 'Choose how you’d like your order delivered.',
    error: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Playground: Story = {
  render: (args) => {
    function ControlledGroup() {
      const [value, setValue] = useState('standard');
      return (
        <RadioGroup {...args}>
          <Radio
            name="shipping-playground"
            label="Standard (5-7 days)"
            checked={value === 'standard'}
            onChange={() => setValue('standard')}
            disabled={args.disabled}
          />
          <Radio
            name="shipping-playground"
            label="Express (2-3 days)"
            checked={value === 'express'}
            onChange={() => setValue('express')}
            disabled={args.disabled}
          />
          <Radio
            name="shipping-playground"
            label="Overnight"
            checked={value === 'overnight'}
            onChange={() => setValue('overnight')}
            disabled={args.disabled}
          />
        </RadioGroup>
      );
    }
    return <ControlledGroup />;
  },
};

export const ErrorState: Story = {
  name: 'Error state',
  render: (args) => (
    <RadioGroup
      {...args}
      error
      errorText="Please select a shipping method."
    >
      <Radio name="shipping-error" label="Standard (5-7 days)" />
      <Radio name="shipping-error" label="Express (2-3 days)" />
      <Radio name="shipping-error" label="Overnight" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Error changes ONLY the support text (text.tertiary -> text.danger) — no ' +
          'border or background change on the group, and no `aria-invalid` is set (a ' +
          '`<fieldset>` has no native invalid-state equivalent to `Input`\'s).',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <RadioGroup {...args} disabled legend="Shipping method (disabled)">
      <Radio name="shipping-disabled" label="Standard (5-7 days)" defaultChecked />
      <Radio name="shipping-disabled" label="Express (2-3 days)" />
      <Radio name="shipping-disabled" label="Overnight" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Native `<fieldset disabled>` cascades disabled state to every contained ' +
          '`Radio` automatically — no per-item `disabled` prop needed on any of the ' +
          'three `Radio`s above.',
      },
    },
  },
};

export const WithoutLegend: Story = {
  name: 'Without legend (still named via aria-label)',
  render: (args) => (
    <RadioGroup {...args} legend={undefined} aria-label="Shipping method">
      <Radio name="shipping-unlabeled" label="Standard (5-7 days)" />
      <Radio name="shipping-unlabeled" label="Express (2-3 days)" />
      <Radio name="shipping-unlabeled" label="Overnight" />
    </RadioGroup>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `legend` is omitted, the group still needs an accessible name — pass ' +
          '`aria-label` or `aria-labelledby` directly; both pass through natively. ' +
          'Omitting all three would ship an unnamed RadioGroup and must not be done.',
      },
    },
  },
};

export const WithoutHelperText: Story = {
  name: 'Without helper text',
  render: (args) => (
    <RadioGroup {...args} helperText={undefined}>
      <Radio name="shipping-plain" label="Standard (5-7 days)" />
      <Radio name="shipping-plain" label="Express (2-3 days)" />
      <Radio name="shipping-plain" label="Overnight" />
    </RadioGroup>
  ),
};
