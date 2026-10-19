import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, PDSThemeProvider, usePDSTheme } from '@pds/react-native';
import type { BrandName } from '@pds/react-native';

import { BrandGallery } from './ButtonGallery';
import { brandFonts } from './fonts';

type Filter = 'both' | BrandName;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'both', label: 'Both brands' },
  { value: 'brand-a', label: 'Brand A' },
  { value: 'brand-b', label: 'Brand B' },
];

function Screen({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { theme, textStyle } = usePDSTheme();
  const [filter, setFilter] = useState<Filter>('both');
  const brands: BrandName[] = filter === 'both' ? ['brand-a', 'brand-b'] : [filter];

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.color.surface.canvas }]}>
      <ScrollView
        contentContainerStyle={{ padding: theme.space.inset.lg, gap: theme.space.stack.xl }}
      >
        <View style={{ gap: theme.space.stack.sm }}>
          <Text
            accessibilityRole="header"
            style={[
              textStyle(theme.typography.heading.lg.bold),
              { color: theme.color.text.primary },
            ]}
          >
            Button
          </Text>
          <Text
            style={[
              textStyle(theme.typography.body.md.regular),
              { color: theme.color.text.secondary },
            ]}
          >
            {`@pds/react-native preview · brand fonts ${fontsLoaded ? 'loaded' : 'loading (system fallback)'}`}
          </Text>
          <View style={[styles.row, { gap: theme.space.inline.sm }]}>
            {FILTERS.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? 'primary' : 'secondary'}
                onPress={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </View>
        </View>
        {brands.map((brand) => (
          <BrandGallery key={brand} brand={brand} fontsLoaded={fontsLoaded} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  // Renders straight away with system fonts, then switches once the brand faces register.
  const [fontsLoaded] = useFonts(brandFonts);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <PDSThemeProvider fontsLoaded={fontsLoaded}>
        <Screen fontsLoaded={fontsLoaded} />
      </PDSThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
});
