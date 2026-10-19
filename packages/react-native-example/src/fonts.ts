// Brand font registration for the preview. @pds/react-native ships no font files (ADR 0016):
// the app registers each brand's faces under the PostScript names the theme uses
// (theme.fonts.sans.faces[].postScriptName) and then tells PDSThemeProvider `fontsLoaded`.
// The face list comes from the generated themes, so it can't drift from the tokens.
import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { themes } from '@pds/react-native';

type FontSource = number;

const files: Record<string, Record<number, FontSource>> = {
  Inter: {
    400: Inter_400Regular,
    500: Inter_500Medium,
    600: Inter_600SemiBold,
    700: Inter_700Bold,
  },
  Figtree: {
    400: Figtree_400Regular,
    500: Figtree_500Medium,
    600: Figtree_600SemiBold,
    700: Figtree_700Bold,
  },
};

/** PostScript name → font file, for every brand's sans faces (expo-font `useFonts` map). */
export const brandFonts: Record<string, FontSource> = Object.fromEntries(
  Object.values(themes).flatMap(({ fonts: { sans } }) =>
    sans.faces.map((face) => {
      const file = files[sans.family]?.[face.weight];
      if (file == null) throw new Error(`No preview font file for ${sans.family} ${face.weight}`);
      return [face.postScriptName, file];
    }),
  ),
);
