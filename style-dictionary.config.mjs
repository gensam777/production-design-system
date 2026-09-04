import StyleDictionary from 'style-dictionary';

/**
 * The built-in `css/variables` format collapses a DTCG composite `typography` token into
 * a single CSS `font` shorthand value. CSS's `font` shorthand has no slot for
 * letter-spacing, so that property is silently dropped — unacceptable here since the
 * heading roles rely on it. This format instead expands each typography token into one
 * longhand custom property per sub-value (font-family, font-size, font-weight,
 * line-height, letter-spacing), so nothing is lost.
 */
StyleDictionary.registerFormat({
  name: 'css/typography-expanded',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens.flatMap((token) => {
      const value = token.value ?? token.$value;
      const join = (v) => (Array.isArray(v) ? v.join(', ') : v);
      const props = [
        ['font-family', join(value.fontFamily)],
        ['font-size', value.fontSize],
        ['font-weight', value.fontWeight],
        ['line-height', value.lineHeight],
        ['letter-spacing', value.letterSpacing],
      ];
      return props.map(([suffix, v], i) => {
        const comment = i === 0 && token.$description ? ` /** ${token.$description} */` : '';
        return `  --${token.name}-${suffix}: ${v};${comment}`;
      });
    });
    return `/**\n * Do not edit directly, this file was auto-generated.\n */\n\n:root {\n${lines.join('\n')}\n}\n`;
  },
});

/**
 * The built-in 'size/rem' transform does NOT scale a bare number by the base font size —
 * it only appends a unit (or preserves one already present). That's why typography's font
 * sizes are pre-converted to rem strings ("1rem") directly in source: 'size/rem' just
 * passes an already-unitted value through unchanged. Spacing keeps px numbers in source
 * (per governance/decisions/0004-spacing-token-architecture.md — Figma and code must
 * stay pixel-aligned), so it needs an actual px→rem transform for CSS output. This runs
 * before 'size/rem' in the platform's transform list: it converts bare-number dimension
 * tokens (checked against `token.original.$value`, the pristine pre-transform source) to
 * a "Nrem" string; 'size/rem' then sees an already-unitted value and passes it through
 * unchanged, same as it does for typography. Typography tokens are untouched by this —
 * their source values are already strings, never bare numbers.
 */
StyleDictionary.registerTransform({
  name: 'size/px-to-rem',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'dimension' && typeof token.original.$value === 'number',
  transform: (token, config) => {
    const base = (config && config.basePxFontSize) || 16;
    const px = token.original.$value;
    return px === 0 ? '0' : `${px / base}rem`;
  },
});

/**
 * Style Dictionary config.
 *
 * Source of truth for token *values* is this directory (src/tokens/primitive, src/tokens/semantic).
 * Figma mirrors these values for design intent; this pipeline is what actually ships.
 *
 * Output in src/tokens/build/ is generated — never hand-edit it.
 */
export default {
  source: ['src/tokens/primitive/**/*.json', 'src/tokens/semantic/**/*.json'],
  platforms: {
    css: {
      // Same as the built-in 'css' transformGroup, minus 'typography/css/shorthand' —
      // that transform collapses composite typography tokens into a CSS `font` shorthand
      // string (dropping letter-spacing) before any per-file `filter` runs, which would
      // corrupt the value our custom 'css/typography-expanded' format depends on.
      // 'size/px-to-rem' (custom, see above) runs before the built-in 'size/rem' so bare
      // px-number spacing tokens are actually scaled, not just unit-suffixed.
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'html/icon',
        'size/px-to-rem',
        'size/rem',
        'color/css',
        'asset/url',
        'fontFamily/css',
        'cubicBezier/css',
        'strokeStyle/css/shorthand',
        'border/css/shorthand',
        'transition/css/shorthand',
        'shadow/css/shorthand',
      ],
      buildPath: 'src/tokens/build/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          filter: (token) => token.$type !== 'typography',
        },
        {
          destination: 'typography.css',
          format: 'css/typography-expanded',
          filter: (token) => token.$type === 'typography',
        },
      ],
    },
    js: {
      // Same as the built-in 'js' transformGroup, minus 'size/rem'. That transform
      // appends a "rem" unit to any bare-number dimension token without scaling it —
      // harmless for typography (already pre-formatted rem strings in source, so it's a
      // no-op pass-through) but would corrupt spacing's raw px numbers (e.g. 4 -> "4rem").
      // JS/TS output keeps spacing as plain px numbers on purpose — only the CSS platform
      // converts to rem (see 'size/px-to-rem' above). See
      // governance/decisions/0004-spacing-token-architecture.md.
      transforms: ['attribute/cti', 'name/pascal', 'color/hex'],
      buildPath: 'src/tokens/build/js/',
      files: [
        {
          destination: 'tokens.js',
          format: 'javascript/es6',
        },
      ],
    },
  },
};
