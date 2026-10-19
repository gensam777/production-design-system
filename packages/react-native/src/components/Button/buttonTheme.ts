import type { DynamicTypeRamp, TextStyleToken, Theme, Transition } from '@pds/tokens/react-native';

import {
  colorToken,
  numberToken,
  resolveTokenPath,
  textStyleToken,
  themePath,
  transitionToken,
} from '../../theme/tokenPath';
import type { ButtonSize, ButtonVariant } from './Button';
import { buttonConstants, buttonTokens } from './Button.tokens';

/** Which token cell paints the container. Loading uses `default` (contract `states.loading`). */
export type ButtonVisualState = 'default' | 'hover' | 'pressed' | 'disabled';

export const BUTTON_VARIANTS: readonly ButtonVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'danger',
];
export const BUTTON_SIZES: readonly ButtonSize[] = ['sm', 'md', 'lg'];
const VISUAL_STATES: readonly ButtonVisualState[] = ['default', 'hover', 'pressed', 'disabled'];

export interface ButtonColors {
  /** `null` = no fill (contract `none`). */
  background: string | null;
  /** `null` = the reserved 1px border stays transparent. */
  border: string | null;
  /** Label and icon color. */
  foreground: string;
}

export interface ButtonSizeMetrics {
  /** Minimum, not fixed: grows with text scaling (contract `sizing.height: minimum`). */
  minHeight: number;
  paddingBlock: number;
  paddingInline: number;
  paddingInlineIconSide: number;
  gap: number;
  /** Unscaled `icon.*` size; the component multiplies by the OS font scale. */
  iconSize: number;
  spinnerSize: number;
  typography: TextStyleToken;
  /** iOS Dynamic Type anchor of the label role (ADR 0016 text-scaling). */
  dynamicTypeRamp: DynamicTypeRamp;
}

export interface ResolvedButtonTheme {
  colors: Record<ButtonVariant, Record<ButtonVisualState, ButtonColors>>;
  spinnerColor: Record<ButtonVariant, string>;
  sizes: Record<ButtonSize, ButtonSizeMetrics>;
  radius: number;
  spinnerRadius: number;
  stateTransition: Transition;
  spinnerRotation: Transition;
  focusRing: string;
  focusRingOffset: string;
}

const t = buttonTokens;

function labelColor(theme: Theme, variant: ButtonVariant, state: ButtonVisualState): string {
  const cells = t.label.color[variant];
  // Label cells exist for default + disabled only; hover/pressed keep the default label.
  const color = colorToken(theme, state === 'disabled' ? cells.disabled : cells.default);
  if (!color) throw new Error(`@pds/react-native: Button label color for ${variant} is 'none'`);
  return color;
}

function resolve(theme: Theme): ResolvedButtonTheme {
  const colors = {} as ResolvedButtonTheme['colors'];
  const spinnerColor = {} as ResolvedButtonTheme['spinnerColor'];
  for (const variant of BUTTON_VARIANTS) {
    colors[variant] = {} as Record<ButtonVisualState, ButtonColors>;
    for (const state of VISUAL_STATES)
      colors[variant][state] = {
        background: colorToken(theme, t.container.background[variant][state]),
        border: colorToken(theme, t.container['border-color'][variant]),
        foreground: labelColor(theme, variant, state),
      };
    const spinner = colorToken(theme, t.spinner.color[variant]);
    if (!spinner)
      throw new Error(`@pds/react-native: Button spinner color for ${variant} is 'none'`);
    spinnerColor[variant] = spinner;
  }

  const sizes = {} as ResolvedButtonTheme['sizes'];
  for (const size of BUTTON_SIZES) {
    const typographyPath = t.label.typography[size];
    // `text.label.md.medium` → `dynamicTypeRamp.label.md` (the anchor is per role + size).
    const [, group, step] = themePath(typographyPath);
    sizes[size] = {
      minHeight: buttonConstants.visualHeight[size],
      paddingBlock: numberToken(theme, t.container['padding-block'][size]),
      paddingInline: numberToken(theme, t.container['padding-inline'][size]),
      paddingInlineIconSide: numberToken(theme, t.container['padding-inline-icon-side'][size]),
      gap: numberToken(theme, t.container.gap[size]),
      iconSize: numberToken(theme, t.leadingIcon.size[size]),
      spinnerSize: numberToken(theme, t.spinner.size[size]),
      typography: textStyleToken(theme, typographyPath),
      dynamicTypeRamp: resolveTokenPath(
        theme,
        `dynamicTypeRamp.${group}.${step}`,
      ) as DynamicTypeRamp,
    };
  }

  const ring = colorToken(theme, t.focusIndicator.color);
  const ringOffset = colorToken(theme, t.focusIndicator['offset-color']);
  if (!ring || !ringOffset) throw new Error('@pds/react-native: Button focus colors are missing');

  return {
    colors,
    spinnerColor,
    sizes,
    radius: numberToken(theme, t.container.radius),
    spinnerRadius: numberToken(theme, t.spinner.radius),
    stateTransition: transitionToken(theme, t.container['state-transition']),
    spinnerRotation: transitionToken(theme, t.spinner.rotation),
    focusRing: ring,
    focusRingOffset: ringOffset,
  };
}

const cache = new WeakMap<Theme, ResolvedButtonTheme>();

/** Every Button token resolved for one theme. Computed once per theme object. */
export function getButtonTheme(theme: Theme): ResolvedButtonTheme {
  let resolved = cache.get(theme);
  if (!resolved) {
    resolved = resolve(theme);
    cache.set(theme, resolved);
  }
  return resolved;
}

/**
 * Which container cell applies — contract `states.precedence` (disabled > loading > default),
 * then the platform-owned pressed / hover visuals, which never show while loading.
 */
export function buttonVisualState({
  disabled,
  loading,
  pressed,
  hovered,
}: {
  disabled: boolean;
  loading: boolean;
  pressed: boolean;
  hovered: boolean;
}): ButtonVisualState {
  if (disabled) return 'disabled';
  if (loading) return 'default';
  if (pressed) return 'pressed';
  if (hovered) return 'hover';
  return 'default';
}
