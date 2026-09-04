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
      transformGroup: 'css',
      buildPath: 'src/tokens/build/css/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
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
