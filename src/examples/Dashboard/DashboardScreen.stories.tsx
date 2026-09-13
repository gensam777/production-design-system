import type { Meta, StoryObj } from '@storybook/react-vite';

import { DashboardScreen } from './DashboardScreen';

const meta: Meta<typeof DashboardScreen> = {
  title: 'Examples/Dashboard',
  component: DashboardScreen,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Dashboard screen — composed from Card, Badge, Button, and the shared ' +
          'AppShell. Responsive behavior is real CSS in `DashboardScreen.css` and ' +
          '`AppShell.css`, not separate mobile markup — resize the browser/Storybook ' +
          'canvas to see it reflow, or see the Mobile story below for a fixed-width ' +
          'demonstration of the same component and stylesheet.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DashboardScreen>;

export const Default: Story = {};

export const Mobile: Story = {
  render: () => {
    // AppShell/DashboardScreen use real viewport `@media` queries (per
    // docs/foundations/responsive.md's page/app-shell convention — never container
    // queries at this level), so a plain narrow wrapper `<div>` does NOT trigger them:
    // `@media` evaluates against the document's own viewport, not an ancestor element's
    // width. A nested `<iframe>` has its own independent viewport equal to its rendered
    // size, so this is the correct way to demonstrate real viewport-query reflow inside
    // Storybook without an addon-viewport dependency (not installed — see
    // .storybook/main.ts) or an actual resized browser window.
    const src = `${window.location.pathname}?id=examples-dashboard--default&viewMode=story`;
    return (
      <iframe
        title="Dashboard at a Compact (375px) viewport"
        src={src}
        style={{ width: 375, height: 900, border: '1px solid #d0d5dd' }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The same screen rendered inside a real 375px-wide nested viewport (an ' +
          '`<iframe>`, not a wrapper `<div>`): the stat row wraps to a single column and ' +
          'the nav/Recent Activity/System Status row respond to the actual `@media` ' +
          'queries in `AppShell.css`/`DashboardScreen.css` — the one real breakpoint ' +
          'decision `docs/foundations/responsive.md` says intrinsic wrap can’t ' +
          'express on its own. Matches the approved Figma "02b — Dashboard · Mobile ' +
          '(375)" frame.',
      },
    },
  },
};
