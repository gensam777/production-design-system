import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type {
  GestureResponderEvent,
  HostInstance,
  Insets,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { Transition } from '@pds/tokens/react-native';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Icon } from '../../icons/Icon';
import type { IconName } from '../../icons/types';
import { usePDSTheme } from '../../theme/PDSThemeProvider';
import { Spinner } from '../Spinner/Spinner';
import { buttonConstants } from './Button.tokens';
import { buttonVisualState, getButtonTheme } from './buttonTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/** The only style keys Button accepts: placement in the parent layout, never its look. */
export const BUTTON_LAYOUT_STYLE_KEYS = [
  'alignSelf',
  'flex',
  'flexBasis',
  'flexGrow',
  'flexShrink',
  'width',
  'minWidth',
  'maxWidth',
  'margin',
  'marginHorizontal',
  'marginVertical',
  'marginTop',
  'marginBottom',
  'marginStart',
  'marginEnd',
  'marginLeft',
  'marginRight',
] as const;

export type ButtonLayoutStyle = Pick<ViewStyle, (typeof BUTTON_LAYOUT_STYLE_KEYS)[number]>;

export interface ButtonProps {
  /** The visible label — short, verb-first action text. Also the accessible name. */
  children: string;
  /** Visual emphasis. Defaults to `'primary'`. */
  variant?: ButtonVariant;
  /** Visual size. Defaults to `'md'`. */
  size?: ButtonSize;
  /**
   * The action is unavailable: `onPress` never runs and assistive technology reports the
   * button as disabled. Wins over `loading` — label shown, no spinner, not busy.
   */
  disabled?: boolean;
  /**
   * The action was triggered and its result is pending. Shows only the spinner (size
   * unchanged), keeps the variant's normal colors, is reported as busy (not disabled), stays
   * focusable and blocks `onPress`. Ignored while `disabled` is set.
   */
  loading?: boolean;
  /** Decorative catalog icon before the label (hidden from assistive technology). */
  leadingIcon?: IconName;
  /** Decorative catalog icon after the label (hidden from assistive technology). */
  trailingIcon?: IconName;
  /** Runs on activation — touch, keyboard, switch / voice control or a screen reader. */
  onPress?: (event: GestureResponderEvent) => void;
  /** Describes the result of activating, when the label alone doesn't make it clear. */
  accessibilityHint?: string;
  /**
   * Localized busy state, announced as the button's value while loading (the name stays the
   * label). React Native has no busy announcement on every platform, so this carries it.
   * Defaults to `'Loading'`.
   */
  loadingAccessibilityValue?: string;
  /** Test identifier. Derived ids on the parts: `<testID>.label`, `.leadingIcon`, `.trailingIcon`, `.spinner`. */
  testID?: string;
  /**
   * Layout only — margins, flex and width (`BUTTON_LAYOUT_STYLE_KEYS`). Colors, padding,
   * height, radius and typography come from the theme and can't be overridden.
   */
  style?: StyleProp<ButtonLayoutStyle>;
  /** The underlying pressable host view (measure, focus). */
  ref?: Ref<HostInstance>;
}

/** Host-platform minimum touch target (contract `sizing.hit-target.minimum.react-native`). */
const MIN_TARGET = Platform.select({ ios: 44, android: 48, default: 44 });

const LAYOUT_KEYS = new Set<string>(BUTTON_LAYOUT_STYLE_KEYS);

function layoutStyle(style: StyleProp<ButtonLayoutStyle>): ButtonLayoutStyle | undefined {
  const flat = StyleSheet.flatten(style) as Record<string, unknown> | undefined;
  if (!flat) return undefined;
  const out: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [key, value] of Object.entries(flat)) {
    if (LAYOUT_KEYS.has(key)) out[key] = value;
    else dropped.push(key);
  }
  if (__DEV__ && dropped.length)
    console.warn(
      `@pds/react-native Button: style accepts layout keys only; ignored ${dropped.join(', ')}.`,
    );
  return out as ButtonLayoutStyle;
}

