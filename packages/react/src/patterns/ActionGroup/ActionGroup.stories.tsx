import type { Meta, StoryObj } from '@storybook/react-vite';

import { ActionGroup } from './ActionGroup';
import { Button } from '../../components/Button';

const meta: Meta<typeof ActionGroup> = {
  title: 'Patterns/Action group',
  component: ActionGroup,
  parameters: {
    docs: {
      description: {
        component:
          'End-aligned Buttons, secondary first and primary **last** (DOM order = visual ' +
          'order). Optional decorative Divider above (`separated`) for form footers. Stacks ' +
          'full-width below 24rem of container width. See `docs/patterns/action-group.md`.',
      },
    },
  },
  args: { separated: true },
};
export default meta;

type Story = StoryObj<typeof ActionGroup>;

const actions = (
  <>
    <Button variant="tertiary">Cancel</Button>
    <Button variant="primary">Save changes</Button>
  </>
);

export const FormFooter: Story = {
  name: 'Form footer (separated)',
  render: (args) => (
    <div style={{ width: 560 }}>
      <ActionGroup {...args}>{actions}</ActionGroup>
    </div>
  ),
};

export const NarrowContainer: Story = {
  name: 'Narrow container (stacks)',
  render: (args) => (
    <div style={{ width: 300 }}>
      <ActionGroup {...args}>{actions}</ActionGroup>
    </div>
  ),
};

export const Unseparated: Story = {
  args: { separated: false },
  render: (args) => (
    <div style={{ width: 560 }}>
      <ActionGroup {...args}>
        <Button variant="secondary">Back</Button>
        <Button variant="primary">Continue</Button>
      </ActionGroup>
    </div>
  ),
};
