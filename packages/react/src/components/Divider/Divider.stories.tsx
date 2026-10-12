import type { Meta, StoryObj } from '@storybook/react-vite';

import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Components/Divider',
  component: Divider,
  parameters: {
    docs: {
      description: {
        component:
          'Divider V1 — 1px horizontal rule (`border.subtle`), fills its container, owns no ' +
          'margin (the parent gap controls spacing). Default renders a native `<hr>` ' +
          '(announced as a separator); `decorative` adds `aria-hidden` for visual rhythm ' +
          'inside already-structured content. Horizontal only — see ' +
          '`docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    decorative: { control: 'boolean' },
  },
  args: {
    decorative: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Divider>;

export const Playground: Story = {};

export const BetweenSections: Story = {
  name: 'Between sections (semantic <hr>)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <strong>Profile information</strong>
      <span>Name, email and bio fields…</span>
      <Divider />
      <strong>Notification preferences</strong>
      <span>Email and product update switches…</span>
    </div>
  ),
};

export const BetweenListRows: Story = {
  name: 'Between list rows (decorative)',
  parameters: {
    docs: {
      description: {
        story:
          'The list already conveys its structure to assistive technology, so the dividers ' +
          'are `decorative` (hidden). They sit between `<li>`s as presentational children ' +
          'of each item, not as direct children of the `<ul>`.',
      },
    },
  },
  render: () => {
    const rows = [
      'Priya Shah invited Alex Kim',
      'Sprint 14 board was updated',
      'Payment method updated',
    ];
    return (
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {rows.map((row, index) => (
          <li key={row} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {index > 0 && <Divider decorative />}
            {row}
          </li>
        ))}
      </ul>
    );
  },
};

export const InsideCenteredFlex: Story = {
  name: 'Full width inside a centered flex column',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span>Centered content</span>
      <Divider />
      <span>Still full width</span>
    </div>
  ),
};
