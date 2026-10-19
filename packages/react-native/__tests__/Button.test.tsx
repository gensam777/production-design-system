import { createRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  processColor,
} from 'react-native';
import type { HostInstance } from 'react-native';
import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import { Button, PDSThemeProvider, brandA, brandB } from '../src';
import type { ButtonProps } from '../src';
import { touchTargetSlop } from '../src/components/Button/Button';

const LABEL = 'Save changes';

function renderButton(props: Partial<ButtonProps> = {}, brand?: 'brand-a' | 'brand-b') {
  return render(
    <PDSThemeProvider brand={brand}>
      <Button testID="button" {...props}>
        {props.children ?? LABEL}
      </Button>
    </PDSThemeProvider>,
  );
}

const button = () => screen.getByRole('button', { name: LABEL });
const flat = (el: { props: { style?: unknown } }) =>
  StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;
/** The painted container is the pressable itself (one box — see 'layout' below). */
const containerOf = () => screen.getByTestId('button');
const hidden = { includeHiddenElements: true } as const;
/** Animated colors settle as rgba() strings; compare colors by their native value. */
const sameColor = (actual: unknown, expected: string) =>
  expect(processColor(actual as string)).toBe(processColor(expected));
/** The jest environment's OS font scale (React Native's Dimensions mock). */
const fontScale = () => Dimensions.get('window').fontScale;

// Fake timers for the whole suite: the spinner loop and the motion.micro color transition
// otherwise tick on real frames after a test's last assertion.
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});
const press = (el: Parameters<ReturnType<typeof userEvent.setup>['press']>[0]) =>
  userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).press(el);

describe('accessibility', () => {
  test('is a button named by its label', async () => {
    await renderButton({ accessibilityHint: 'Saves your profile' });
    expect(button()).toHaveAccessibleName(LABEL);
    expect(button()).toHaveProp('accessibilityHint', 'Saves your profile');
    expect(button()).not.toBeDisabled();
    expect(button()).not.toBeBusy();
  });

  test('icons and spinner are hidden from assistive technology and never join the name', async () => {
    await renderButton({ leadingIcon: 'plus', trailingIcon: 'arrow-right', loading: true });
    for (const part of ['leadingIcon', 'trailingIcon', 'spinner']) {
      expect(screen.queryByTestId(`button.${part}`)).toBeNull();
      const el = screen.getByTestId(`button.${part}`, hidden);
      expect(el).toHaveProp('accessibilityElementsHidden', true);
      expect(el).toHaveProp('importantForAccessibility', 'no-hide-descendants');
    }
    expect(button()).toHaveAccessibleName(LABEL);
  });

  test('forwards testID and ref to the pressable view', async () => {
    const ref = createRef<HostInstance>();
    await render(
      <Button ref={ref} testID="save">
        {LABEL}
      </Button>,
    );
    expect(screen.getByTestId('save')).toBe(button());
    expect(ref.current).not.toBeNull();
  });
});

