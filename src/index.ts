// Design system entry point.
// Components are exported from here as they are built.

// Generated token CSS (produced by `npm run tokens:build`, gitignored — see
// src/tokens/build/). Imported first, in this exact order, so tsup's esbuild-based CSS
// bundling (which concatenates in module-graph traversal order, not alphabetically)
// places every custom property component CSS below depends on before it in dist/index.css:
//   1. variables.css   — color/spacing/radius/icon/motion primitives & most semantics
//   2. typography.css  — the 35 composite text.* roles, split out because the built-in
//                         `css/variables` shorthand can't express letter-spacing (see
//                         governance/decisions/0003)
//   3. motion-reduced-motion.css — the `prefers-reduced-motion` override. Must load LAST:
//                         it re-declares the same --motion-* custom properties inside an
//                         `@media` block at equal specificity to variables.css's :root
//                         block, so source order (not specificity) decides which wins
//                         when the media query matches — loading it after variables.css
//                         is what makes the override actually override.
// `npm run build` runs `tokens:build` first (see package.json) specifically so these
// files exist before tsup tries to resolve them — without that ordering this import
// would fail the build outright (a loud failure, which is the point: a stale/missing
// token build should break `npm run build`, not silently ship a component stylesheet
// with undefined custom properties, which was the original bug this fixes).
import './tokens/build/css/variables.css';
import './tokens/build/css/typography.css';
import './tokens/build/css/motion-reduced-motion.css';

export const DESIGN_SYSTEM_VERSION = '0.0.0';

export { Icon } from './icons';
export type { IconProps, IconName, IconSize } from './icons';

export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';
