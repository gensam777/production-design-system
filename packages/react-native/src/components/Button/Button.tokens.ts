// Button's token bindings — a 1:1 copy of the contract's `tokens` section
// (design/contracts/components/button.contract.yaml), kept as contract token paths so the test
// suite can compare it to the YAML cell by cell and resolve every path in every brand.
// Resolution to theme values happens once per theme in ./buttonTheme.ts.
//
// Container state cells: `hover` applies only with a hover pointer (iPad pointer, Android
// mouse); `pressed` while a touch / press is down; neither while loading.

export const buttonTokens = {
  container: {
    background: {
      primary: {
        default: 'color.action.primary.default',
        hover: 'color.action.primary.hover',
        pressed: 'color.action.primary.active',
        disabled: 'color.action.primary.disabled',
      },
      secondary: {
        default: 'color.action.secondary.default',
        hover: 'color.action.secondary.hover',
        pressed: 'color.action.secondary.hover',
        disabled: 'color.action.secondary.default',
      },
      tertiary: {
        default: 'none',
        hover: 'color.action.tertiary.hover',
        pressed: 'color.action.tertiary.hover',
        disabled: 'none',
      },
      danger: {
        default: 'color.action.danger.default',
        hover: 'color.action.danger.hover',
        pressed: 'color.action.danger.hover',
        disabled: 'color.action.danger.disabled',
      },
    },
    'border-color': {
      primary: 'none',
      secondary: 'color.border.default',
      tertiary: 'none',
      danger: 'none',
    },
    radius: 'radius.control',
    'padding-block': { sm: 'space.inset.xs', md: 'space.inset.sm', lg: 'space.inset.sm' },
    'padding-inline': { sm: 'space.inset.md', md: 'space.inset.lg', lg: 'space.inset.xl' },
    'padding-inline-icon-side': {
      sm: 'space.inset.sm',
      md: 'space.inset.md',
      lg: 'space.inset.lg',
    },
    gap: { sm: 'space.inline.xs', md: 'space.inline.sm', lg: 'space.inline.sm' },
    'state-transition': 'motion.micro',
  },
  label: {
    color: {
      primary: { default: 'color.action.primary.on-color', disabled: 'color.text.disabled' },
      secondary: { default: 'color.text.primary', disabled: 'color.text.disabled' },
      tertiary: { default: 'color.text.primary', disabled: 'color.text.disabled' },
      danger: { default: 'color.action.danger.on-color', disabled: 'color.text.disabled' },
    },
    typography: {
      sm: 'text.label.sm.medium',
      md: 'text.label.md.medium',
      lg: 'text.label.lg.medium',
    },
  },
  leadingIcon: {
    size: { sm: 'icon.sm', md: 'icon.md', lg: 'icon.lg' },
  },
  trailingIcon: {
    size: { sm: 'icon.sm', md: 'icon.md', lg: 'icon.lg' },
  },
  spinner: {
    color: {
      primary: 'color.action.primary.on-color',
      secondary: 'color.text.primary',
      tertiary: 'color.text.primary',
      danger: 'color.action.danger.on-color',
    },
    size: { sm: 'icon.sm', md: 'icon.md', lg: 'icon.lg' },
    radius: 'radius.full',
    rotation: 'motion.spinner',
  },
  focusIndicator: {
    color: 'color.focus.ring',
    'offset-color': 'color.focus.ring-offset',
  },
} as const;

/** Contract `component-constants` and `sizing` — deliberately not tokens. */
export const buttonConstants = {
  borderWidth: 1,
  spinnerStrokeWidth: 2,
  visualHeight: { sm: 32, md: 40, lg: 48 },
} as const;
