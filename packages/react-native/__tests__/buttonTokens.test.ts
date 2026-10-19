// Button ↔ contract parity (design/contracts/components/button.contract.yaml): the token
// bindings, the component constants and the resolution of every bound token in every brand.
import fs from 'node:fs';
import path from 'node:path';

import { parse } from 'yaml';
import { brandA, brandB, themes } from '@pds/tokens/react-native';
import type { BrandName, Theme } from '@pds/tokens/react-native';

import { buttonConstants, buttonTokens } from '../src/components/Button/Button.tokens';
import {
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  buttonVisualState,
  getButtonTheme,
} from '../src/components/Button/buttonTheme';
import { resolveTokenPath, themePath } from '../src/theme/tokenPath';

const CONTRACT = path.resolve(
  __dirname,
  '../../../design/contracts/components/button.contract.yaml',
);
const contract = parse(fs.readFileSync(CONTRACT, 'utf8'));
const BRANDS = Object.keys(themes) as BrandName[];

/** Every leaf of a token tree as [selector path, contract token path]. */
function leaves(node: unknown, at: string[] = []): [string, string][] {
  if (typeof node === 'string') return [[at.join('.'), node]];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...at, k]));
}

describe('contract token bindings', () => {
  test('Button.tokens.ts equals the contract tokens section exactly', () => {
    expect(buttonTokens).toEqual(contract.tokens);
  });

  test('both brands are covered', () => {
    expect(BRANDS.sort()).toEqual(['brand-a', 'brand-b']);
  });

  const paths = [...new Set(leaves(contract.tokens).map(([, p]) => p))].filter((p) => p !== 'none');

  describe.each(BRANDS)('%s', (brand) => {
    const theme = themes[brand];
    test.each(paths)('%s resolves', (tokenPath) => {
      const value = resolveTokenPath(theme, tokenPath);
      if (tokenPath.startsWith('color.')) expect(value).toMatch(/^#[0-9A-F]{6}([0-9A-F]{2})?$/);
      else if (/^(space|radius|icon)\./.test(tokenPath)) expect(typeof value).toBe('number');
      else if (tokenPath.startsWith('text.'))
        expect(value).toEqual(
          expect.objectContaining({ fontFamily: expect.any(String), fontSize: expect.any(Number) }),
        );
      else if (tokenPath.startsWith('motion.'))
        expect(value).toEqual(
          expect.objectContaining({ duration: expect.any(Number), easing: expect.any(Array) }),
        );
      else throw new Error(`unexpected token category: ${tokenPath}`);
    });

    test('every label size has an iOS Dynamic Type anchor', () => {
      for (const size of BUTTON_SIZES)
        expect(getButtonTheme(theme).sizes[size].dynamicTypeRamp).toEqual(
          theme.dynamicTypeRamp.label[size],
        );
    });
  });

  test('path mapping follows the native token naming', () => {
    expect(themePath('color.action.primary.on-color')).toEqual([
      'color',
      'action',
      'primary',
      'onColor',
    ]);
    expect(themePath('text.label.md.medium')).toEqual(['typography', 'label', 'md', 'medium']);
    expect(themePath('color.focus.ring-offset')).toEqual(['color', 'focus', 'ringOffset']);
    expect(themePath('space.inset.2xl')).toEqual(['space', 'inset', 'xl2']);
    expect(() => resolveTokenPath(brandA, 'color.action.nope')).toThrow(/does not exist/);
  });
});

describe('contract constants and sizing', () => {
  const constants = contract['component-constants'];
  test('border and spinner stroke widths', () => {
    expect(buttonConstants.borderWidth).toBe(constants['border-width'].value);
    expect(buttonConstants.spinnerStrokeWidth).toBe(constants['spinner-stroke-width'].value);
  });
  test('visual heights are minimums', () => {
    expect(contract.sizing.height).toBe('minimum');
    expect(buttonConstants.visualHeight).toEqual(contract.sizing['visual-height']);
  });
  test('React Native hit target follows the host platform (44pt iOS / 48dp Android)', () => {
    expect(contract.sizing['hit-target'].minimum['react-native']).toMatch(
      /44pt on iOS \/ 48dp on Android/,
    );
  });
  test('enums match the contract', () => {
    expect([...BUTTON_VARIANTS].sort()).toEqual(
      Object.keys(contract.properties.variant.values).sort(),
    );
    expect([...BUTTON_SIZES].sort()).toEqual(Object.keys(contract.properties.size.values).sort());
  });
});

describe('resolved Button theme', () => {
  const cell = (theme: Theme) => getButtonTheme(theme).colors;

  test('resolves once per theme', () => {
    expect(getButtonTheme(brandA)).toBe(getButtonTheme(brandA));
  });

  test.each([
    [
      'primary',
      'default',
      brandA.color.action.primary.default,
      null,
      brandA.color.action.primary.onColor,
    ],
    [
      'primary',
      'pressed',
      brandA.color.action.primary.active,
      null,
      brandA.color.action.primary.onColor,
    ],
    ['primary', 'disabled', brandA.color.action.primary.disabled, null, brandA.color.text.disabled],
    [
      'secondary',
      'default',
      brandA.color.action.secondary.default,
      brandA.color.border.default,
      brandA.color.text.primary,
    ],
    [
      'secondary',
      'disabled',
      brandA.color.action.secondary.default,
      brandA.color.border.default,
      brandA.color.text.disabled,
    ],
    ['tertiary', 'default', null, null, brandA.color.text.primary],
    ['tertiary', 'hover', brandA.color.action.tertiary.hover, null, brandA.color.text.primary],
    ['tertiary', 'disabled', null, null, brandA.color.text.disabled],
    [
      'danger',
      'pressed',
      brandA.color.action.danger.hover,
      null,
      brandA.color.action.danger.onColor,
    ],
    ['danger', 'disabled', brandA.color.action.danger.disabled, null, brandA.color.text.disabled],
  ] as const)('%s / %s', (variant, state, background, border, foreground) => {
    expect(cell(brandA)[variant][state]).toEqual({ background, border, foreground });
  });

  test('brand-dependent tokens differ between brands, shared ones do not', () => {
    expect(cell(brandA).primary.default.background).not.toBe(
      cell(brandB).primary.default.background,
    );
    expect(getButtonTheme(brandA).radius).toBe(brandA.radius.control);
    expect(getButtonTheme(brandB).radius).toBe(brandB.radius.control);
    expect(getButtonTheme(brandA).sizes.md.typography.fontFamily).toBe(
      brandA.typography.label.md.medium.fontFamily,
    );
    expect(getButtonTheme(brandB).sizes.md.typography.fontFamily).toBe(
      brandB.typography.label.md.medium.fontFamily,
    );
    expect(cell(brandA).danger).toEqual(cell(brandB).danger);
  });

  test('sizes resolve padding, gap, icon and spinner sizes', () => {
    const { sizes } = getButtonTheme(brandA);
    expect(sizes.sm).toEqual(
      expect.objectContaining({
        minHeight: 32,
        paddingBlock: brandA.space.inset.xs,
        paddingInline: brandA.space.inset.md,
        paddingInlineIconSide: brandA.space.inset.sm,
        gap: brandA.space.inline.xs,
        iconSize: brandA.icon.sm,
        spinnerSize: brandA.icon.sm,
      }),
    );
    expect(sizes.lg).toEqual(
      expect.objectContaining({
        minHeight: 48,
        paddingInline: brandA.space.inset.xl,
        paddingInlineIconSide: brandA.space.inset.lg,
        iconSize: brandA.icon.lg,
      }),
    );
  });

  test('spinner and motion tokens', () => {
    const t = getButtonTheme(brandA);
    expect(t.spinnerColor).toEqual({
      primary: brandA.color.action.primary.onColor,
      secondary: brandA.color.text.primary,
      tertiary: brandA.color.text.primary,
      danger: brandA.color.action.danger.onColor,
    });
    expect(t.spinnerRotation).toBe(brandA.motion.spinner);
    expect(t.stateTransition).toBe(brandA.motion.micro);
    expect(t.spinnerRadius).toBe(brandA.radius.full);
  });
});

describe('state precedence (disabled > loading > default)', () => {
  const base = { disabled: false, loading: false, pressed: false, hovered: false };
  test.each([
    [{}, 'default'],
    [{ hovered: true }, 'hover'],
    [{ pressed: true, hovered: true }, 'pressed'],
    [{ loading: true, pressed: true, hovered: true }, 'default'],
    [{ disabled: true, loading: true, pressed: true }, 'disabled'],
    [{ disabled: true }, 'disabled'],
  ] as const)('%j → %s', (over, expected) => {
    expect(buttonVisualState({ ...base, ...over })).toBe(expected);
  });
});