describe('activation', () => {
  test('onPress runs on press', async () => {
    const onPress = jest.fn();
    await renderButton({ onPress });
    await press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('disabled blocks onPress and is reported disabled', async () => {
    const onPress = jest.fn();
    await renderButton({ onPress, disabled: true });
    await press(button());
    await fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button()).toBeDisabled();
  });
});

describe('loading', () => {
  test('is busy, not disabled, keeps its name and announces the loading value', async () => {
    await renderButton({ loading: true });
    expect(button()).toBeBusy();
    expect(button()).not.toBeDisabled();
    expect(button()).toHaveAccessibleName(LABEL);
    expect(button()).toHaveAccessibilityValue({ text: 'Loading' });
  });

  test('loading value text is localizable', async () => {
    await renderButton({ loading: true, loadingAccessibilityValue: 'Cargando' });
    expect(button()).toHaveAccessibilityValue({ text: 'Cargando' });
  });

  test('blocks onPress (pointer and screen-reader activation)', async () => {
    const onPress = jest.fn();
    await renderButton({ onPress, loading: true });
    await press(button());
    await fireEvent.press(button());
    await fireEvent(button(), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    expect(onPress).not.toHaveBeenCalled();
  });

  test('shows only the spinner; label and icons keep their space but are invisible', async () => {
    await renderButton({ loading: true, leadingIcon: 'plus', trailingIcon: 'check' });
    expect(screen.getByTestId('button.spinner', hidden)).toBeTruthy();
    const label = screen.getByTestId('button.label', hidden);
    expect(label).toHaveTextContent(LABEL);
    expect(flat(label).opacity).toBe(0);
    for (const part of ['leadingIcon', 'trailingIcon']) {
      const wrapper = screen.getByTestId(`button.${part}`, hidden).parent!;
      expect(flat(wrapper as never).opacity).toBe(0);
    }
  });

  test('keeps the variant colors (never the disabled colors)', async () => {
    await renderButton({ loading: true, variant: 'primary' });
    expect(flat(containerOf()).backgroundColor).toBe(brandA.color.action.primary.default);
    expect(flat(screen.getByTestId('button.label', hidden)).color).toBe(
      brandA.color.action.primary.onColor,
    );
  });

  test('pressing while loading shows no pressed visual', async () => {
    await renderButton({ loading: true });
    await fireEvent(button(), 'pressIn');
    expect(flat(containerOf()).backgroundColor).toBe(brandA.color.action.primary.default);
  });

  test('stopping loading restores the label', async () => {
    const { rerender } = await renderButton({ loading: true });
    await rerender(
      <PDSThemeProvider>
        <Button testID="button">{LABEL}</Button>
      </PDSThemeProvider>,
    );
    expect(screen.queryByTestId('button.spinner', hidden)).toBeNull();
    expect(flat(screen.getByTestId('button.label')).opacity).toBe(1);
    expect(button()).not.toBeBusy();
  });
});

describe('disabled + loading: disabled wins', () => {
  test('disabled, not busy, label visible, no spinner, no value, cannot activate', async () => {
    const onPress = jest.fn();
    await renderButton({ disabled: true, loading: true, onPress });
    expect(button()).toBeDisabled();
    expect(button()).not.toBeBusy();
    expect(button().props.accessibilityValue?.text).toBeUndefined();
    expect(screen.queryByTestId('button.spinner', hidden)).toBeNull();
    expect(flat(screen.getByTestId('button.label', hidden)).opacity).toBe(1);
    expect(flat(containerOf()).backgroundColor).toBe(brandA.color.action.primary.disabled);
    expect(flat(screen.getByTestId('button.label', hidden)).color).toBe(brandA.color.text.disabled);
    await press(button());
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('token mapping in the rendered output', () => {
  test.each([
    [
      'primary',
      brandA.color.action.primary.default,
      'transparent',
      brandA.color.action.primary.onColor,
    ],
    [
      'secondary',
      brandA.color.action.secondary.default,
      brandA.color.border.default,
      brandA.color.text.primary,
    ],
    ['tertiary', 'transparent', 'transparent', brandA.color.text.primary],
    [
      'danger',
      brandA.color.action.danger.default,
      'transparent',
      brandA.color.action.danger.onColor,
    ],
  ] as const)('%s colors', async (variant, background, border, label) => {
    await renderButton({ variant });
    const style = flat(containerOf());
    expect(style.backgroundColor).toBe(background);
    expect(style.borderColor).toBe(border);
    expect(style.borderWidth).toBe(1);
    expect(flat(screen.getByTestId('button.label')).color).toBe(label);
  });

  test.each([
    ['secondary', brandA.color.action.secondary.default, brandA.color.border.default],
    ['tertiary', 'transparent', 'transparent'],
    ['danger', brandA.color.action.danger.disabled, 'transparent'],
  ] as const)(
    'disabled %s: outline/ghost keep the container, filled variants go neutral',
    async (variant, background, border) => {
      await renderButton({ variant, disabled: true });
      const style = flat(containerOf());
      expect(style.backgroundColor).toBe(background);
      expect(style.borderColor).toBe(border);
      expect(flat(screen.getByTestId('button.label')).color).toBe(brandA.color.text.disabled);
    },
  );

  test.each([
    ['sm', 32, brandA.space.inset.xs, brandA.space.inset.md, brandA.typography.label.sm.medium],
    ['md', 40, brandA.space.inset.sm, brandA.space.inset.lg, brandA.typography.label.md.medium],
    ['lg', 48, brandA.space.inset.sm, brandA.space.inset.xl, brandA.typography.label.lg.medium],
  ] as const)(
    '%s size: minimum height, padding, typography',
    async (size, minHeight, block, inline, type) => {
      await renderButton({ size });
      const style = flat(containerOf());
      expect(style).toEqual(
        expect.objectContaining({
          minHeight,
          paddingVertical: block,
          paddingStart: inline,
          paddingEnd: inline,
          borderRadius: brandA.radius.control,
        }),
      );
      expect(style.height).toBeUndefined();
      expect(flat(screen.getByTestId('button.label'))).toEqual(
        expect.objectContaining({ fontSize: type.fontSize, lineHeight: type.lineHeight }),
      );
    },
  );

  test('icon presence reduces that side by one inset step and sets the icon size', async () => {
    await renderButton({ size: 'md', leadingIcon: 'plus' });
    const style = flat(containerOf());
    expect(style.paddingStart).toBe(brandA.space.inset.md);
    expect(style.paddingEnd).toBe(brandA.space.inset.lg);
    expect(style.columnGap).toBe(brandA.space.inline.sm);
    expect(flat(screen.getByTestId('button.leadingIcon', hidden))).toEqual(
      expect.objectContaining({
        width: Math.round(brandA.icon.md * fontScale()),
        height: Math.round(brandA.icon.md * fontScale()),
      }),
    );
  });

  test('Brand B paints with Brand B tokens', async () => {
    await renderButton({}, 'brand-b');
    expect(flat(containerOf()).backgroundColor).toBe(brandB.color.action.primary.default);
    expect(flat(containerOf()).borderRadius).toBe(brandB.radius.control);
  });

  test('pressed uses the pressed cell', async () => {
    await renderButton({ variant: 'danger' });
    await fireEvent(button(), 'pressIn');
    await act(() => jest.advanceTimersByTime(brandA.motion.micro.duration + 50));
    sameColor(flat(containerOf()).backgroundColor, brandA.color.action.danger.hover);
  });

  test('state changes snap when Reduce Motion is on', async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValueOnce(true);
    await renderButton({ variant: 'danger' });
    await act(async () => {});
    await fireEvent(button(), 'pressIn');
    expect(flat(containerOf()).backgroundColor).toBe(brandA.color.action.danger.hover);
  });
});

describe('text scaling', () => {
  test('the label can scale and wrap: no line limit, no fixed height, shrinks within the row', async () => {
    await renderButton({ children: 'A much longer action label that will have to wrap' });
    const label = screen.getByTestId('button.label');
    expect(label.props.numberOfLines).toBeUndefined();
    expect(label.props.allowFontScaling).not.toBe(false);
    expect(label.props.maxFontSizeMultiplier).toBeUndefined();
    expect(flat(label)).toEqual(expect.objectContaining({ flexShrink: 1, textAlign: 'center' }));
    expect(flat(containerOf()).height).toBeUndefined();
  });

  test('iOS label carries the Dynamic Type anchor of its role', async () => {
    await renderButton({ size: 'lg' });
    expect(screen.getByTestId('button.label').props.dynamicTypeRamp).toBe(
      brandA.dynamicTypeRamp.label.lg,
    );
  });

  test('icons and the spinner scale with the OS font scale', async () => {
    const dims = jest.requireActual('react-native').Dimensions;
    jest
      .spyOn(dims, 'get')
      .mockImplementation(() => ({ width: 390, height: 844, scale: 3, fontScale: 1.5 }));
    await renderButton({ leadingIcon: 'plus', size: 'md' });
    expect(flat(screen.getByTestId('button.leadingIcon', hidden)).width).toBe(
      Math.round(brandA.icon.md * 1.5),
    );
  });
});

describe('touch target', () => {
  test('slop math: iOS 44pt → sm/md/lg 6/2/0, Android 48dp → 8/4/0', () => {
    expect([32, 40, 48].map((h) => touchTargetSlop(100, h, 44).top)).toEqual([6, 2, 0]);
    expect([32, 40, 48].map((h) => touchTargetSlop(100, h, 48).top)).toEqual([8, 4, 0]);
    expect(touchTargetSlop(36, 32, 44)).toEqual({ top: 6, bottom: 6, left: 4, right: 4 });
    // Grown by text scaling past the minimum → no extra slop.
    expect(touchTargetSlop(200, 60, 44)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
  });

  test('applies the host-platform minimum from the measured size without changing the visual size', async () => {
    await renderButton({ size: 'sm' });
    const min = Platform.OS === 'android' ? 48 : 44;
    await fireEvent(button(), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 30, height: 32 } },
    });
    expect(button().props.hitSlop).toEqual(touchTargetSlop(30, 32, min));
    expect(button().props.hitSlop.top).toBe((min - 32) / 2);
    expect(flat(containerOf()).minHeight).toBe(32);
  });
});

describe('layout (regression: inflated buttons in wrapping rows on iOS)', () => {
  test('one box: the pressable is the painted container, with no wrapper below it', async () => {
    await renderButton({ leadingIcon: 'plus' });
    const style = flat(button());
    expect(style.backgroundColor).toBe(brandA.color.action.primary.default);
    expect(style.minHeight).toBe(40);
    // Direct children are the content (icon wrapper, label), not a painted inner view.
    expect(screen.getByTestId('button.label').parent).toBe(button());
  });

  test.each(['sm', 'md', 'lg'] as const)(
    '%s never grows or stretches on its own: no flex, flexGrow, flexBasis, alignSelf or height',
    async (size) => {
      await renderButton({ size });
      const style = flat(button());
      for (const key of ['flex', 'flexGrow', 'flexBasis', 'alignSelf', 'height'])
        expect(style[key]).toBeUndefined();
      expect(style.minHeight).toBe({ sm: 32, md: 40, lg: 48 }[size]);
    },
  );

  test('consumer layout keys still apply (explicit flex / alignSelf)', async () => {
    await renderButton({ style: { flex: 1, alignSelf: 'stretch' } });
    expect(flat(button())).toEqual(expect.objectContaining({ flex: 1, alignSelf: 'stretch' }));
  });
});

describe('restricted style', () => {
  test('passes layout keys through and drops visual ones (with a dev warning)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderButton({
      style: { marginTop: 8, alignSelf: 'stretch', backgroundColor: 'red', padding: 40 } as never,
    });
    const style = flat(button());
    expect(style).toEqual(expect.objectContaining({ marginTop: 8, alignSelf: 'stretch' }));
    expect(style.backgroundColor).toBe(brandA.color.action.primary.default);
    expect(style.paddingVertical).toBe(brandA.space.inset.sm);
    expect(style.padding).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('backgroundColor, padding'));
  });
});

