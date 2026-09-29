import type { Meta, StoryObj } from '@storybook/react-vite';

import { AppShell } from './AppShell';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { PageHeader } from '../PageHeader/PageHeader';

const meta: Meta<typeof AppShell> = {
  title: 'Patterns/App shell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Template: skip link → header (brand, labelled `<nav>` of Links with ' +
          '`aria-current`, optional secondary context hidden on Compact) → `<main>` with the ' +
          'page gutter outside the 1280px content cap. Viewport breakpoints only at this ' +
          'level. See `docs/patterns/app-shell.md`. Documented composition, not an exported ' +
          'component.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AppShell>;

const shell = (
  <AppShell
    navItems={[
      { label: 'Dashboard', href: '#dashboard', current: true },
      { label: 'Settings', href: '#settings' },
    ]}
    secondary={
      <>
        <Badge>Free plan</Badge>
        <span>Jordan Lee</span>
      </>
    }
  >
    <PageHeader title="Page title" description="One line describing this page." />
    <Card variant="outlined" padding="lg">
      Page content sits inside the 1280px container; the gutter is outside it.
    </Card>
  </AppShell>
);

export const Default: Story = { render: () => shell };

export const Compact: Story = {
  name: 'Compact (375px viewport)',
  parameters: {
    docs: {
      description: {
        story:
          'Rendered in a real 375px viewport (`<iframe>`) so the viewport media queries ' +
          'actually apply: 56px nav, `space.layout.sm` gutter, secondary context hidden.',
      },
    },
  },
  render: () => (
    <iframe
      title="App shell at a Compact (375px) viewport"
      src={`${window.location.pathname}?id=patterns-app-shell--default&viewMode=story`}
      style={{ width: 375, height: 480, border: '1px solid #d0d5dd' }}
    />
  ),
};
