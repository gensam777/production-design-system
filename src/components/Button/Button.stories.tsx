import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './Button';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button';
import { Icon } from '../../icons';
import type { IconName } from '../../icons';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Button V1 — native `<button>`, provider-neutral icon slots (`leadingIcon`/' +
          '`trailingIcon` accept any `ReactNode`), spinner-only loading state. Hover, ' +
          'Pressed, and Focus-visible are native CSS states, not React props — see ' +
          '`docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
    // Native button `type`. Left to docgen autodetection this resolves to a generic
    // `string`/object-ish control (same failure class as the icon slots) rather than the
    // fixed 3-value set the HTML attribute actually allows — pin it to a select instead.
    type: {
      control: 'select',
      options: ['button', 'submit', 'reset'],
    },
    // leadingIcon/trailingIcon are React.ReactNode — Storybook's docgen-based autodetect
    // falls back to an object control for these, and an edited object control produces a
    // plain `{}`, which Button then tries to render as a child ("Objects are not valid
    // as a React child"). No sensible generic control exists for "any ReactNode," so the
    // control is disabled here; real icon usage is demonstrated in the "With icons" and
    // "Loading" stories below, and Playground gets its own Storybook-only select args
    // (see leadingIconName/trailingIconName) instead of editing these directly.
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    children: 'Button',
    type: 'button',
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// Storybook-only args for the Playground below — a `'none'` + IconName-subset select per
// slot, letting you pick an actual approved icon per slot without an object control, but
// never a Button prop. `PlaygroundProps` is only a props shape for this story's own
// typing (StoryObj accepts either a component or a props shape); it doesn't change or
// extend ButtonProps/Button itself.
const LEADING_ICON_NAMES = [
  'none',
  'plus',
  'search',
  'check',
  'arrow-left',
  'arrow-right',
  'trash',
  'edit',
  'settings',
] as const;
const TRAILING_ICON_NAMES = [
  'none',
  'plus',
  'search',
  'check',
  'arrow-left',
  'arrow-right',
  'chevron-down',
  'chevron-up',
] as const;

type LeadingIconOption = (typeof LEADING_ICON_NAMES)[number];
type TrailingIconOption = (typeof TRAILING_ICON_NAMES)[number];

interface PlaygroundProps extends ButtonProps {
  leadingIconName?: LeadingIconOption;
  trailingIconName?: TrailingIconOption;
}

export const Playground: StoryObj<PlaygroundProps> = {
  args: {
    leadingIconName: 'none',
    trailingIconName: 'none',
  },
  argTypes: {
    leadingIconName: {
      control: 'select',
      options: LEADING_ICON_NAMES,
      name: 'leadingIconName (Storybook only)',
      description:
        'Storybook-only — not a Button prop. `\'none\'` omits the slot; otherwise renders ' +
        '`<Icon name={leadingIconName} />` as `leadingIcon`.',
    },
    trailingIconName: {
      control: 'select',
      options: TRAILING_ICON_NAMES,
      name: 'trailingIconName (Storybook only)',
      description:
        'Storybook-only — not a Button prop. `\'none\'` omits the slot; otherwise renders ' +
        '`<Icon name={trailingIconName} />` as `trailingIcon`.',
    },
  },
  render: ({ leadingIconName, trailingIconName, ...buttonArgs }) => {
    const leadingIcon: IconName | undefined =
      leadingIconName && leadingIconName !== 'none' ? leadingIconName : undefined;
    const trailingIcon: IconName | undefined =
      trailingIconName && trailingIconName !== 'none' ? trailingIconName : undefined;

    return (
      <Button
        {...buttonArgs}
        leadingIcon={leadingIcon && <Icon name={leadingIcon} size={buttonArgs.size} />}
        trailingIcon={trailingIcon && <Icon name={trailingIcon} size={buttonArgs.size} />}
      />
    );
  },
};

const ALL_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger'];
const ALL_SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      {ALL_VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant[0].toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {ALL_SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          {size.toUpperCase()}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With icons',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {ALL_SIZES.map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 24, fontSize: 12, color: '#6b7280' }}>{size.toUpperCase()}</span>
          <Button {...args} size={size}>
            No icon
          </Button>
          <Button {...args} size={size} leadingIcon={<Icon name="plus" size={size} />}>
            Leading icon
          </Button>
          <Button {...args} size={size} trailingIcon={<Icon name="arrow-right" size={size} />}>
            Trailing icon
          </Button>
          <Button
            {...args}
            size={size}
            leadingIcon={<Icon name="settings" size={size} />}
            trailingIcon={<Icon name="chevron-down" size={size} />}
          >
            Both icons
          </Button>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The side next to an icon drops one `space.inset.*` step from the base padding ' +
          '(e.g. Md leading-only: 12px start / 16px end, vs. 16px/16px with no icon) — ' +
          'mirrors the approved Figma Button V1 padding refinement. See ' +
          '"Icon-adjacent padding" in `docs/design-to-code-mappings.md` for the full table.',
      },
    },
  },
};

export const Loading: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Button {...args} loading>
        No icon
      </Button>
      <Button {...args} loading leadingIcon={<Icon name="plus" size={args.size} />}>
        Leading icon
      </Button>
      <Button {...args} loading trailingIcon={<Icon name="arrow-right" size={args.size} />}>
        Trailing icon
      </Button>
      <Button
        {...args}
        loading
        leadingIcon={<Icon name="settings" size={args.size} />}
        trailingIcon={<Icon name="chevron-down" size={args.size} />}
      >
        Both icons
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Only the spinner is visible — the original label/icons stay in the layout, ' +
          'just invisible (`opacity: 0`, not removed), so width never shifts and the ' +
          'button keeps its accessible name (`aria-busy="true"`, native `disabled` ' +
          'prevents repeat activation).',
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      {ALL_VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant} disabled>
          {variant[0].toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
};

export const FocusVisible: Story = {
  name: 'Focus-visible',
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      {ALL_VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant[0].toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Tab to a button to see the focus-visible ring (no `autoFocus` — jsx-a11y ' +
          'flags it, and it would steal focus on story load). Secondary keeps its ' +
          'normal 1px border underneath the ring.',
      },
    },
  },
};
