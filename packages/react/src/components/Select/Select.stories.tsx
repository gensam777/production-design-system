import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';
import type { SelectSize } from './Select';
import { Icon } from '../../icons';

const OPTIONS = (
  <>
    <option value="" disabled>
      Select an option
    </option>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
  </>
);

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    docs: {
      description: {
        component:
          'Select V1 — native `<select>` (confirmed architecture decision). The trailing ' +
          'chevron is internally owned, always shown, never a prop. `leadingIcon` is the ' +
          'only consumer-facing icon slot. No `placeholder` prop — supply a disabled, ' +
          'empty-value `<option>` yourself — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    errorText: { control: 'text' },
    disabled: { control: 'boolean' },
    leadingIcon: { control: false },
  },
  args: {
    size: 'md',
    label: 'Fruit',
    helperText: 'Choose your favorite.',
    error: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 280 }}>
      <Select {...args}>{OPTIONS}</Select>
    </div>
  ),
};

const ALL_SIZES: SelectSize[] = ['sm', 'md', 'lg'];

export const AllSizes: Story = {
  name: 'All sizes',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 280 }}>
      {ALL_SIZES.map((size) => (
        <Select key={size} {...args} size={size} label={`Label (${size})`}>
          {OPTIONS}
        </Select>
      ))}
    </div>
  ),
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
      <Select {...args} label="Default">
        {OPTIONS}
      </Select>
      <Select {...args} label="Hover (hover over the field to see it)">
        {OPTIONS}
      </Select>
      <Select {...args} label="Focus-visible (tab into the field to see it)">
        {OPTIONS}
      </Select>
      <Select {...args} label="Disabled" disabled>
        {OPTIONS}
      </Select>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          'stories — hover or tab into the fields above to see them.',
      },
    },
  },
};

export const ValidationStates: Story = {
  name: 'Validation states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
      <Select {...args} label="No error" helperText="Helper text">
        {OPTIONS}
      </Select>
      <Select
        {...args}
        label="Error, with errorText"
        error
        helperText="Helper text"
        errorText="Please choose an option"
      >
        {OPTIONS}
      </Select>
    </div>
  ),
};

export const WithLeadingIcon: Story = {
  name: 'With leading icon',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 280 }}>
      {ALL_SIZES.map((size) => (
        <Select
          key={size}
          {...args}
          size={size}
          label={undefined}
          leadingIcon={<Icon name="search" size={size} />}
        >
          {OPTIONS}
        </Select>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 280 }}>
      <Select {...args} label="Disabled" disabled>
        {OPTIONS}
      </Select>
      <Select
        {...args}
        label="Disabled + error (disabled wins visually)"
        disabled
        error
        errorText="This won't show as red — disabled takes precedence"
      >
        {OPTIONS}
      </Select>
    </div>
  ),
};

export const WithoutLabel: Story = {
  name: 'Without label',
  render: (args) => (
    <Select {...args} label={undefined} aria-label="Fruit">
      {OPTIONS}
    </Select>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When `label` is omitted, the field still needs an accessible name — pass ' +
          '`aria-label` or `aria-labelledby` directly; both pass through natively.',
      },
    },
  },
};
