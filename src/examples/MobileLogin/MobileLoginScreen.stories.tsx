import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MobileLoginScreen } from './MobileLoginScreen';

const meta: Meta<typeof MobileLoginScreen> = {
  title: 'Examples/Mobile Login',
  component: MobileLoginScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Mobile app login screen — Input, PasswordInput, Link and Button on a plain ' +
          'surface (no card). A separate app example, not the responsive form of ' +
          '`Examples/Login`. Fluid to the device viewport, with no desktop cap: view it in ' +
          'the "Reference (393px)" story or narrow the canvas. Matches the Figma "Login" ' +
          'frame (1119:740); the status bar and home indicator there are OS chrome. ' +
          'Example composition, not a DS component.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof MobileLoginScreen>;

export const Default: Story = {
  render: (args) => {
    function Interactive() {
      const [loading, setLoading] = useState(false);
      return (
        <MobileLoginScreen
          {...args}
          loading={loading}
          onSubmit={() => {
            setLoading(true);
            window.setTimeout(() => setLoading(false), 800);
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
          'Submitting shows the loading state for a moment — a real app would call its ' +
          'auth API from `onSubmit`.',
      },
    },
  },
};

export const Reference393: Story = {
  name: 'Reference (393px)',
  render: (_args, { globals }) => {
    // A nested <iframe> has its own viewport, so `100dvh` and the fluid width resolve
    // against a real 393×852 device-sized viewport (the Figma frame), not the Storybook
    // canvas. The active brand is forwarded because the nested document has its own
    // globals.
    const src = `${window.location.pathname}?id=examples-mobile-login--default&viewMode=story&globals=brand:${globals.brand ?? 'brand-a'}`;
    return (
      <iframe
        title="Mobile Login at the 393 × 852 reference viewport"
        src={src}
        style={{ width: 393, height: 852, border: '1px solid #d0d5dd' }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same screen inside a real 393 × 852 viewport — the Figma reference device ' +
          'size (OS status bar and home indicator excluded).',
      },
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
