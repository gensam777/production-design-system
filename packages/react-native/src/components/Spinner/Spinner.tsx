import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Transition } from '@pds/tokens/react-native';

export interface SpinnerProps {
  /** Box size in dp/pt (a resolved, font-scaled `icon.*` token). */
  size: number;
  color: string;
  /** Ring stroke — Button's `spinner-stroke-width` component constant. */
  strokeWidth: number;
  /** `radius.full` — the spinner box is a circle. */
  radius: number;
  /** One full turn — `motion.spinner` (duration + easing; the delay is 0). */
  rotation: Transition;
  /** Reduce Motion on: the ring is drawn but does not rotate (ADR 0018 decision 6). */
  reduceMotion: boolean;
  testID?: string;
}

/**
 * Internal busy indicator (not exported from the package): a ring with flat ends and a gap in
 * one quarter (a 270° arc), drawn inside the box. Always decorative — the owning control
 * exposes the busy state — so it's hidden from assistive technology.
 */
export function Spinner({
  size,
  color,
  strokeWidth,
  radius,
  rotation,
  reduceMotion,
  testID,
}: SpinnerProps) {
  const turn = useRef(new Animated.Value(0)).current;
  const [x1, y1, x2, y2] = rotation.easing;

  useEffect(() => {
    if (reduceMotion || rotation.duration <= 0) {
      turn.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(turn, {
        toValue: 1,
        duration: rotation.duration,
        easing: Easing.bezier(x1, y1, x2, y2),
        isInteraction: false,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      turn.setValue(0);
    };
  }, [turn, reduceMotion, rotation.duration, x1, y1, x2, y2]);

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        transform: [{ rotate: reduceMotion ? '0deg' : rotate }],
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
        />
      </Svg>
    </Animated.View>
  );
}
