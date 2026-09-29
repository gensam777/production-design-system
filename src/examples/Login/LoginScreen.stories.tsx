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
          'Login screen for the approved product flow — DS components (Input, ' +
          'PasswordInput, Checkbox, Link, Button, Alert) inside the Centered card layout ' +
          'template. The error state is the same component with an `error` message passed ' +
          'in, not a separate screen. Example composition, not a DS component.',
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
          'The approved "Login · Error state" screen — a form-level danger `Alert` ' +
          '(`role="alert"`) only. No field is marked invalid: an authentication failure ' +
          'must not imply which credential was wrong (see docs/patterns/form-validation.md).',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
