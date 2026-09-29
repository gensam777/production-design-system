import type { Meta, StoryObj } from '@storybook/react-vite';

import { CenteredCardLayout } from './CenteredCardLayout';
import { Alert } from '../../components/Alert';
import { ButtonLink } from '../../components/ButtonLink';

const meta: Meta<typeof CenteredCardLayout> = {
  title: 'Patterns/Centered card layout',
  component: CenteredCardLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Template for focused flows outside the app shell (sign-in, confirmation): one ' +
          'outlined Card centered on the canvas, the card title as the page `<h1>`. ' +
          '`narrow` (400px) for short forms, `regular` (440px) for messages. See ' +
          '`docs/patterns/centered-card-layout.md`.',
      },
    },
  },
  argTypes: { width: { control: 'select', options: ['narrow', 'regular'] } },
  args: {
    width: 'regular',
    title: "You're all set",
    description: 'Your workspace is ready to go.',
  },
};
export default meta;

type Story = StoryObj<typeof CenteredCardLayout>;

export const Confirmation: Story = {
  render: (args) => (
    <CenteredCardLayout {...args}>
      <Alert status="success" title="Workspace created">
        You&apos;ll receive a confirmation email shortly.
      </Alert>
      <ButtonLink href="#dashboard" style={{ width: '100%' }}>
        Back to dashboard
      </ButtonLink>
    </CenteredCardLayout>
  ),
};

export const Narrow: Story = {
  args: { width: 'narrow', title: 'Welcome back', description: 'Log in to continue.' },
  render: (args) => (
    <CenteredCardLayout {...args}>
      <p style={{ margin: 0 }}>Short form content goes here (see Examples/Login).</p>
    </CenteredCardLayout>
  ),
};
