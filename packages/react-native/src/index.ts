// @pds/react-native — React Native reference implementation of the shared component
// contracts (design/contracts/, ADR 0013 / 0015 / 0018). Components consume the generated,
// brand-aware token themes below through PDSThemeProvider — never web CSS custom properties
// and never React DOM components.

// Components
export { Button, BUTTON_LAYOUT_STYLE_KEYS } from './components/Button/Button';
export type {
  ButtonLayoutStyle,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from './components/Button/Button';

// Theme
export { PDSThemeProvider, usePDSTheme } from './theme/PDSThemeProvider';
export type { PDSThemeContextValue, PDSThemeProviderProps } from './theme/PDSThemeProvider';
export { resolveTextStyle } from './theme/typography';
export type { TextStyleOptions } from './theme/typography';

// Accessibility
export { useReducedMotion } from './hooks/useReducedMotion';

// Icons — catalog names only; the artwork provider stays internal.
export type { IconName } from './icons/types';

// Generated token themes (`brandA`, `brandB`, `themes`, `defaultBrand`, `Theme`, …).
export * from '@pds/tokens/react-native';
