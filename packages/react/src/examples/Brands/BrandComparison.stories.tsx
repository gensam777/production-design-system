import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Checkbox } from '../../components/Checkbox';
import { Input } from '../../components/Input';
import { Link } from '../../components/Link';
import { PasswordInput } from '../../components/PasswordInput';
import { Radio } from '../../components/Radio';
import { RadioGroup } from '../../components/RadioGroup';
import { Switch } from '../../components/Switch';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../../components/Tabs';
import { DashboardScreen } from '../Dashboard';
import { LoginScreen } from '../Login';

const meta: Meta = {
  title: 'Brands/Side by side',
  parameters: {
    layout: 'fullscreen',
    // These stories already render both brands; one snapshot is enough.
    chromatic: { modes: { 'Brand A': { brand: 'brand-a' } } },
    docs: {
      description: {
        component:
          'The same components and screens rendered twice, each inside a container with ' +
          '`data-brand` (contained previews — see ADR 0011). Nothing but the theme/token ' +
          'layer differs: primary hue, sans font (Inter / Figtree) and control/container ' +
          'radius. Components never read the brand; they only consume semantic CSS ' +
          'custom properties.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

/** Renders the same content once per brand. `children` receives the brand id only so
 * per-column form controls (radio groups) get unique names — never to change visuals. */
function BrandColumns({ children }: { children: ReactNode | ((brand: string) => ReactNode) }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {(['brand-a', 'brand-b'] as const).map((brand) => (
        <section
          key={brand}
          data-brand={brand}
          aria-label={brand === 'brand-a' ? 'Brand A' : 'Brand B'}
          style={{
            minWidth: 0,
            background: 'var(--color-surface-canvas)',
            borderInlineEnd: '1px solid var(--color-border-subtle)',
          }}
        >
          {typeof children === 'function' ? children(brand) : children}
        </section>
      ))}
    </div>
  );
}

export const Components: Story = {
  render: () => (
    <BrandColumns>
      {(brand) => (
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="primary">Save changes</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="tertiary">More</Button>
            <Link href="#forgot">Forgot password?</Link>
          </div>
          <Input
            label="Email address"
            defaultValue="jordan@example.com"
            helperText="We'll never share it."
          />
          <PasswordInput
            label="Password"
            defaultValue="correct-horse"
            autoComplete="current-password"
          />
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Checkbox label="Remember me" defaultChecked />
            <Switch label="Notifications" defaultChecked />
            <RadioGroup legend="Plan">
              <Radio name={`plan-${brand}`} value="free" label="Free" defaultChecked />
              <Radio name={`plan-${brand}`} value="pro" label="Pro" />
            </RadioGroup>
          </div>
          <Tabs defaultValue="profile">
            <TabList>
              <Tab value="profile">Profile</Tab>
              <Tab value="plan">Plan</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="profile">
                <Card variant="outlined" padding="lg">
                  Card content — container radius follows the brand.
                </Card>
              </TabPanel>
              <TabPanel value="plan">Plan panel</TabPanel>
            </TabPanels>
          </Tabs>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge status="info">Info</Badge>
            <Badge status="success">Operational</Badge>
            <Badge status="warning">Degraded</Badge>
            <Badge status="danger">Down</Badge>
          </div>
          <Alert status="success" title="Feedback colors are shared">
            Success / warning / danger / info never change between brands.
          </Alert>
        </div>
      )}
    </BrandColumns>
  ),
};

export const Login: Story = {
  render: () => (
    <BrandColumns>
      <LoginScreen />
    </BrandColumns>
  ),
};

export const Dashboard: Story = {
  render: () => (
    <BrandColumns>
      <DashboardScreen />
    </BrandColumns>
  ),
};
