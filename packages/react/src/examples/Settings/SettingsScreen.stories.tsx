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
          'Settings screen — the App shell, Page header and Settings section patterns with ' +
          'Input, Textarea, Select, Switch, RadioGroup/Radio, Alert and Tabs. Each tab is ' +
          'one settings domain = one `<form>` = one save scope: edit Profile, switch to Plan ' +
          'and press Cancel there — only the Plan draft resets. Save submits only that tab. ' +
          'Matches Figma 03 (Profile), 03b (Notifications) and 03c (Plan).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SettingsScreen>;

export const Default: Story = {};
