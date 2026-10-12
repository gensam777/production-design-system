import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio } from './Radio';

const meta: Meta<typeof Radio> = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    docs: {
      description: {
        component:
          'Radio V1 — native `<input type="radio">`, one fixed visual size (16×16 ' +
          'circle, 24×24 minimum interaction target), closest reference Checkbox. Hover, ' +
          'Focus-visible, and Disabled are native CSS states, not React props. Radio has ' +
          'no group concept of its own — give sibling Radios the same native `name` for ' +
          'mutual exclusivity (see the `Grouped` story), or use `RadioGroup` for a ' +
          'labeled `<fieldset>`/`<legend>` wrapper — see `docs/design-to-code-mappings.md`.',
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

type Story = StoryObj<typeof Radio>;

// Remounts on every `checked` control change (via `key`) so the Playground stays a real,
// clickable, warning-free controlled radio instead of a static one that ignores clicks —
// same pattern as Checkbox's Playground story.
export const Playground: Story = {
  render: (args) => {
    function ControlledRadio() {
      const [checked, setChecked] = useState(args.checked ?? false);
      return (
        <Radio
          {...args}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
      );
    }
    return <ControlledRadio key={String(args.checked)} />;
  },
};

export const SelectionStates: Story = {
  name: 'Selection states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Radio {...args} label="Unselected" />
      <Radio {...args} label="Selected" defaultChecked />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The two real Selected values. Unlike Checkbox, there is no Indeterminate — a ' +
          'radio has no partial-selection concept.',
      },
    },
  },
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Radio {...args} label="Default" />
      <Radio {...args} label="Hover (hover over the radio to see it)" />
      <Radio {...args} label="Focus-visible (tab to the radio to see it)" />
      <Radio {...args} label="Disabled" disabled />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          'stories — hover or tab to the radios above to see them.',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Radio {...args} label="Disabled, unselected" disabled />
      <Radio {...args} label="Disabled, selected" disabled defaultChecked />
    </div>
  ),
};

// Proves the "no group component required for mutual exclusivity" claim — plain sibling
// Radios sharing a native `name`, no RadioGroup involved. RadioGroup.stories.tsx covers
// the labeled/fieldset-wrapped usage.
export const Grouped: Story = {
  render: () => {
    function PlainGroup() {
      const [value, setValue] = useState('a');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Radio
            name="plain-group-demo"
            label="Option A"
            checked={value === 'a'}
            onChange={() => setValue('a')}
          />
          <Radio
            name="plain-group-demo"
            label="Option B"
            checked={value === 'b'}
            onChange={() => setValue('b')}
          />
          <Radio
            name="plain-group-demo"
            label="Option C"
            checked={value === 'c'}
            onChange={() => setValue('c')}
          />
        </div>
      );
    }
    return <PlainGroup />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mutual exclusivity comes from the shared native `name="plain-group-demo"` — ' +
          'exactly like plain HTML radios, no group component involved. Arrow-key ' +
          'navigation between the three radios is native browser behavior once `name` is ' +
          'shared, with no extra keydown handling in this story.',
      },
    },
  },
};

export const WithLabel: Story = {
  name: 'With label',
  render: (args) => <Radio {...args} label="I agree to the terms" />,
};

export const LongLabelWrapping: Story = {
  name: 'Long label / wrapping',
  render: (args) => (
    <div style={{ width: 240 }}>
      <Radio
        {...args}
        label="This is a much longer radio label that should wrap across multiple lines when constrained to a narrow width"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Unlike Checkbox, the circle is centered against the whole wrapped label block ' +
          '(`align-items: center`), not pinned to the first line — see the "Optical ' +
          'alignment" note in Radio.css. Revisit if a real product use case needs ' +
          'first-line alignment on wrap.',
      },
    },
  },
};

export const WithoutLabel: Story = {
  name: 'Without label',
  render: (args) => <Radio {...args} label={undefined} aria-label="Select row" />,
  parameters: {
    docs: {
      description: {
        story:
          'When `label` is omitted, the radio still needs an accessible name — pass ' +
          '`aria-label` or `aria-labelledby` directly; both pass through natively. ' +
          'Omitting both would ship a radio with no accessible name and should not be ' +
          'done.',
      },
    },
  },
};

export const FocusVisible: Story = {
  name: 'Focus-visible',
  render: (args) => <Radio {...args} label="Tab to this radio" />,
  parameters: {
    docs: {
      description: {
        story:
          'Tab to the radio above to see the focus-visible ring (no `autoFocus` — ' +
          'jsx-a11y flags it, and it would steal focus on story load). Space selects the ' +
          'radio once focused, same as a native radio anywhere else.',
      },
    },
  },
};
