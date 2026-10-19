import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Whether the OS "Reduce Motion" (iOS) / "Remove animations" (Android) setting is on. Updates
 * live when the user changes it. `false` until the first (asynchronous) read resolves.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => {
        if (active) setReduced(value);
      },
      () => {},
    );
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
