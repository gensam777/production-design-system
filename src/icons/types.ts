// Provider-neutral icon catalog. These are the only names a consumer may pass to
// <Icon name="..." /> — the underlying artwork provider (Lucide today) is an
// implementation detail hidden behind this stable list. See
// governance/decisions/0010-icon-token-architecture.md and docs/foundations/icons.md.
export type IconName =
  | 'plus'
  | 'minus'
  | 'check'
  | 'close'
  | 'search'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'info'
  | 'warning'
  | 'trash'
  | 'edit'
  | 'settings';

// Approved design-system display sizes — mirrors the semantic icon.sm/md/lg tokens
// (16/20/24px). Never introduce an arbitrary numeric size here.
export type IconSize = 'sm' | 'md' | 'lg';
