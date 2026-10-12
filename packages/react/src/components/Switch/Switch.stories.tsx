import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    docs: {
      description: {
        component:
          'Switch V1 — native `<input type="checkbox" role="switch">` (the established ' +
          'WAI-ARIA switch pattern, not a custom widget), one fixed visual size (36×20 ' +
          'track, 16×16 thumb, 40×24 minimum interaction target), closest reference ' +
          'components Checkbox and Radio. Hover, Focus-visible, and Disabled are native ' +
          'CSS states, not React props. Use Switch only for settings that take effect ' +
          'immediately, with no separate form-submit step — see ' +
          '`docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    label: 'Label',
    disabled: false,
  },
};
export default meta;

type Story = StoryObj<typeof Switch>;

// Remounts on every `checked` control change (via `key`) so the Playground stays a real,
// clickable, warning-free controlled switch instead of a static one that ignores clicks —
// same pattern as Checkbox's/Radio's own Playground stories.
export const Playground: Story = {
  render: (args) => {
    function ControlledSwitch() {
      const [checked, setChecked] = useState(args.checked ?? false);
      return (
        <Switch
          {...args}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }
    return <ControlledSwitch key={String(args.checked)} />;
  },
};

export const States: Story = {
  name: 'Off / On',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch {...args} label="Off" />
      <Switch {...args} label="On" defaultChecked />
    </div>
  ),
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch {...args} label="Default" />
      <Switch {...args} label="Hover (hover over the switch to see it)" />
      <Switch {...args} label="Focus-visible (tab to the switch to see it)" />
      <Switch {...args} label="Disabled" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          'stories — hover or tab to the switches above to see them.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch {...args} label="Disabled, off" disabled />
      <Switch {...args} label="Disabled, on" disabled defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled Off and Disabled On deliberately render with the same muted gray ' +
          'track (see docs/design-to-code-mappings.md) — the thumb position remains the ' +
          'only visual cue distinguishing the two.',
      },
    },
  },
};

export const WithLabel: Story = {
  name: 'With label',
  render: (args) => <Switch {...args} label="Enable notifications" />,
};

export const WithoutLabel: Story = {
  name: 'Without label',
  render: (args) => <Switch {...args} label={undefined} aria-label="Enable notifications" />,
  parameters: {
    docs: {
      description: {
        story:
          'When `label` is omitted, the switch still needs an accessible name — pass ' +
          '`aria-label` or `aria-labelledby` directly; both pass through natively. ' +
          'Omitting both would ship a switch with no accessible name and should not be ' +
          'done.',
      },
    },
  },
};

export const FocusVisible: Story = {
  name: 'Focus-visible',
  render: (args) => <Switch {...args} label="Tab to this switch" />,
  parameters: {
    docs: {
      description: {
        story:
          'Tab to the switch above to see the focus-visible ring (no `autoFocus` — ' +
          'jsx-a11y flags it, and it would steal focus on story load). Space toggles the ' +
          'switch once focused, same as a native checkbox anywhere else.',
      },
    },
  },
};
