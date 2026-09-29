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
          'Success / confirmation screen — Alert and ButtonLink inside the Centered card ' +
          'layout template. "Back to dashboard" is navigation, so it is a ButtonLink ' +
          '(`<a href>`) with the approved primary-button design. Matches the approved Figma ' +
          '"04 — Success" frame.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof SuccessScreen>;

export const Default: Story = {};
