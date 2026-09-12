import type { Meta, StoryObj } from '@storybook/react-vite';

import { Accordion } from './Accordion';
import { AccordionItem } from './AccordionItem';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          'Accordion V1 — stacked headers that expand/collapse to reveal content ' +
          'panels. Custom `<button aria-expanded>` + panel composition (WAI-ARIA ' +
          'Accordion Pattern), not native `<details>`. Panels do not get `role="region"` ' +
          'by default — see `docs/design-to-code-mappings.md`.',
      },
    },
  },
  argTypes: {
    allowMultiple: { control: 'boolean' },
  },
  args: {
    allowMultiple: false,
  },
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 400 }}>
      <Accordion {...args}>
        <AccordionItem value="item-1" label="What is this design system?">
          A production-style React design system: design tokens, components, and
          Storybook documentation.
        </AccordionItem>
        <AccordionItem value="item-2" label="Is it accessible?">
          Every component targets WCAG 2.2 AA — see the Accessibility section of each
          component's documentation page.
        </AccordionItem>
        <AccordionItem value="item-3" label="Can I use it in production?">
          Yes, though components are versioned through Alpha → Stable per the component
          lifecycle policy.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const AllowMultiple: Story = {
  name: 'allowMultiple',
  render: () => (
    <div style={{ width: 400 }}>
      <Accordion allowMultiple defaultValue={['item-1']}>
        <AccordionItem value="item-1" label="First item (open by default)">
          Multiple items can stay open at once when `allowMultiple` is true.
        </AccordionItem>
        <AccordionItem value="item-2" label="Second item">
          Opening this doesn't close the first item.
        </AccordionItem>
        <AccordionItem value="item-3" label="Third item">
          Panel content for the third item.
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'With `allowMultiple`, any number of items may be expanded simultaneously — ' +
          'without it (the default), expanding one item closes any other open item.',
      },
    },
  },
};

export const DisabledItem: Story = {
  name: 'Disabled item',
  render: (args) => (
    <div style={{ width: 400 }}>
      <Accordion {...args}>
        <AccordionItem value="item-1" label="Available item">
          This item can be toggled normally.
        </AccordionItem>
        <AccordionItem value="item-2" label="Unavailable item" disabled>
          This content is not reachable while the trigger is disabled.
        </AccordionItem>
      </Accordion>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`disabled` is the native `disabled` attribute on the trigger `<button>` — ' +
          'native Space/Enter activation and focus removal are never reimplemented.',
      },
    },
  },
};

export const LongLabelWrapping: Story = {
  name: 'Long label / wrapping',
  render: (args) => (
    <div style={{ width: 280 }}>
      <Accordion {...args}>
        <AccordionItem
          value="item-1"
          label="A much longer accordion item label that should wrap across multiple lines when constrained to a narrow width"
        >
          Panel content.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const KeyboardAndFocus: Story = {
  name: 'Keyboard and focus',
  render: (args) => (
    <div style={{ width: 400 }}>
      <Accordion {...args}>
        <AccordionItem value="item-1" label="Tab to this trigger, then press Space or Enter">
          Activation uses native button behavior — there is no custom `onKeyDown` on the
          trigger at all.
        </AccordionItem>
        <AccordionItem value="item-2" label="Second trigger">
          Tab/Shift+Tab moves between triggers normally; there is no arrow-key navigation
          between items in V1.
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
