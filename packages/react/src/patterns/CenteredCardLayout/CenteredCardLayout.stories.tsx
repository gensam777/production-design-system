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
          '`regular` (440px) for sign-in and messages, `narrow` (400px) for shorter forms. ' +
          'Content spacing is `space.stack.lg`; `compact` opts into `space.stack.md` ' +
          '(used by Login). See `docs/patterns/centered-card-layout.md`.',
      },
    },
  },
  argTypes: {
    width: { control: 'select', options: ['narrow', 'regular'] },
    compact: { control: 'boolean' },
  },
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

export const Compact: Story = {
  args: {
    compact: true,
    title: 'Welcome back',
    description: 'Log in to your account to continue.',
  },
  parameters: {
    docs: {
      description: {
        story:
          '`compact` tightens card content spacing to `space.stack.md` (12px) — the Figma ' +
          'Login card. Opt-in per screen; the default stays `space.stack.lg`.',
      },
    },
  },
  render: (args) => (
    <CenteredCardLayout {...args}>
      <p style={{ margin: 0 }}>Form content goes here (see Examples/Login).</p>
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
