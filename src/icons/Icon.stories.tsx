import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from './Icon';
import type { IconName, IconSize } from './types';

const meta: Meta<typeof Icon> = {
  title: 'Foundations/Icons',
  component: Icon,
  parameters: {
    docs: {
      description: {
        component:
          'Provider-neutral icon utility. Renders the design system’s default provider ' +
          '(Lucide) behind a stable `name` API — see `docs/foundations/icons.md`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Icon>;

const ALL_ICON_NAMES: IconName[] = [
  'plus',
  'minus',
  'check',
  'close',
  'search',
  'arrow-left',
  'arrow-right',
  'chevron-down',
  'chevron-up',
  'info',
  'warning',
  'trash',
  'edit',
  'settings',
];

const ALL_SIZES: IconSize[] = ['sm', 'md', 'lg'];

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 24, maxWidth: 700 }}>
      {ALL_ICON_NAMES.map((name) => (
        <div
          key={name}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <Icon name={name} size="lg" />
          <span style={{ fontSize: 12, color: '#666' }}>{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
      {ALL_SIZES.map((size) => (
        <div
          key={size}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <Icon name="settings" size={size} />
          <span style={{ fontSize: 12, color: '#666' }}>
            {size} ({size === 'sm' ? 16 : size === 'md' ? 20 : 24}px)
          </span>
        </div>
      ))}
    </div>
  ),
};

export const CurrentColor: Story = {
  name: 'currentColor behavior',
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      {[
        { label: 'inherited (default text color)', color: undefined },
        { label: 'color: crimson', color: 'crimson' },
        { label: 'color: seagreen', color: 'seagreen' },
      ].map(({ label, color }) => (
        <div
          key={label}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color }}
        >
          <Icon name="info" size="lg" />
          <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
        </div>
      ))}
    </div>
  ),
};
