import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip } from './Tooltip';
import type { TooltipPlacement } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Tooltip V1 — floating label shown on hover and keyboard focus of a trigger. ' +
          'Positioning, viewport collision (flip/shift), and `role="tooltip"`/' +
          '`aria-describedby` wiring are handled by Floating UI (`@floating-ui/react`) — ' +
          'see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    content: { control: 'text' },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  args: {
    content: 'Tooltip label',
    placement: 'top',
  },
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Tooltip {...args}>
        <button type="button">Hover or focus me</button>
      </Tooltip>
    </div>
  ),
};

const ALL_PLACEMENTS: TooltipPlacement[] = ['top', 'bottom', 'left', 'right'];

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48, padding: 80 }}>
      {ALL_PLACEMENTS.map((placement) => (
        <Tooltip key={placement} content={`Placement: ${placement}`} placement={placement}>
          <button type="button">{placement}</button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const ViewportCollision: Story = {
  name: 'Viewport collision (flip/shift)',
  render: (args) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
      <Tooltip {...args} content="This flips below since there's no room above">
        <button type="button">Near the top edge</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Floating UI automatically flips/shifts the tooltip away from viewport edges — ' +
          'this trigger is placed near the top of the preview frame with `placement="top"` ' +
          'requested, so it flips to the bottom instead of rendering off-screen.',
      },
    },
  },
};

export const OnDisabledTrigger: Story = {
  name: 'On a disabled trigger',
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Tooltip {...args} content="Disabled — you don't have permission to do this">
        <button type="button" disabled>
          Disabled action
        </button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The reference ref and hover/focus listeners live on a wrapping `<span>`, not ' +
          'on the trigger itself — a disabled native control fires no mouse/focus events ' +
          'of its own, so cloning props onto it directly would silently break the ' +
          'tooltip. This is why Tooltip never clones `children`.',
      },
    },
  },
};

export const LongContent: Story = {
  name: 'Long content / wrapping',
  render: (args) => (
    <div style={{ padding: 80 }}>
      <Tooltip
        {...args}
        content="This is a longer tooltip message that should wrap across multiple lines rather than growing indefinitely wide."
      >
        <button type="button">Hover for a longer tooltip</button>
      </Tooltip>
    </div>
  ),
};
