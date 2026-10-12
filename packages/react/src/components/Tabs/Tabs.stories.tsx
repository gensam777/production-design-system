import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs } from './Tabs';
import { TabList } from './TabList';
import { Tab } from './Tab';
import { TabPanels } from './TabPanels';
import { TabPanel } from './TabPanel';
import { Icon } from '../../icons';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          'Tabs V1 — a connected row of triggers switching between mutually exclusive ' +
          'views. Real `role="tab"` `<button>`s, roving tabindex, arrow-key navigation, ' +
          'automatic activation. See `docs/design-to-code-mappings.md`.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Playground: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <Tabs defaultValue="account">
        <TabList>
          <Tab value="account">Account</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="billing">Billing</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="account">Account settings content.</TabPanel>
          <TabPanel value="notifications">Notification preferences content.</TabPanel>
          <TabPanel value="billing">Billing details content.</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    function ControlledDemo() {
      const [value, setValue] = useState('one');
      return (
        <div style={{ width: 480 }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Active: {value}</p>
          <Tabs value={value} onValueChange={setValue}>
            <TabList>
              <Tab value="one">One</Tab>
              <Tab value="two">Two</Tab>
              <Tab value="three">Three</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="one">Panel one.</TabPanel>
              <TabPanel value="two">Panel two.</TabPanel>
              <TabPanel value="three">Panel three.</TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      );
    }
    return <ControlledDemo />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tabs supports both controlled (`value`/`onValueChange`, shown here) and ' +
          'uncontrolled (`defaultValue`) usage.',
      },
    },
  },
};

export const WithLeadingIcons: Story = {
  name: 'With leading icons',
  render: () => (
    <div style={{ width: 480 }}>
      <Tabs defaultValue="search">
        <TabList>
          <Tab value="search" leadingIcon={<Icon name="search" size="sm" />}>
            Search
          </Tab>
          <Tab value="settings" leadingIcon={<Icon name="settings" size="sm" />}>
            Settings
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="search">Search panel.</TabPanel>
          <TabPanel value="settings">Settings panel.</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  ),
};

export const DisabledTab: Story = {
  name: 'Disabled tab',
  render: () => (
    <div style={{ width: 480 }}>
      <Tabs defaultValue="one">
        <TabList>
          <Tab value="one">Available</Tab>
          <Tab value="two" disabled>
            Unavailable
          </Tab>
          <Tab value="three">Available</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="one">First panel.</TabPanel>
          <TabPanel value="two">This panel is unreachable while its tab is disabled.</TabPanel>
          <TabPanel value="three">Third panel.</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A disabled tab is excluded from arrow-key navigation automatically — `TabList` ' +
          'only queries `[role="tab"]:not(:disabled)` when computing the next tab.',
      },
    },
  },
};

export const KeyboardNavigation: Story = {
  name: 'Keyboard navigation',
  render: () => (
    <div style={{ width: 480 }}>
      <Tabs defaultValue="one">
        <TabList>
          <Tab value="one">First</Tab>
          <Tab value="two">Second</Tab>
          <Tab value="three">Third</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="one">
            Tab to focus the tablist, then use Left/Right arrow keys (or Home/End) to
            move between tabs — automatic activation means the panel switches as you
            move focus, not just on click.
          </TabPanel>
          <TabPanel value="two">Second panel.</TabPanel>
          <TabPanel value="three">Third panel.</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  ),
};