/**
 * Hit-slop that expands the touch target to the platform minimum without changing the visual
 * size or the surrounding layout. From the measured size, so a button grown by text scaling
 * or a wide label needs less (iOS sm/md/lg: 6/2/0 vertical, Android: 8/4/0).
 */
export function touchTargetSlop(width: number, height: number, minimum = MIN_TARGET): Insets {
  const vertical = Math.max(0, Math.ceil((minimum - height) / 2));
  const horizontal = Math.max(0, Math.ceil((minimum - width) / 2));
  return { top: vertical, bottom: vertical, left: horizontal, right: horizontal };
}

/** `#RRGGBB[AA]` → the same color fully transparent, so a fade to/from "no paint" keeps its hue. */
const clear = (hex: string) => `${hex.slice(0, 7)}00`;

type AnimatedColor = string | Animated.AnimatedInterpolation<string>;

/**
 * Container colors with the contract's `state-transition` (`motion.micro`). Snaps when the
 * transition is 0 ms or Reduce Motion is on (web: motion-reduced-motion.css sets it to 0 ms).
 */
function useContainerColors(
  background: string | null,
  border: string | null,
  transition: Transition,
  animate: boolean,
): { background: AnimatedColor; border: AnimatedColor } {
  const progress = useRef(new Animated.Value(1)).current;
  const target = [background, border] as const;
  const key = target.join('|');
  const [segment, setSegment] = useState({ key, from: target, to: target });
  const [x1, y1, x2, y2] = transition.easing;

  // Layout effect: the new segment is committed before the frame is painted, so the old
  // color is never skipped.
  useLayoutEffect(() => {
    if (segment.key === key) return;
    setSegment({ key, from: segment.to, to: [background, border] });
    if (!animate || transition.duration <= 0) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: transition.duration,
      delay: transition.delay,
      easing: Easing.bezier(x1, y1, x2, y2),
      useNativeDriver: false,
    }).start();
  }, [key, segment, background, border, animate, transition, progress, x1, y1, x2, y2]);

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const channel = (i: 0 | 1): AnimatedColor => {
    const from = segment.from[i];
    const to = segment.to[i];
    if (!animate || from === to) return to ?? 'transparent';
    const range = from && to ? [from, to] : from ? [from, clear(from)] : [clear(to!), to!];
    return progress.interpolate({ inputRange: [0, 1], outputRange: range });
  };
  return { background: channel(0), border: channel(1) };
}

