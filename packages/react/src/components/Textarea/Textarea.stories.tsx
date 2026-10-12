import type { Meta, StoryObj } from '@storybook/react-vite';

import { Textarea } from './Textarea';
import type { TextareaSize } from './Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component:
          'Textarea V1 — native `<textarea>`, no icon slots (intentional divergence from ' +
          'Input), no fixed height constant (height is content-driven via `rows` + ' +
          'padding). Hover, Focus-visible are native CSS states, not React props — see ' +
          '`docs/design-to-code-mappings.md`.',
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
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    rows: { control: 'number' },
  },
  args: {
    size: 'md',
    label: 'Description',
    helperText: 'Tell us a bit more.',
    error: false,
    disabled: false,
    placeholder: 'Type here…',
  },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <Textarea {...args} />
    </div>
  ),
};

const ALL_SIZES: TextareaSize[] = ['sm', 'md', 'lg'];

export const AllSizes: Story = {
  name: 'All sizes',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      {ALL_SIZES.map((size) => (
        <Textarea key={size} {...args} size={size} label={`Label (${size})`} />
      ))}
    </div>
  ),
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Textarea {...args} label="Default" />
      <Textarea {...args} label="Hover (hover over the field to see it)" />
      <Textarea {...args} label="Focus-visible (tab into the field to see it)" />
      <Textarea {...args} label="Disabled" disabled defaultValue="Can't edit this" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          "stories — hover or tab into the fields above to see them. No `autoFocus` is " +
          'used (jsx-a11y flags it, and it would steal focus on story load).',
      },
    },
  },
};

export const ValidationStates: Story = {
  name: 'Validation states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Textarea {...args} label="No error" helperText="Helper text" />
      <Textarea
        {...args}
        label="Error, with errorText"
        error
        helperText="Helper text"
        errorText="This field is required"
      />
      <Textarea
        {...args}
        label="Error, no errorText (falls back to helperText)"
        error
        helperText="Helper text still shows"
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Textarea {...args} label="Disabled, placeholder" disabled />
      <Textarea {...args} label="Disabled, with value" disabled defaultValue="Some existing text." />
      <Textarea
        {...args}
        label="Disabled + error (disabled wins visually)"
        disabled
        error
        errorText="This won't show as red — disabled takes precedence"
      />
    </div>
  ),
};

export const ResizeAndRows: Story = {
  name: 'Resize and rows',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Textarea {...args} label="Default rows (3)" />
      <Textarea {...args} label="rows={6}" rows={6} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Resize stays enabled (`resize: vertical`, never `none`) — a consumer can drag ' +
          'the handle to see more of what they typed. `rows` is a native attribute, ' +
          'passed straight through; the component defaults it to `3` when not supplied.',
      },
    },
  },
};

export const LongLabelWrapping: Story = {
  name: 'Long label / wrapping',
  render: (args) => (
    <div style={{ width: 240 }}>
      <Textarea
        {...args}
        label="This is a much longer field label that should wrap across multiple lines when constrained to a narrow width"
      />
    </div>
  ),
};

export const WithoutLabel: Story = {
  name: 'Without label',
  render: (args) => <Textarea {...args} label={undefined} aria-label="Description" />,
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
