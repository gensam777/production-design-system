import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, PDSThemeProvider, usePDSTheme } from '@pds/react-native';
import type { BrandName, ButtonSize, ButtonVariant } from '@pds/react-native';

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'tertiary', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];
const BRAND_LABEL: Record<BrandName, string> = { 'brand-a': 'Brand A', 'brand-b': 'Brand B' };
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Section({
  heading,
  note,
  children,
}: {
  heading: string;
  note?: string;
  children: ReactNode;
}) {
  const { theme, textStyle } = usePDSTheme();
  return (
    <View style={{ gap: theme.space.stack.sm }}>
      <Text
        accessibilityRole="header"
        style={[
          textStyle(theme.typography.heading.sm.semibold),
          { color: theme.color.text.primary },
        ]}
      >
        {heading}
      </Text>
      {note ? (
        <Text
          style={[
            textStyle(theme.typography.body.sm.regular),
            { color: theme.color.text.secondary },
          ]}
        >
          {note}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  const { theme } = usePDSTheme();
  return (
    <View style={[styles.row, { gap: theme.space.inline.sm, rowGap: theme.space.stack.sm }]}>
      {children}
    </View>
  );
}

/** Pressing starts a 2 s pending action — the button shows `loading` and ignores presses. */
function PendingActionDemo({ variant }: { variant: ButtonVariant }) {
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Button
      variant={variant}
      loading={pending}
      trailingIcon="arrow-right"
      accessibilityHint="Simulates a request that takes two seconds"
      onPress={() => {
        setCount((c) => c + 1);
        setPending(true);
        timer.current = setTimeout(() => setPending(false), 2000);
      }}
    >
      {count ? `Submitted ${count}×` : 'Submit'}
    </Button>
  );
}

function Gallery() {
  const { brand, theme, textStyle } = usePDSTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.color.surface.default,
          borderColor: theme.color.border.subtle,
          borderRadius: theme.radius.container,
          padding: theme.space.inset.lg,
          gap: theme.space.stack.xl,
        },
        theme.elevation.raised,
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[textStyle(theme.typography.heading.md.bold), { color: theme.color.text.primary }]}
      >
        {BRAND_LABEL[brand]}
      </Text>

      <Section heading="Variants" note="Default size (md).">
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {title(variant)}
            </Button>
          ))}
        </Row>
      </Section>

      <Section
        heading="Sizes"
        note="Minimum heights 32 / 40 / 48; touch targets expand to 44pt / 48dp."
      >
        {VARIANTS.map((variant) => (
          <Row key={variant}>
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {`${title(variant)} ${size}`}
              </Button>
            ))}
          </Row>
        ))}
      </Section>

      <Section
        heading="Icons"
        note="Leading, trailing and both — icon-side padding drops one step."
      >
        {SIZES.map((size) => (
          <Row key={size}>
            <Button size={size} leadingIcon="plus">
              Add item
            </Button>
            <Button size={size} variant="secondary" trailingIcon="arrow-right">
              Continue
            </Button>
            <Button size={size} variant="tertiary" leadingIcon="edit" trailingIcon="chevron-down">
              Edit
            </Button>
            <Button size={size} variant="danger" leadingIcon="trash">
              Delete
            </Button>
          </Row>
        ))}
      </Section>

      <Section
        heading="Loading"
        note="Busy, not disabled: variant colors kept, size preserved, presses ignored."
      >
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} loading leadingIcon="check">
              {title(variant)}
            </Button>
          ))}
        </Row>
        <Row>
          {SIZES.map((size) => (
            <Button key={size} size={size} loading>
              {`Loading ${size}`}
            </Button>
          ))}
        </Row>
        <Row>
          <PendingActionDemo variant="primary" />
          <PendingActionDemo variant="secondary" />
        </Row>
      </Section>

      <Section heading="Disabled">
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled leadingIcon="plus">
              {title(variant)}
            </Button>
          ))}
        </Row>
      </Section>

      <Section
        heading="Disabled + loading"
        note="Disabled wins: label visible, no spinner, not busy."
      >
        <Row>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled loading>
              {title(variant)}
            </Button>
          ))}
        </Row>
      </Section>

      <Section
        heading="Long and wrapping labels"
        note="Labels wrap instead of clipping or truncating; try a larger system text size."
      >
        <View style={{ maxWidth: 220, gap: theme.space.stack.sm }}>
          <Button leadingIcon="check" trailingIcon="arrow-right">
            Confirm and continue to the payment details step
          </Button>
          <Button variant="secondary" size="sm">
            A small secondary action whose label is long enough to wrap
          </Button>
        </View>
        <Button variant="tertiary" size="lg" style={{ alignSelf: 'stretch' }}>
          Full-width tertiary action laid out by its parent
        </Button>
      </Section>
    </View>
  );
}

export function BrandGallery({ brand, fontsLoaded }: { brand: BrandName; fontsLoaded: boolean }) {
  return (
    <PDSThemeProvider brand={brand} fontsLoaded={fontsLoaded}>
      <Gallery />
    </PDSThemeProvider>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
