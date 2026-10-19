// Unit tests (Jest + React Native Testing Library). Run: npm run test -w @pds/react-native
const path = require('node:path');

// Resolve the package root through its main entry (dist/cjs/lucide-react-native.js) — the
// package's `exports` don't expose package.json.
const lucide = path.resolve(path.dirname(require.resolve('lucide-react-native')), '../..');

module.exports = {
  preset: '@react-native/jest-preset',
  rootDir: __dirname,
  roots: ['<rootDir>/__tests__'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-svg|lucide-react-native)/)',
  ],
  moduleNameMapper: {
    // The React Native Jest resolver ignores package `exports`, so map the per-icon subpath
    // imports (src/icons/providers/lucide.ts) to their CommonJS builds.
    '^lucide-react-native/icons/(.*)$': `${lucide}/dist/cjs/icons/$1.js`,
    // The resolver prefers `browser` builds; the contract-parity test reads YAML under Node.
    '^yaml$': require.resolve('yaml'),
  },
};
