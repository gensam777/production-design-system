import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from './Alert';
import type { AlertStatus } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    docs: {
      description: {
        component:
          'Alert V1 — static, content-flow status banner (not a toast/snackbar). The ' +
          'status icon is internally owned per `status`, never a prop. Subtle emphasis ' +
          'only; no action slot. No default ARIA live-region role — a consumer ' +
          'dynamically injecting an Alert should pass `role` themselves. See ' +
          '`docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    title: { control: 'text' },
    children: { control: 'text' },
    dismissible: { control: 'boolean' },
  },
  args: {
    status: 'info',
    title: 'Title',
    children: 'Description text explaining the alert in more detail.',
    dismissible: false,
  },
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 480 }}>
      <Alert {...args} />
    </div>
  ),
};

const ALL_STATUSES: AlertStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export const AllStatuses: Story = {
  name: 'All statuses',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 480 }}>
      {ALL_STATUSES.map((status) => (
        <Alert key={status} {...args} status={status} title={status} />
      ))}
    </div>
  ),
};

export const WithoutTitle: Story = {
  name: 'Without title',
  render: (args) => (
    <div style={{ width: 480 }}>
      <Alert {...args} title={undefined} />
    </div>
  ),
};

// Remounts on every `dismissible`/`status` change so the Playground stays a real,
// dismissible alert instead of a static one that ignores the button — same pattern
// Checkbox's Playground uses for a controlled prop.
export const Dismissible: Story = {
  render: (args) => {
    function DismissibleDemo() {
      const [visible, setVisible] = useState(true);
      if (!visible) {
        return <button type="button" onClick={() => setVisible(true)}>Show alert again</button>;
      }
      return (
        <Alert {...args} dismissible onDismiss={() => setVisible(false)} />
      );
    }
    return (
      <div style={{ width: 480 }}>
        <DismissibleDemo key={String(args.status)} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Alert holds no open/closed state itself — the consumer removes it from the ' +
          'tree in `onDismiss`, exactly as shown here.',
      },
    },
  },
};

export const LongDescription: Story = {
  name: 'Long description / wrapping',
  render: (args) => (
    <div style={{ width: 360 }}>
      <Alert
        {...args}
        title="Heads up"
        children="This is a much longer description that should wrap across multiple lines when the Alert is constrained to a narrower width, to confirm the icon stays top-aligned rather than centering against the full wrapped block."
      />
    </div>
  ),
};

export const DynamicallyInjected: Story = {
  name: 'Dynamically injected (role example)',
  render: (args) => (
    <div style={{ width: 480 }}>
      <Alert {...args} role="status" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Alert applies no ARIA role by default. A consumer that dynamically inserts an ' +
          'Alert after a user action (e.g. a form submission) should pass `role="status"` ' +
          '(or `"alert"` for urgent, interrupting messages) directly — it passes through ' +
          'natively, as shown here.',
      },
    },
  },
};
