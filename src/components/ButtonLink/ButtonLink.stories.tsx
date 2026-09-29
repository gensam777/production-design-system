import type { Meta, StoryObj } from '@storybook/react-vite';

import { ButtonLink } from './ButtonLink';
import { Button } from '../Button';
import { Icon } from '../../icons';

const meta: Meta<typeof ButtonLink> = {
  title: 'Components/ButtonLink',
  component: ButtonLink,
  parameters: {
    docs: {
      description: {
        component:
          'ButtonLink V1 — navigation that is designed with button emphasis (e.g. a primary ' +
          '"Back to dashboard" CTA): a real `<a href>` with Button’s exact styling. Use ' +
          'Button for actions and Link for ordinary navigation. No `loading`, `disabled` or ' +
          '`danger` — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tertiary'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    href: { control: 'text' },
    children: { control: 'text' },
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  args: {
    variant: 'primary',
    size: 'md',
    href: '#dashboard',
    children: 'Back to dashboard',
  },
};
export default meta;

type Story = StoryObj<typeof ButtonLink>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ButtonLink {...args} variant="primary">
        Primary
      </ButtonLink>
      <ButtonLink {...args} variant="secondary">
        Secondary
      </ButtonLink>
      <ButtonLink {...args} variant="tertiary">
        Tertiary
      </ButtonLink>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <ButtonLink {...args} size="sm">
        Small
      </ButtonLink>
      <ButtonLink {...args} size="md">
        Medium
      </ButtonLink>
      <ButtonLink {...args} size="lg">
        Large
      </ButtonLink>
    </div>
  ),
};

export const WithIcon: Story = {
  name: 'With icon',
  args: { leadingIcon: <Icon name="arrow-left" />, children: 'Back to dashboard' },
};

export const MatchesButton: Story = {
  name: 'Matches Button visually',
  parameters: {
    docs: {
      description: {
        story:
          'Same pixels, different element: the left is a `<button>` (action), the right an ' +
          '`<a href>` (navigation). Hover and Tab to both — states are identical.',
      },
    },
  },
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button variant="primary">Save changes</Button>
      <ButtonLink href="#dashboard" variant="primary">
        Back to dashboard
      </ButtonLink>
    </div>
  ),
};

export const FullWidth: Story = {
  name: 'Full width (card CTA)',
  render: (args) => (
    <div style={{ width: 400 }}>
      <ButtonLink {...args} style={{ width: '100%' }} />
    </div>
  ),
};
