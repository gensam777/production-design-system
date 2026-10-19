import { View } from 'react-native';

import { lucideIconMap } from './providers/lucide';
import type { IconName } from './types';

export interface IconProps {
  name: IconName;
  /** Rendered size in dp/pt — the caller passes a resolved `icon.*` token (already font-scaled). */
  size: number;
  color: string;
  testID?: string;
}

/**
 * Internal, decorative-only icon (not exported from the package). Hidden from assistive
 * technology on both platforms: every current consumer slot is decorative (contract
 * `slots.*.decorative: true`) and the owning control carries the accessible name.
 *
 * Stroke scales with size, as lucide-react does on web (ADR 0019 rule 4: 2 at 24 → 1.33 at 16).
 */
export function Icon({ name, size, color, testID }: IconProps) {
  const Glyph = lucideIconMap[name];
  return (
    <View
      testID={testID}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ width: size, height: size }}
    >
      <Glyph size={size} color={color} strokeWidth={2} />
    </View>
  );
}
