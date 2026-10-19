import { Platform } from 'react-native';
import type { TextStyle } from 'react-native';
import type { FontFamilyToken, TextStyleToken, Theme } from '@pds/tokens/react-native';

export interface TextStyleOptions {
  /**
   * Whether the brand's font faces are registered with the app under their PostScript names
   * (`theme.fonts.<role>.faces[].postScriptName`). The design system ships no font files
   * (ADR 0016); when they aren't loaded, the platform system family is used with the face's
   * weight, never another brand's family.
   */
  fontsLoaded: boolean;
}

function fontRoleOf(theme: Theme, token: TextStyleToken): FontFamilyToken | undefined {
  return Object.values(theme.fonts).find((role) =>
    role.faces.some((face) => face.postScriptName === token.fontFamily),
  );
}

/**
 * A generated typography role (`theme.typography.*`) as a React Native text style.
 *
 * With brand fonts loaded the face's PostScript name selects the exact weight, so no
 * `fontWeight` is set (Android would otherwise synthesize bold). Without them the role's
 * system fallback family is used together with the face's numeric weight. Sizes are absolute
 * and scale with the OS text size (`allowFontScaling`, on by default).
 */
export function resolveTextStyle(
  theme: Theme,
  token: TextStyleToken,
  { fontsLoaded }: TextStyleOptions,
): TextStyle {
  const base = {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
  };
  if (fontsLoaded) return { ...base, fontFamily: token.fontFamily };

  const role = fontRoleOf(theme, token);
  const face = role?.faces.find((f) => f.postScriptName === token.fontFamily);
  const fallback = role
    ? Platform.select({ ios: role.fallback.ios, android: role.fallback.android })
    : undefined;
  return {
    ...base,
    ...(fallback ? { fontFamily: fallback } : null),
    ...(face ? { fontWeight: String(face.weight) as TextStyle['fontWeight'] } : null),
  };
}
