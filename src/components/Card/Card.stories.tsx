import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './Card';
import type { CardVariant, CardPadding } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'Card V1 — generic surface for grouping content. No compound sub-parts ' +
          '(Header/Body/Footer); compose freely inside `children`. No interaction ' +
          'semantics of its own — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['outlined', 'elevated'],
    },
    padding: {
      control: 'select',
      options: ['none', 'md', 'lg'],
    },
  },
  args: {
    variant: 'outlined',
    padding: 'lg',
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

// Demo content only — Card itself has no title/body slots (it's a plain container, see
// Card.tsx). These inline styles reference the exact same generated token custom
// properties Figma's Card mockup is bound to (text.heading.sm.semibold for the title —
// literally documented as "Card/dialog title" — and text.body.sm.regular for the
// description), so this story stays a trustworthy visual reference rather than an
// approximation with hardcoded px/hex values.
const DEMO_CONTENT = (
  <>
    <h3
      style={{
        margin: 0,
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--text-heading-sm-semibold-font-family)',
        fontSize: 'var(--text-heading-sm-semibold-font-size)',
        fontWeight: 'var(--text-heading-sm-semibold-font-weight)',
        lineHeight: 'var(--text-heading-sm-semibold-line-height)',
        letterSpacing: 'var(--text-heading-sm-semibold-letter-spacing)',
      }}
    >
      Card title
    </h3>
    <p
      style={{
        margin: 'var(--space-stack-sm) 0 0',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--text-body-sm-regular-font-family)',
        fontSize: 'var(--text-body-sm-regular-font-size)',
        fontWeight: 'var(--text-body-sm-regular-font-weight)',
        lineHeight: 'var(--text-body-sm-regular-line-height)',
        letterSpacing: 'var(--text-body-sm-regular-letter-spacing)',
      }}
    >
      Supporting content goes here, composed freely by the consumer.
    </p>
  </>
);

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <Card {...args}>{DEMO_CONTENT}</Card>
    </div>
  ),
};

const ALL_VARIANTS: CardVariant[] = ['outlined', 'elevated'];
const ALL_PADDINGS: CardPadding[] = ['none', 'md', 'lg'];

export const VariantAndPadding: Story = {
  name: 'Variant × Padding',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {ALL_VARIANTS.map((variant) => (
        <div key={variant} style={{ display: 'flex', gap: 16 }}>
          {ALL_PADDINGS.map((padding) => (
            <Card key={padding} variant={variant} padding={padding} style={{ width: 240 }}>
              {DEMO_CONTENT}
            </Card>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const EdgeToEdgeContent: Story = {
  name: 'Edge-to-edge content (padding=none)',
  render: (args) => (
    <div style={{ width: 280 }}>
      <Card {...args} padding="none">
        <div
          style={{
            height: 140,
            background: 'linear-gradient(135deg, #93c5fd, #3b82f6)',
            borderRadius: 'inherit',
          }}
        />
        <div style={{ padding: 16 }}>{DEMO_CONTENT}</div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`padding="none"` covers the common case of a card wrapping edge-to-edge ' +
          'content (e.g. an image) — the consumer adds their own padding around the ' +
          'text content inside.',
      },
    },
  },
};

export const AsClickableCard: Story = {
  name: 'Composed as clickable (consumer responsibility)',
  render: (args) => (
    <button
      type="button"
      style={{ all: 'unset', cursor: 'pointer', display: 'block', width: 320 }}
      onClick={() => alert('Card clicked')}
    >
      <Card {...args}>{DEMO_CONTENT}</Card>
    </button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Card has no built-in interaction semantics or click prop — a consumer wanting ' +
          'a clickable card composes their own `<button>`/`<a>` around it, as shown here.',
      },
    },
  },
};
