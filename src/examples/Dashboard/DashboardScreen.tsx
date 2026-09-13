import { Badge } from '../../components/Badge';
import type { BadgeStatus } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { AppShell } from '../shared/AppShell';
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
  onNavigateSettings?: () => void;
  onViewAllActivity?: () => void;
}

/**
 * Dashboard screen — composed from Card, Badge, Button, and the shared AppShell. Matches
 * the approved Figma "02 — Dashboard" frame. Responsive behavior (stat row wrap, the
 * activity/status row switching from a column to a row) is implemented directly in
 * DashboardScreen.css, not as separate mobile markup — see the file for the one real
 * breakpoint decision (row -> column) that intrinsic wrap can't express on its own.
 */
export function DashboardScreen({ userName, onNavigateSettings, onViewAllActivity }: DashboardScreenProps) {
  return (
    <AppShell userName={userName} onNavigateSettings={onNavigateSettings}>
      <div className="ds-example-dashboard__heading">
        <h1>Good afternoon, Jordan</h1>
        <p>Here&apos;s what&apos;s happening with your workspace today.</p>
      </div>

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
            <Button variant="tertiary" size="sm" onClick={onViewAllActivity}>
              View all
            </Button>
          </div>
          <ul className="ds-example-dashboard__activity-list">
            {ACTIVITY.map((item) => (
              <li key={item.text}>
                <span className="ds-example-dashboard__activity-text">{item.text}</span>
                <span className="ds-example-dashboard__activity-time">{item.time}</span>
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
