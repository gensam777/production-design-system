import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageHeader } from './PageHeader';
import { Button } from '../../components/Button';

const meta: Meta<typeof PageHeader> = {
  title: 'Patterns/Page header',
  component: PageHeader,
  parameters: {
    docs: {
      description: {
        component:
          'The page’s single `<h1>` + optional description + optional actions. No outer ' +
          'margin — the App shell container gap spaces it. See `docs/patterns/page-header.md`.',
      },
    },
  },
  args: {
    title: 'Settings',
    description: 'Manage your profile, notifications, and plan.',
  },
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {};

export const TitleOnly: Story = { name: 'Title only', args: { description: undefined } };

export const WithActions: Story = {
  name: 'With actions',
  args: {
    title: 'Projects',
    description: '24 active projects in this workspace.',
    actions: <Button variant="primary">New project</Button>,
  },
};
