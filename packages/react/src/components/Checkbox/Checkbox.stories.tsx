import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          'Checkbox V1 — native `<input type="checkbox">`, internal SVG check/dash ' +
          'marks (never Lucide/`Icon`), one fixed visual size (16×16 box, 24×24 minimum ' +
          'interaction target). Hover, Focus-visible, and Disabled are native CSS ' +
          'states, not React props — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    checked: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    label: 'Label',
    indeterminate: false,
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

// Remounts on every `checked` control change (via `key`) so the Playground stays a real,
// clickable, warning-free controlled checkbox instead of a static one that ignores
// clicks — the args value seeds local state once per mount, then the checkbox owns its
// own toggling exactly like it would in a real controlled-form usage.
export const Playground: Story = {
  render: (args) => {
    function ControlledCheckbox() {
      const [checked, setChecked] = useState(args.checked ?? false);
      return (
        <Checkbox
          {...args}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }
    return <ControlledCheckbox key={String(args.checked)} />;
  },
};

export const SelectionStates: Story = {
  name: 'Selection states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox {...args} label="Unchecked" />
      <Checkbox {...args} label="Checked" defaultChecked />
      <Checkbox {...args} label="Indeterminate" indeterminate />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The three real Selection values. Indeterminate is set via the `indeterminate` ' +
          'prop, synchronized onto the underlying DOM property — it is never a separate ' +
          'user-choosable value, only ever derived from group-selection state.',
      },
    },
  },
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox {...args} label="Default" />
      <Checkbox {...args} label="Hover (hover over the checkbox to see it)" />
      <Checkbox {...args} label="Focus-visible (tab to the checkbox to see it)" />
      <Checkbox {...args} label="Disabled" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          'stories — hover or tab to the checkboxes above to see them.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Checkbox {...args} label="Disabled, unchecked" disabled />
      <Checkbox {...args} label="Disabled, checked" disabled defaultChecked />
      <Checkbox {...args} label="Disabled, indeterminate" disabled indeterminate />
    </div>
  ),
};

// A realistic "select all" pattern: the parent's `indeterminate` prop is derived from
// child state on every render, exercising the ref-effect sync (indeterminate updates
// correctly as the prop changes, not just on first mount) the same way a real
// group-selection UI would drive it.
export const Indeterminate: Story = {
  render: () => {
    function SelectAllDemo() {
      const [children, setChildren] = useState([false, false, false]);
      const checkedCount = children.filter(Boolean).length;
      const allChecked = checkedCount === children.length;
      const someChecked = checkedCount > 0 && !allChecked;

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Checkbox
            label="Select all"
            checked={allChecked}
            indeterminate={someChecked}
            onChange={(event) => setChildren(children.map(() => event.target.checked))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 32 }}>
            {children.map((checked, index) => (
              <Checkbox
                key={index}
                label={`Item ${index + 1}`}
                checked={checked}
                onChange={(event) =>
                  setChildren(children.map((c, i) => (i === index ? event.target.checked : c)))
                }
              />
            ))}
          </div>
        </div>
      );
    }
    return <SelectAllDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          '"Select all" checks/unchecks every item; the parent becomes indeterminate ' +
          'whenever some but not all items are checked, and updates live as items are ' +
          'toggled — exercising the `useEffect` that syncs `indeterminate` onto the DOM ' +
          'node on every prop change, not just on mount.',
      },
    },
  },
};

export const WithLabel: Story = {
  name: 'With label',
  render: (args) => <Checkbox {...args} label="I agree to the terms" />,
};

export const LongLabelWrapping: Story = {
  name: 'Long label / wrapping',
  render: (args) => (
    <div style={{ width: 240 }}>
      <Checkbox
        {...args}
        label="This is a much longer checkbox label that should wrap across multiple lines when constrained to a narrow width"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The checkbox stays aligned to the label\'s first line rather than centering ' +
          'against the full wrapped block — the row uses `align-items: flex-start`, ' +
          'matching the approved Figma alignment rule exactly.',
      },
    },
  },
};

export const WithoutLabel: Story = {
  name: 'Without label',
  render: (args) => <Checkbox {...args} label={undefined} aria-label="Select row" />,
  parameters: {
    docs: {
      description: {
        story:
          'When `label` is omitted, the checkbox still needs an accessible name — pass ' +
          '`aria-label` or `aria-labelledby` directly; both pass through natively. ' +
          'Omitting both would ship a checkbox with no accessible name and should not ' +
          'be done.',
      },
    },
  },
};

export const FocusVisible: Story = {
  name: 'Focus-visible',
  render: (args) => <Checkbox {...args} label="Tab to this checkbox" />,
  parameters: {
    docs: {
      description: {
        story:
          'Tab to the checkbox above to see the focus-visible ring (no `autoFocus` — ' +
          'jsx-a11y flags it, and it would steal focus on story load). Space toggles the ' +
          'checkbox once focused, same as a native checkbox anywhere else.',
      },
    },
  },
};