/**
 * Production Button (React Native reference of design/contracts/components/button.contract.yaml).
 * A `Pressable` styled from the nearest `PDSThemeProvider`'s semantic tokens; brand-agnostic.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  onPress,
  accessibilityHint,
  loadingAccessibilityValue = 'Loading',
  testID,
  style,
  ref,
}: ButtonProps) {
  const { theme, textStyle } = usePDSTheme();
  const tokens = getButtonTheme(theme);
  const metrics = tokens.sizes[size];
  const reduceMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();

  // Contract states.precedence: disabled > loading > default.
  const isLoading = loading && !disabled;

  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [measured, setMeasured] = useState<{ width: number; height: number } | null>(null);

  // A press or hover in flight when the button became disabled must not resurface later.
  useEffect(() => {
    if (disabled) {
      setPressed(false);
      setHovered(false);
    }
  }, [disabled]);

  const state = buttonVisualState({ disabled, loading: isLoading, pressed, hovered });
  const colors = tokens.colors[variant][state];
  const container = useContainerColors(
    colors.background,
    colors.border,
    tokens.stateTransition,
    !reduceMotion,
  );

  // Icons and the spinner scale with the label (ADR 0018 decision 2: React Native font scale).
  const iconSize = Math.round(metrics.iconSize * fontScale);
  const spinnerSize = Math.round(metrics.spinnerSize * fontScale);

  const handlePress = (event: GestureResponderEvent) => {
    // Loading is not disabled (it stays focusable and is reported as busy), so activation is
    // blocked here. Disabled is blocked by Pressable itself.
    if (isLoading) return;
    onPress?.(event);
  };

  const handleLayout = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    const width = Math.round(layout.width);
    const height = Math.round(layout.height);
    setMeasured((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  const hitSlop = touchTargetSlop(
    measured?.width ?? MIN_TARGET,
    measured?.height ?? metrics.minHeight,
  );
  const partID = (part: string) => (testID ? `${testID}.${part}` : undefined);
  // Hidden while loading but kept in layout, so width and height don't change.
  const contentOpacity = isLoading ? 0 : 1;

  // One box: the pressable view is both the laid-out box and the painted container. A
  // separate painted child sized with flexGrow inflated inside wrapping rows on device (Yoga
  // offered the pressable more height than its content during measurement), so nothing here
  // grows; the button is exactly its content plus padding, never less than minHeight.
  return (
    <AnimatedPressable
      ref={ref}
      testID={testID}
      style={[
        styles.container,
        {
          minHeight: metrics.minHeight,
          paddingVertical: metrics.paddingBlock,
          paddingStart: leadingIcon ? metrics.paddingInlineIconSide : metrics.paddingInline,
          paddingEnd: trailingIcon ? metrics.paddingInlineIconSide : metrics.paddingInline,
          columnGap: metrics.gap,
          borderRadius: tokens.radius,
          borderWidth: buttonConstants.borderWidth,
          borderColor: container.border,
          backgroundColor: container.background,
        },
        layoutStyle(style),
      ]}
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onLayout={handleLayout}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: isLoading }}
      accessibilityValue={isLoading ? { text: loadingAccessibilityValue } : undefined}
    >
      {leadingIcon && (
        <View style={{ opacity: contentOpacity }}>
          <Icon
            name={leadingIcon}
            size={iconSize}
            color={colors.foreground}
            testID={partID('leadingIcon')}
          />
        </View>
      )}
      <Text
        testID={partID('label')}
        dynamicTypeRamp={metrics.dynamicTypeRamp}
        style={[
          textStyle(metrics.typography),
          styles.label,
          { color: colors.foreground, opacity: contentOpacity },
        ]}
      >
        {children}
      </Text>
      {trailingIcon && (
        <View style={{ opacity: contentOpacity }}>
          <Icon
            name={trailingIcon}
            size={iconSize}
            color={colors.foreground}
            testID={partID('trailingIcon')}
          />
        </View>
      )}
      {isLoading && (
        <View style={styles.spinnerSlot} pointerEvents="none">
          <Spinner
            testID={partID('spinner')}
            size={spinnerSize}
            color={tokens.spinnerColor[variant]}
            strokeWidth={buttonConstants.spinnerStrokeWidth}
            radius={tokens.spinnerRadius}
            rotation={tokens.spinnerRotation}
            reduceMotion={reduceMotion}
          />
        </View>
      )}
      {/* Android draws no focus effect for a custom pressable, so Button draws the contract's
          focus indicator there (keyboard / D-pad focus only — touch never focuses in touch
          mode). iOS keeps its system focus effect (contract focus-indicator-rendering). */}
      {focused && Platform.OS === 'android' && (
        <View
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.focusRing,
            { borderColor: tokens.focusRing, borderRadius: tokens.radius + FOCUS_OUTSET },
          ]}
        >
          <View
            style={[
              styles.focusOffset,
              { borderColor: tokens.focusRingOffset, borderRadius: tokens.radius + FOCUS_OFFSET },
            ]}
          />
        </View>
      )}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Contract component-constants.focus-indicator-geometry: 2 offset band + 2 ring, outside the
// border. Absolute insets are measured from the padding box (inside the 1px border).
const FOCUS_OFFSET = 2;
const FOCUS_OUTSET = 4;
const FOCUS_INSET = -(FOCUS_OUTSET + buttonConstants.borderWidth);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Wraps instead of clipping or truncating when text scaling no longer fits one line.
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
  spinnerSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusRing: {
    position: 'absolute',
    top: FOCUS_INSET,
    bottom: FOCUS_INSET,
    left: FOCUS_INSET,
    right: FOCUS_INSET,
    borderWidth: 2,
  },
  focusOffset: {
    flex: 1,
    borderWidth: 2,
  },
});
