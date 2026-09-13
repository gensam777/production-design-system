import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingsScreen } from './SettingsScreen';

const meta: Meta<typeof SettingsScreen> = {
  title: 'Examples/Settings',
  component: SettingsScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings screen — composed from Card, Input, Textarea, Select, Switch, ' +
          'RadioGroup/Radio, Button, Alert, and the real interactive Tabs compound ' +
          'component, plus the shared AppShell. Click between Profile / Notifications / ' +
          'Security to exercise real tab switching (roving tabindex, automatic ' +
          'activation via arrow keys) — unlike the static Figma mock, every tab here has ' +
          'a real, distinct panel.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SettingsScreen>;

export const Default: Story = {};
