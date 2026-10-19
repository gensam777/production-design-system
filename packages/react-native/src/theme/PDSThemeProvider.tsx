import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { defaultBrand, themes } from '@pds/tokens/react-native';
import type { BrandName, TextStyleToken, Theme } from '@pds/tokens/react-native';

import { resolveTextStyle } from './typography';

export interface PDSThemeContextValue {
  /** The active brand. */
  brand: BrandName;
  /** The generated semantic token theme for `brand` (`@pds/tokens/react-native`). */
  theme: Theme;
  /** Whether the brand's font faces are loaded — see `PDSThemeProviderProps.fontsLoaded`. */
  fontsLoaded: boolean;
  /** `theme.typography.*` role → React Native text style, honoring `fontsLoaded`. */
  textStyle: (token: TextStyleToken) => TextStyle;
}

function createValue(brand: BrandName, fontsLoaded: boolean): PDSThemeContextValue {
  const theme = themes[brand];
  return {
    brand,
    theme,
    fontsLoaded,
    textStyle: (token) => resolveTextStyle(theme, token, { fontsLoaded }),
  };
}

// No provider = the default brand with system fonts — the React Native equivalent of web's
// "no data-brand attribute = Brand A" (ADR 0011).
const DEFAULT_VALUE = createValue(defaultBrand, false);

const PDSThemeContext = createContext<PDSThemeContextValue>(DEFAULT_VALUE);

export interface PDSThemeProviderProps {
  /** Brand for everything below. Defaults to the default brand (`brand-a`). */
  brand?: BrandName;
  /**
   * Set to `true` once the app has registered the brand's font faces under their PostScript
   * names (`theme.fonts.sans.faces[].postScriptName`, e.g. with expo-font). Until then text
   * uses the platform system family at the same weights. Defaults to `false`.
   */
  fontsLoaded?: boolean;
  children?: ReactNode;
}

/**
 * Provides the brand theme to @pds/react-native components. Providers nest: a subtree can
 * switch brand (the equivalent of web's `data-brand` on a container). Components read only
 * semantic tokens from it and never know which brand is active.
 */
export function PDSThemeProvider({
  brand = defaultBrand,
  fontsLoaded = false,
  children,
}: PDSThemeProviderProps) {
  const value = useMemo(() => createValue(brand, fontsLoaded), [brand, fontsLoaded]);
  return <PDSThemeContext.Provider value={value}>{children}</PDSThemeContext.Provider>;
}

/** The nearest `PDSThemeProvider`'s brand, theme and text-style helper. */
export function usePDSTheme(): PDSThemeContextValue {
  return useContext(PDSThemeContext);
}
