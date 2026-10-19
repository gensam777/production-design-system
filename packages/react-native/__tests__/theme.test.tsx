import fs from 'node:fs';
import path from 'node:path';

import { Platform, Text } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import {
  PDSThemeProvider,
  brandA,
  brandB,
  resolveTextStyle,
  usePDSTheme,
  useReducedMotion,
} from '../src';
import type { IconName } from '../src';
import { Icon } from '../src/icons/Icon';
import { lucideIconMap } from '../src/icons/providers/lucide';

function BrandProbe({ testID }: { testID: string }) {
  const { brand, theme, fontsLoaded } = usePDSTheme();
  return (
    <Text testID={testID}>
      {brand}|{theme === brandA ? 'A' : theme === brandB ? 'B' : '?'}|{String(fontsLoaded)}
    </Text>
  );
}

describe('PDSThemeProvider / usePDSTheme', () => {
  test('without a provider: default brand, system fonts', async () => {
    await render(<BrandProbe testID="probe" />);
    expect(screen.getByTestId('probe')).toHaveTextContent('brand-a|A|false');
  });

  test('providers nest — a subtree can switch brand', async () => {
    await render(
      <PDSThemeProvider brand="brand-a" fontsLoaded>
        <BrandProbe testID="outer" />
        <PDSThemeProvider brand="brand-b">
          <BrandProbe testID="inner" />
        </PDSThemeProvider>
      </PDSThemeProvider>,
    );
    expect(screen.getByTestId('outer')).toHaveTextContent('brand-a|A|true');
    expect(screen.getByTestId('inner')).toHaveTextContent('brand-b|B|false');
  });

  test('textStyle honors the provider font state', async () => {
    const { result } = await renderHook(() => usePDSTheme(), {
      wrapper: ({ children }) => (
        <PDSThemeProvider brand="brand-b" fontsLoaded>
          {children}
        </PDSThemeProvider>
      ),
    });
    expect(result.current.textStyle(brandB.typography.body.md.regular).fontFamily).toBe(
      brandB.typography.body.md.regular.fontFamily,
    );
  });

  test('the context value is stable across re-renders', async () => {
    const { result, rerender } = await renderHook(() => usePDSTheme(), {
      wrapper: ({ children }) => <PDSThemeProvider brand="brand-b">{children}</PDSThemeProvider>,
    });
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
  });
});

describe('resolveTextStyle', () => {
  const token = brandA.typography.label.md.medium;

  test('fonts loaded: PostScript face, absolute metrics, no weight', () => {
    expect(resolveTextStyle(brandA, token, { fontsLoaded: true })).toEqual({
      fontFamily: token.fontFamily,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      letterSpacing: token.letterSpacing,
    });
  });

  test.each([
    ['ios', 'System'],
    ['android', 'sans-serif'],
  ] as const)('fonts not loaded on %s: system family at the face weight', (os, family) => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    const select = jest
      .spyOn(Platform, 'select')
      .mockImplementation(((spec: Record<string, unknown>) => spec[os]) as never);
    try {
      expect(resolveTextStyle(brandA, token, { fontsLoaded: false })).toEqual(
        expect.objectContaining({
          fontFamily: family,
          fontWeight: '500',
          fontSize: token.fontSize,
        }),
      );
      expect(
        resolveTextStyle(brandA, brandA.typography.code.md.regular, { fontsLoaded: false }),
      ).toEqual(
        expect.objectContaining({
          fontFamily: os === 'ios' ? 'Menlo' : 'monospace',
          fontWeight: '400',
        }),
      );
    } finally {
      select.mockRestore();
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });

  test('never falls back to another brand family', () => {
    const style = resolveTextStyle(brandB, brandB.typography.label.md.medium, {
      fontsLoaded: false,
    });
    expect(style.fontFamily).not.toBe(brandA.typography.label.md.medium.fontFamily);
  });
});

describe('useReducedMotion', () => {
  afterEach(() => jest.restoreAllMocks());

  test('reads the OS setting and follows changes', async () => {
    let listener: (enabled: boolean) => void = () => {};
    const remove = jest.fn();
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValueOnce(true);
    jest.mocked(AccessibilityInfo.addEventListener).mockImplementationOnce(((
      _: string,
      cb: never,
    ) => {
      listener = cb;
      return { remove };
    }) as never);

    const { result, unmount } = await renderHook(() => useReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(true);
    await act(async () => listener(false));
    expect(result.current).toBe(false);
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  test('a failed read leaves motion on', async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockRejectedValueOnce(new Error('nope'));
    const { result } = await renderHook(() => useReducedMotion());
    await act(async () => {});
    expect(result.current).toBe(false);
  });
});

describe('icons', () => {
  const catalog = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../../design/icons/icons.json'), 'utf8'),
  ) as { icons: Record<string, { lucide: string }> };

  test('the provider map covers exactly the catalog', () => {
    expect(Object.keys(lucideIconMap).sort()).toEqual(Object.keys(catalog.icons).sort());
  });

  test.each(Object.keys(catalog.icons) as IconName[])(
    '%s renders, hidden from assistive technology',
    async (name) => {
      await render(<Icon name={name} size={20} color={brandA.color.text.primary} testID="icon" />);
      expect(screen.queryByTestId('icon')).toBeNull();
      const icon = screen.getByTestId('icon', { includeHiddenElements: true });
      expect(icon).toHaveProp('importantForAccessibility', 'no-hide-descendants');
      expect(icon.children.length).toBe(1);
    },
  );
});
