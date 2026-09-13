import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoginScreen } from './LoginScreen';

const meta: Meta<typeof LoginScreen> = {
  title: 'Examples/Login',
  component: LoginScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Login screen for the approved product flow — composed entirely from existing ' +
          'DS components (Card, Input, Checkbox, Button, Alert). The error state is the ' +
          'same component with an `error` message passed in, not a separate screen — see ' +
          '`docs/design-to-code-mappings.md` is not updated for this (it is an example ' +
          'composition, not a new DS component).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof LoginScreen>;

export const Default: Story = {
  render: (args) => {
    function Interactive() {
      const [error, setError] = useState<string | undefined>(undefined);
      const [loading, setLoading] = useState(false);
      return (
        <LoginScreen
          {...args}
          error={error}
          loading={loading}
          onSubmit={() => {
            setLoading(true);
            window.setTimeout(() => {
              setLoading(false);
              setError('Your email or password is incorrect. Please try again.');
            }, 800);
          }}
        />
      );
    }
    return <Interactive />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Submitting the form simulates a failed login after a short delay (loading ' +
          'state, then the error state below) — a real integration would call an auth ' +
          'API from `onSubmit` instead.',
      },
    },
  },
};

export const ErrorState: Story = {
  name: 'Error state',
  args: {
    error: 'Your email or password is incorrect. Please try again.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'The approved "Login · Error state" screen — a danger `Alert` plus the ' +
          'password `Input`’s own `error`/`errorText` state, matching the Figma frame exactly.',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
