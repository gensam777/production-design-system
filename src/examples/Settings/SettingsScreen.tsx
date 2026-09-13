import { useState } from 'react';
import type { ReactNode } from 'react';

import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Radio } from '../../components/Radio';
import { RadioGroup } from '../../components/RadioGroup';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { AppShell } from '../shared/AppShell';
import './SettingsScreen.css';

export interface SettingsScreenProps {
  userName?: string;
  onNavigateSettings?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

interface FooterActionsProps {
  onSave?: () => void;
  onCancel?: () => void;
}

/** Local, non-exported helper — shared by the Profile and Notifications panels below to
 * avoid repeating the same two buttons. Not a new DS component. */
function FooterActions({ onSave, onCancel }: FooterActionsProps) {
  return (
    <div className="ds-example-settings__footer-actions">
      <Button variant="tertiary" size="md" onClick={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" size="md" onClick={onSave}>
        Save changes
      </Button>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="ds-example-settings__section-heading">{children}</h2>;
}

/**
 * Settings screen — composed from Card, Input, Textarea, Select, Switch, RadioGroup/
 * Radio, Button, Alert, and the real interactive Tabs compound component, plus the
 * shared AppShell. Matches the approved Figma "03 — Settings" frame's content and
 * copy; the tab split below is a faithful-but-improved translation documented in the
 * implementation report — Figma's static mock could only show one panel state, so all
 * approved content lived visually under "Profile". Here all three tabs are genuinely
 * interactive, so Notifications gets its own real panel and Security gets an honest
 * placeholder rather than a dead tab. Plan is kept under Profile, matching what was
 * approved.
 */
export function SettingsScreen({ userName, onNavigateSettings, onSave, onCancel }: SettingsScreenProps) {
  const [firstName, setFirstName] = useState('Jordan');
  const [lastName, setLastName] = useState('Lee');
  const [email, setEmail] = useState('jordan@example.com');
  const [bio, setBio] = useState('Product designer focused on developer tools. Based in Austin, TX.');
  const [timezone, setTimezone] = useState('america-chicago');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [plan, setPlan] = useState('free');

  return (
    <AppShell userName={userName} onNavigateSettings={onNavigateSettings}>
      <div className="ds-example-settings__heading">
        <h1>Settings</h1>
        <p>Manage your profile, notifications, and plan.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabList>
          <Tab value="profile">Profile</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="security">Security</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="profile">
            <Card variant="outlined" padding="lg" className="ds-example-settings__panel-card">
              <SectionHeading>Profile information</SectionHeading>
              <div className="ds-example-settings__name-row">
                <Input
                  label="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <Input
                type="email"
                label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <Textarea
                label="Bio"
                helperText="Shown on your public profile."
                value={bio}
                onChange={(event) => setBio(event.target.value)}
              />
              <Select
                label="Timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                <option value="america-los_angeles">Pacific Time (US &amp; Canada)</option>
                <option value="america-chicago">Central Time (US &amp; Canada)</option>
                <option value="america-new_york">Eastern Time (US &amp; Canada)</option>
              </Select>

              <hr className="ds-example-settings__divider" />

              <SectionHeading>Plan</SectionHeading>
              <RadioGroup
                legend="Plan"
                helperText="Changes apply at the start of your next billing cycle."
              >
                <Radio
                  name="plan"
                  value="free"
                  label="Free — $0/month"
                  checked={plan === 'free'}
                  onChange={() => setPlan('free')}
                />
                <Radio
                  name="plan"
                  value="pro"
                  label="Pro — $18/month"
                  checked={plan === 'pro'}
                  onChange={() => setPlan('pro')}
                />
                <Radio
                  name="plan"
                  value="enterprise"
                  label="Enterprise — Custom pricing"
                  checked={plan === 'enterprise'}
                  onChange={() => setPlan('enterprise')}
                />
              </RadioGroup>

              <FooterActions onSave={onSave} onCancel={onCancel} />
            </Card>
          </TabPanel>

          <TabPanel value="notifications">
            <Card variant="outlined" padding="lg" className="ds-example-settings__panel-card">
              <SectionHeading>Notification preferences</SectionHeading>
              <div className="ds-example-settings__switch-list">
                <Switch
                  label="Email notifications for comments and mentions"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                />
                <Switch
                  label="Product updates and announcements"
                  checked={productUpdates}
                  onChange={(event) => setProductUpdates(event.target.checked)}
                />
              </div>
              <FooterActions onSave={onSave} onCancel={onCancel} />
            </Card>
          </TabPanel>

          <TabPanel value="security">
            <Card variant="outlined" padding="lg" className="ds-example-settings__panel-card">
              <Alert status="info" title="Nothing here yet">
                Security settings aren&apos;t part of this release yet.
              </Alert>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </AppShell>
  );
}

SettingsScreen.displayName = 'SettingsScreen';
