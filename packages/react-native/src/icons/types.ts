// Platform-neutral icon catalog names (design/icons/icons.json, ADR 0019). These are the only
// names a consumer may pass to a component's icon slot — the artwork provider (Lucide today)
// is an implementation detail behind this list. Same union as the web IconName
// (packages/react/src/icons/types.ts); `npm run icons:test` keeps both equal to the catalog.
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
  | 'success'
  | 'danger'
  | 'trash'
  | 'edit'
  | 'settings'
  | 'eye'
  | 'eye-off';
