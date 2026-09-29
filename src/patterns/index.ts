// Documented design-system patterns and templates (see docs/patterns/). These are
// reference compositions of DS components — deliberately NOT exported from src/index.ts
// (approved decision: patterns are formalized as docs + stories + Figma, not as public
// components, until a pattern proves it needs its own API). Used by src/examples/ and the
// Storybook `Patterns/*` stories.
export { AppShell } from './AppShell/AppShell';
export type { AppShellProps, AppShellNavItem } from './AppShell/AppShell';
export { PageHeader } from './PageHeader/PageHeader';
export type { PageHeaderProps } from './PageHeader/PageHeader';
export { CenteredCardLayout } from './CenteredCardLayout/CenteredCardLayout';
export type {
  CenteredCardLayoutProps,
  CenteredCardLayoutWidth,
} from './CenteredCardLayout/CenteredCardLayout';
export { ActionGroup } from './ActionGroup/ActionGroup';
export type { ActionGroupProps } from './ActionGroup/ActionGroup';
export { SettingsSection, FieldRow } from './SettingsSection/SettingsSection';
export type { SettingsSectionProps, FieldRowProps } from './SettingsSection/SettingsSection';
