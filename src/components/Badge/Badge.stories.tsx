import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from './Badge';
import type { BadgeStatus, BadgeEmphasis } from './Badge';
import { Icon } from '../../icons';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          'Badge V1 — compact, static, non-interactive status/category label. Not ' +
          'dismissible or interactive; see Alert for prominent status messages and a ' +
          'future Tag/Chip for removable labels. First real consumer of ' +
          '`color.feedback.*` — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    emphasis: {
      control: 'select',
      options: ['subtle', 'strong'],
    },
    icon: { control: false },
    children: { control: 'text' },
  },
  args: {
    status: 'neutral',
    emphasis: 'subtle',
    children: 'Label',
  },
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Playground: Story = {};

const ALL_STATUSES: BadgeStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const ALL_EMPHASES: BadgeEmphasis[] = ['subtle', 'strong'];

export const StatusAndEmphasis: Story = {
  name: 'Status × Emphasis',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ALL_EMPHASES.map((emphasis) => (
        <div key={emphasis} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {ALL_STATUSES.map((status) => (
            <Badge key={status} status={status} emphasis={emphasis}>
              {status}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With icon',
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Badge {...args} status="success" icon={<Icon name="check" size="sm" />}>
        Complete
      </Badge>
      <Badge {...args} status="danger" icon={<Icon name="warning" size="sm" />}>
        Failed
      </Badge>
    </div>
  ),
};

export const InContext: Story = {
  name: 'In context',
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'sans-serif' }}>
      <span>Deployment status:</span>
      <Badge status="success">Live</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Badge has no role by default — it reads as part of normal document flow, ' +
          'next to whatever text it labels.',
      },
    },
  },
};