describe('reduced motion', () => {
  test('the spinner does not rotate when Reduce Motion is on; busy is still exposed', async () => {
    jest.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValueOnce(true);
    const loop = jest.spyOn(Animated, 'loop');
    await renderButton({ loading: true });
    await act(async () => {});
    loop.mockClear();
    await act(async () => {});
    expect(loop).not.toHaveBeenCalled();
    expect(flat(screen.getByTestId('button.spinner', hidden)).transform).toEqual([
      { rotate: '0deg' },
    ]);
    expect(button()).toBeBusy();
  });

  test('the spinner rotates one turn per motion.spinner otherwise', async () => {
    const timing = jest.spyOn(Animated, 'timing');
    const loop = jest.spyOn(Animated, 'loop');
    await renderButton({ loading: true });
    await act(async () => {});
    expect(loop).toHaveBeenCalled();
    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ toValue: 1, duration: brandA.motion.spinner.duration }),
    );
  });

  test('Reduce Motion turning on while loading stops the rotation', async () => {
    let listener: (enabled: boolean) => void = () => {};
    jest.mocked(AccessibilityInfo.addEventListener).mockImplementationOnce(((
      _: string,
      cb: never,
    ) => {
      listener = cb;
      return { remove: jest.fn() };
    }) as never);
    await renderButton({ loading: true });
    await act(async () => listener(true));
    expect(flat(screen.getByTestId('button.spinner', hidden)).transform).toEqual([
      { rotate: '0deg' },
    ]);
  });
});

describe('fonts', () => {
  test('without brand fonts the label uses the system family at the face weight', async () => {
    await renderButton();
    const style = flat(screen.getByTestId('button.label'));
    expect(style.fontFamily).toBe(Platform.OS === 'android' ? 'sans-serif' : 'System');
    expect(style.fontWeight).toBe('500');
  });

  test('with brand fonts loaded the PostScript face is used without a weight', async () => {
    await render(
      <PDSThemeProvider brand="brand-b" fontsLoaded>
        <Button testID="button">{LABEL}</Button>
      </PDSThemeProvider>,
    );
    const style = flat(screen.getByTestId('button.label'));
    expect(style.fontFamily).toBe(brandB.typography.label.md.medium.fontFamily);
    expect(style.fontWeight).toBeUndefined();
  });
});

test('renders without a provider (default brand)', async () => {
  await render(<Button testID="button">{LABEL}</Button>);
  expect(flat(containerOf()).backgroundColor).toBe(brandA.color.action.primary.default);
});
