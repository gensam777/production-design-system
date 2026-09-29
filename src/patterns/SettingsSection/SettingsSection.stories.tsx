import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FieldRow, SettingsSection } from './SettingsSection';
import { Input } from '../../components/Input';
import { Radio } from '../../components/Radio';
import { RadioGroup } from '../../components/RadioGroup';

const meta: Meta<typeof SettingsSection> = {
  title: 'Patterns/Settings section',
  component: SettingsSection,
  parameters: {
    docs: {
      description: {
        component:
          'One settings domain = one `<form>` (named by its `<h2>`) = one save scope, with ' +
          'its own Cancel/Save action group. Fields stack with `space.stack.lg`; `FieldRow` ' +
          'pairs related fields side by side from 30rem of container width. See ' +
          '`docs/patterns/settings-section.md`.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SettingsSection>;

export const ProfileForm: Story = {
  name: 'Form layout (profile)',
  render: function ProfileFormStory() {
    const saved = { first: 'Jordan', last: 'Lee', email: 'jordan@example.com' };
    const [draft, setDraft] = useState(saved);
    const [status, setStatus] = useState('No changes submitted');
    return (
      <>
        <SettingsSection
          title="Profile information"
          onSubmit={() => setStatus(`Saved ${draft.first} ${draft.last}`)}
          onCancel={() => setDraft(saved)}
        >
          <FieldRow>
            <Input
              label="First name"
              value={draft.first}
              onChange={(e) => setDraft({ ...draft, first: e.target.value })}
            />
            <Input
              label="Last name"
              value={draft.last}
              onChange={(e) => setDraft({ ...draft, last: e.target.value })}
            />
          </FieldRow>
          <Input
            type="email"
            label="Email address"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
          />
        </SettingsSection>
        <output style={{ display: 'block', marginTop: 12 }}>{status}</output>
      </>
    );
  },
};

export const SingleFieldset: Story = {
  name: 'Single fieldset (heading ≠ legend)',
  parameters: {
    docs: {
      description: {
        story:
          'The section heading names the domain ("Plan"); the fieldset legend names the ' +
          'specific choice ("Choose a plan"). Never repeat the same text as heading and legend.',
      },
    },
  },
  render: () => (
    <SettingsSection title="Plan">
      <RadioGroup legend="Choose a plan" helperText="Changes apply at the next billing cycle.">
        <Radio name="plan-story" value="free" label="Free — $0/month" defaultChecked />
        <Radio name="plan-story" value="pro" label="Pro — $18/month" />
      </RadioGroup>
    </SettingsSection>
  ),
};

export const Saving: Story = {
  render: () => (
    <SettingsSection title="Notification preferences" saving>
      <p style={{ margin: 0 }}>Save shows Button&apos;s loading state while this section saves.</p>
    </SettingsSection>
  ),
};
