import { Badge } from '../../components/Badge';
import type { BadgeStatus } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Divider } from '../../components/Divider';
import { Link } from '../../components/Link';
import { AppShell, PageHeader } from '../../patterns';
import './DashboardScreen.css';

interface Stat {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'neutral';
}

interface ActivityItem {
  text: string;
  time: string;
}

interface StatusItem {
  label: string;
  status: BadgeStatus;
  badgeLabel: string;
}

const STATS: Stat[] = [
  { label: 'Active projects', value: '24', delta: '+3 this week', tone: 'positive' },
  { label: 'Open tasks', value: '128', delta: '12 due today', tone: 'neutral' },
  { label: 'Team members', value: '9', delta: '2 pending invites', tone: 'neutral' },
];

const ACTIVITY: ActivityItem[] = [
  { text: 'Priya Shah invited Alex Kim to the workspace', time: '2h ago' },
  { text: 'Sprint 14 board was updated', time: '5h ago' },
  { text: 'Payment method updated', time: 'Yesterday' },
  { text: '3 new comments on "Q3 roadmap"', time: 'Yesterday' },
];

const STATUS: StatusItem[] = [
  { label: 'API', status: 'success', badgeLabel: 'Operational' },
  { label: 'Billing', status: 'success', badgeLabel: 'Operational' },
  { label: 'Email delivery', status: 'warning', badgeLabel: 'Degraded' },
];

export interface DashboardScreenProps {
  userName?: string;
  dashboardHref?: string;
  settingsHref?: string;
  viewAllActivityHref?: string;
}

/**
 * Dashboard screen — Card, Badge, Link and Divider inside the App shell template, with
 * the Page header pattern. Matches the approved Figma "02 — Dashboard" and "02b —
 * Dashboard · Mobile (375)" frames; responsive behavior is real CSS (see
 * DashboardScreen.css and src/patterns/AppShell/AppShell.css), not separate mobile markup.
 */
export function DashboardScreen({
  userName = 'Jordan Lee',
  dashboardHref = '#dashboard',
  settingsHref = '#settings',
  viewAllActivityHref = '#activity',
}: DashboardScreenProps) {
  return (
    <AppShell
      navItems={[
        { label: 'Dashboard', href: dashboardHref, current: true },
        { label: 'Settings', href: settingsHref },
      ]}
      secondary={
        <>
          <Badge>Free plan</Badge>
          <span>{userName}</span>
        </>
      }
    >
      <PageHeader
        title="Good afternoon, Jordan"
        description="Here's what's happening with your workspace today."
      />

      <div className="ds-example-dashboard__stat-row">
        {STATS.map((stat) => (
          <Card
            key={stat.label}
            variant="elevated"
            padding="lg"
            className="ds-example-dashboard__stat-card"
          >
            <span className="ds-example-dashboard__stat-label">{stat.label}</span>
            <span className="ds-example-dashboard__stat-value">{stat.value}</span>
            <span
              className={`ds-example-dashboard__stat-delta ds-example-dashboard__stat-delta--${stat.tone}`}
            >
              {stat.delta}
            </span>
          </Card>
        ))}
      </div>

      <div className="ds-example-dashboard__lower-row">
        <Card variant="outlined" padding="lg" className="ds-example-dashboard__activity-card">
          <div className="ds-example-dashboard__card-header">
            <h2>Recent activity</h2>
            {/* Short visible text + a full accessible name so it makes sense out of context. */}
            <Link href={viewAllActivityHref} aria-label="View all activity">
              View all
            </Link>
          </div>
          <ul className="ds-example-dashboard__activity-list">
            {ACTIVITY.map((item, index) => (
              <li key={item.text}>
                {/* The list already conveys structure → decorative divider inside the item. */}
                {index > 0 && <Divider decorative />}
                <div className="ds-example-dashboard__activity-row">
                  <span className="ds-example-dashboard__activity-text">{item.text}</span>
                  <span className="ds-example-dashboard__activity-time">{item.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="outlined" padding="lg" className="ds-example-dashboard__status-card">
          <h2>System status</h2>
          <ul className="ds-example-dashboard__status-list">
            {STATUS.map((item) => (
              <li key={item.label}>
                <span className="ds-example-dashboard__status-label">{item.label}</span>
                <Badge status={item.status} emphasis="subtle">
                  {item.badgeLabel}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

DashboardScreen.displayName = 'DashboardScreen';
