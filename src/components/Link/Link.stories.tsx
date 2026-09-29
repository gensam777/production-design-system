import type { Meta, StoryObj } from '@storybook/react-vite';

import { Link } from './Link';

const meta: Meta<typeof Link> = {
  title: 'Components/Link',
  component: Link,
  parameters: {
    docs: {
      description: {
        component:
          'Link V1 — navigation only: a real `<a href>` (href required), one visual style ' +
          '(no variants), no router dependency. Hover and Focus-visible are native CSS ' +
          'states, not props. Use Button for actions; there is no disabled Link. Native ' +
          'anchor attributes and the ref pass through — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    href: { control: 'text' },
    children: { control: 'text' },
    target: { control: 'select', options: [undefined, '_self', '_blank'] },
  },
  args: {
    // Fragment hrefs keep the Storybook canvas on the same page when clicked.
    href: '#destination',
    children: 'Forgot password?',
  },
};
export default meta;

type Story = StoryObj<typeof Link>;

export const Playground: Story = {};

export const InteractionStates: Story = {
  name: 'Interaction states',
  parameters: {
    docs: {
      description: {
        story:
          'Default at rest. Hover (text.link-hover + underline) and Focus-visible (double ' +
          'focus ring) are native CSS states — hover with a pointer or Tab to each link to ' +
          'exercise them; they cannot be forced by a prop.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', gap: 32 }}>
      <Link href="#one">Forgot password?</Link>
      <Link href="#two">View all activity</Link>
      <Link href="#three">Settings</Link>
    </div>
  ),
};

export const InContext: Story = {
  name: 'In context (audit usages)',
  parameters: {
    docs: {
      description: {
        story:
          'Where the Pattern Audit found navigation built from Buttons or plain text. Product ' +
          'examples are not migrated yet. "Back to dashboard" is intentionally absent: it is ' +
          'designed as a primary CTA and Link never imitates a Button.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 400 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Remember me</span>
        <Link href="#forgot-password">Forgot password?</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Recent activity</strong>
        {/* Visible "View all" + a fuller accessible name, so it makes sense out of context. */}
        <Link href="#activity" aria-label="View all activity">
          View all
        </Link>
      </div>
      <nav aria-label="Main" style={{ display: 'flex', gap: 16 }}>
        <Link href="#dashboard" aria-current="page">
          Dashboard
        </Link>
        <Link href="#settings">Settings</Link>
      </nav>
    </div>
  ),
};

export const ExternalLink: Story = {
  name: 'External (target / rel pass-through)',
  args: {
    href: 'https://www.w3.org/WAI/WCAG22/quickref/',
    target: '_blank',
    rel: 'noopener noreferrer',
    children: 'WCAG 2.2 quick reference (opens in a new tab)',
  },
};

export const LongTextWrapping: Story = {
  name: 'Long text wrapping',
  render: () => (
    <div style={{ width: 200 }}>
      <Link href="#long">A long navigation link label that wraps onto more than one line</Link>
    </div>
  ),
};
