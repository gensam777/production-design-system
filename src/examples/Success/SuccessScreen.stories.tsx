import type { Meta, StoryObj } from '@storybook/react-vite';

import { SuccessScreen } from './SuccessScreen';

const meta: Meta<typeof SuccessScreen> = {
  title: 'Examples/Success',
  component: SuccessScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Success / confirmation screen — composed from Card, Alert, and Button. ' +
          'Matches the approved Figma "04 — Success" frame.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SuccessScreen>;

export const Default: Story = {};
