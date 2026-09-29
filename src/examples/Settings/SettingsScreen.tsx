import { useState } from 'react';

import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Radio } from '../../components/Radio';
import { RadioGroup } from '../../components/RadioGroup';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { AppShell, FieldRow, PageHeader, SettingsSection } from '../../patterns';
import './SettingsScreen.css';

interface ProfileValues {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  timezone: string;
}
interface NotificationValues {
  emailNotifications: boolean;
  productUpdates: boolean;
}
interface PlanValues {
  plan: 'free' | 'pro' | 'enterprise';
}

export type SettingsDomain = 'profile' | 'notifications' | 'plan';
export type SettingsSaveValues = ProfileValues | NotificationValues | PlanValues;

export interface SettingsScreenProps {
  userName?: string;
  dashboardHref?: string;
  settingsHref?: string;
  /** Called with ONE domain's values when that tab's form is saved. */
  onSave?: (domain: SettingsDomain, values: SettingsSaveValues) => void;
}

const INITIAL_PROFILE: ProfileValues = {
  firstName: 'Jordan',
  lastName: 'Lee',
  email: 'jordan@example.com',
  bio: 'Product designer focused on developer tools. Based in Austin, TX.',
  timezone: 'america-chicago',
};
const INITIAL_NOTIFICATIONS: NotificationValues = {
  emailNotifications: true,
  productUpdates: false,
};
const INITIAL_PLAN: PlanValues = { plan: 'free' };

/**
 * One independent save scope: the last saved values plus an editable draft. Cancel
 * restores the draft from saved; Save commits the draft. Nothing is shared across domains.
 */
function useSettingsDomain<T>(initial: T) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  return {
    draft,
    update: (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch })),
    cancel: () => setDraft(saved),
    commit: () => {
      setSaved(draft);
      return draft;
    },
  };
}

/**
 * Settings screen — Input, Textarea, Select, Switch, RadioGroup/Radio, Alert and the Tabs
 * compound component inside the App shell template, with the Page header and Settings
 * section patterns. Each tab is one settings domain = one `<form>` = one save scope
 * (approved decision), so Profile, Notifications and Plan save independently. Matches the
 * approved Figma "03 — Settings" (Profile), "03b" (Notifications) and "03c" (Plan) frames.
 */
export function SettingsScreen({
  userName = 'Jordan Lee',
  dashboardHref = '#dashboard',
  settingsHref = '#settings',
  onSave,
}: SettingsScreenProps) {
  const profile = useSettingsDomain(INITIAL_PROFILE);
  const notifications = useSettingsDomain(INITIAL_NOTIFICATIONS);
  const plan = useSettingsDomain(INITIAL_PLAN);

  return (
    <AppShell
      navItems={[
        { label: 'Dashboard', href: dashboardHref },
        { label: 'Settings', href: settingsHref, current: true },
      ]}
      secondary={
        <>
          <Badge>Free plan</Badge>
          <span>{userName}</span>
        </>
      }
    >
      <PageHeader title="Settings" description="Manage your profile, notifications, and plan." />

      <Tabs defaultValue="profile">
        <TabList>
          <Tab value="profile">Profile</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="plan">Plan</Tab>
          <Tab value="security">Security</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="profile">
            <SettingsSection
              title="Profile information"
              onSubmit={() => onSave?.('profile', profile.commit())}
              onCancel={profile.cancel}
            >
              <FieldRow>
                <Input
                  label="First name"
                  value={profile.draft.firstName}
                  onChange={(event) => profile.update({ firstName: event.target.value })}
                  autoComplete="given-name"
                />
                <Input
                  label="Last name"
                  value={profile.draft.lastName}
                  onChange={(event) => profile.update({ lastName: event.target.value })}
                  autoComplete="family-name"
                />
              </FieldRow>
              <Input
                type="email"
                label="Email address"
                value={profile.draft.email}
                onChange={(event) => profile.update({ email: event.target.value })}
                autoComplete="email"
              />
              <Textarea
                label="Bio"
                helperText="Shown on your public profile."
                value={profile.draft.bio}
                onChange={(event) => profile.update({ bio: event.target.value })}
              />
              <Select
                label="Timezone"
                value={profile.draft.timezone}
                onChange={(event) => profile.update({ timezone: event.target.value })}
              >
                <option value="america-los_angeles">Pacific Time (US &amp; Canada)</option>
                <option value="america-chicago">Central Time (US &amp; Canada)</option>
                <option value="america-new_york">Eastern Time (US &amp; Canada)</option>
              </Select>
            </SettingsSection>
          </TabPanel>

          <TabPanel value="notifications">
            <SettingsSection
              title="Notification preferences"
              onSubmit={() => onSave?.('notifications', notifications.commit())}
              onCancel={notifications.cancel}
            >
              <div className="ds-example-settings__switch-list">
                <Switch
                  label="Email notifications for comments and mentions"
                  checked={notifications.draft.emailNotifications}
                  onChange={(event) =>
                    notifications.update({ emailNotifications: event.target.checked })
                  }
                />
                <Switch
                  label="Product updates and announcements"
                  checked={notifications.draft.productUpdates}
                  onChange={(event) =>
                    notifications.update({ productUpdates: event.target.checked })
                  }
                />
              </div>
            </SettingsSection>
          </TabPanel>

          <TabPanel value="plan">
            {/* Section heading names the domain ("Plan"); the fieldset legend names the
                specific choice — never the same text twice (settings-section pattern). */}
            <SettingsSection
              title="Plan"
              onSubmit={() => onSave?.('plan', plan.commit())}
              onCancel={plan.cancel}
            >
              <RadioGroup
                legend="Choose a plan"
                helperText="Changes apply at the start of your next billing cycle."
              >
                <Radio
                  name="plan"
                  value="free"
                  label="Free — $0/month"
                  checked={plan.draft.plan === 'free'}
                  onChange={() => plan.update({ plan: 'free' })}
                />
                <Radio
                  name="plan"
                  value="pro"
                  label="Pro — $18/month"
                  checked={plan.draft.plan === 'pro'}
                  onChange={() => plan.update({ plan: 'pro' })}
                />
                <Radio
                  name="plan"
                  value="enterprise"
                  label="Enterprise — Custom pricing"
                  checked={plan.draft.plan === 'enterprise'}
                  onChange={() => plan.update({ plan: 'enterprise' })}
                />
              </RadioGroup>
            </SettingsSection>
          </TabPanel>

          <TabPanel value="security">
            <Card variant="outlined" padding="lg">
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
