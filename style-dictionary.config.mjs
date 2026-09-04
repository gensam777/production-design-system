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
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'html/icon',
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
      transformGroup: 'js',
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
