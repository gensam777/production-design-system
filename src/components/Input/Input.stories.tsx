import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './Input';
import type { InputProps, InputSize } from './Input';
import { Icon } from '../../icons';
import type { IconName } from '../../icons';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Input V1 — native `<input>`, provider-neutral icon slots (`leadingIcon`/' +
          '`trailingIcon` accept any `ReactNode`), native placeholder/value behavior ' +
          '(no `hasValue`/`content` prop). Hover, Focus-visible are native CSS states, ' +
          'not React props — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    label: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'boolean' },
    errorText: { control: 'text' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
    defaultValue: { control: 'text' },
    // leadingIcon/trailingIcon are React.ReactNode — same reasoning as Button's icon
    // controls: no sensible generic Storybook control exists for "any ReactNode," so
    // direct editing is disabled here. Playground gets its own Storybook-only selects
    // (leadingIconName/trailingIconName) instead — see below.
    leadingIcon: { control: false },
    trailingIcon: { control: false },
  },
  args: {
    size: 'md',
    label: 'Email address',
    helperText: "We'll never share your email.",
    error: false,
    disabled: false,
    placeholder: 'you@example.com',
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

// Storybook-only args for the Playground below — a 'none' + IconName-subset select per
// slot, mirroring Button's Playground pattern exactly. PlaygroundProps is only a props
// shape for this story's own typing; it doesn't change or extend InputProps/Input itself.
const LEADING_ICON_NAMES = ['none', 'search', 'check', 'info', 'warning'] as const;
const TRAILING_ICON_NAMES = ['none', 'close', 'check', 'chevron-down', 'warning'] as const;

type LeadingIconOption = (typeof LEADING_ICON_NAMES)[number];
type TrailingIconOption = (typeof TRAILING_ICON_NAMES)[number];

interface PlaygroundProps extends InputProps {
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
        "Storybook-only — not an Input prop. 'none' omits the slot; otherwise renders " +
        '`<Icon name={leadingIconName} />` as `leadingIcon`.',
    },
    trailingIconName: {
      control: 'select',
      options: TRAILING_ICON_NAMES,
      name: 'trailingIconName (Storybook only)',
      description:
        "Storybook-only — not an Input prop. 'none' omits the slot; otherwise renders " +
        '`<Icon name={trailingIconName} />` as `trailingIcon`.',
    },
  },
  render: ({ leadingIconName, trailingIconName, ...inputArgs }) => {
    const leadingIcon: IconName | undefined =
      leadingIconName && leadingIconName !== 'none' ? leadingIconName : undefined;
    const trailingIcon: IconName | undefined =
      trailingIconName && trailingIconName !== 'none' ? trailingIconName : undefined;

    return (
      <div style={{ width: 320 }}>
        <Input
          {...inputArgs}
          leadingIcon={leadingIcon && <Icon name={leadingIcon} size={inputArgs.size} />}
          trailingIcon={trailingIcon && <Icon name={trailingIcon} size={inputArgs.size} />}
        />
      </div>
    );
  },
};

const ALL_SIZES: InputSize[] = ['sm', 'md', 'lg'];

export const AllSizes: Story = {
  name: 'All sizes',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      {ALL_SIZES.map((size) => (
        <Input key={size} {...args} size={size} label={`Label (${size})`} />
      ))}
    </div>
  ),
};

export const InteractionStates: Story = {
  name: 'Interaction states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Input {...args} label="Default" />
      <Input {...args} label="Hover (hover over the field to see it)" />
      <Input {...args} label="Focus-visible (tab into the field to see it)" />
      <Input {...args} label="Disabled" disabled defaultValue="Can't edit this" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and Focus-visible are native CSS states, not React props or separate ' +
          "stories — hover or tab into the fields above to see them. No `autoFocus` is " +
          'used (jsx-a11y flags it, and it would steal focus on story load).',
      },
    },
  },
};

export const ValidationStates: Story = {
  name: 'Validation states',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Input {...args} label="No error" helperText="Helper text" />
      <Input
        {...args}
        label="Error, with errorText"
        error
        helperText="Helper text"
        errorText="This field is required"
      />
      <Input
        {...args}
        label="Error, no errorText (falls back to helperText)"
        error
        helperText="Helper text still shows"
      />
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With icons',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 320 }}>
      {ALL_SIZES.map((size) => (
        <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{size.toUpperCase()}</span>
          <Input {...args} size={size} label={undefined} placeholder="No icon" />
          <Input
            {...args}
            size={size}
            label={undefined}
            placeholder="Leading icon"
            leadingIcon={<Icon name="search" size={size} />}
          />
          <Input
            {...args}
            size={size}
            label={undefined}
            placeholder="Trailing icon"
            trailingIcon={<Icon name="chevron-down" size={size} />}
          />
          <Input
            {...args}
            size={size}
            label={undefined}
            placeholder="Both icons"
            leadingIcon={<Icon name="search" size={size} />}
            trailingIcon={<Icon name="close" size={size} />}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The side next to an icon drops one `space.inset.*` step from the base padding ' +
          '— mirrors the approved Figma Input Content padding refinement exactly. See ' +
          '"Icon-adjacent padding" in `docs/design-to-code-mappings.md` for the full table.',
      },
    },
  },
};

export const PlaceholderVsValue: Story = {
  name: 'Placeholder vs value',
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Input {...args} label="Placeholder only" placeholder="Enter your email" />
      <Input {...args} label="With a value" defaultValue="sam@example.com" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'No `hasValue`/`content` prop exists — placeholder-vs-value styling comes ' +
          'entirely from native `::placeholder` CSS and the input\'s own `color`, the ' +
          'same way a real browser input already behaves. This is the code equivalent ' +
          "of Figma's Content axis (Placeholder/Value), which stays Figma-only.",
      },
    },
  },
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
      <Input {...args} label="Disabled, placeholder" disabled />
      <Input {...args} label="Disabled, with value" disabled defaultValue="sam@example.com" />
      <Input
        {...args}
        label="Disabled + error (disabled wins visually)"
        disabled
        error
        errorText="This won't show as red — disabled takes precedence"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Disabled + Error renders identically to plain Disabled — disabled container ' +
          'styling always wins visually, matching the approved Figma precedence. ' +
          '`errorText` still renders in the support region if provided; only the ' +
          "container's error-red border is suppressed.",
      },
    },
  },
};

export const ErrorAndFocus: Story = {
  name: 'Error + focus',
  render: (args) => (
    <div style={{ width: 320 }}>
      <Input
        {...args}
        label="Tab into this field"
        error
        errorText="This field has an error"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Tab into the field to see Focus + Error: the error state's red border stays " +
          'visible underneath the focus ring rather than being replaced by it — the same ' +
          "layering technique Button uses to keep Secondary's border visible under its " +
          'own ring. No `autoFocus` is used.',
      },
    },
  },
};
