import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'storybook-static/**', 'src/tokens/build/**', 'node_modules/**'],
  },
  js.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      // DOM lib globals (HTMLButtonElement, etc.) — needed once a component's public API
      // references DOM types directly, as Button's ButtonHTMLAttributes/ref typing does.
      // Flat config (ESLint 9, used here) dropped the old `env: { browser: true }`
      // shorthand entirely; `globals` is the package ESLint's own docs point to as its
      // replacement (https://eslint.org/docs/latest/use/configure/language-options#predefined-global-variables),
      // and the package's own README says the same for anyone on ESLint 9+. Hand-listing
      // just the specific globals a component happens to use (e.g. `{ HTMLButtonElement:
      // 'readonly' }`) would avoid the dependency, but would need a manual edit here every
      // time a future component references a new DOM type — reintroducing this exact
      // failure one type at a time instead of once.
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Base no-unused-vars doesn't understand TS-only constructs — it misreads a named
      // parameter in a function-type signature (e.g. `onValueChange?: (value: string) =>
      // void` in an interface) as an unused binding, since there's no function body for
      // the parameter to be "used" in. Swap in the TS-aware version, which correctly
      // skips type-only positions; this is the standard pairing for `@typescript-eslint/
      // parser` and doesn't pull in the full typescript-eslint recommended rule set.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];
