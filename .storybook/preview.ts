import type { Preview } from '@storybook/react-vite';

// Inter, self-hosted via @fontsource (a Storybook-only devDependency — never imported by
// any component or by src/index.ts, so it never ships in dist/ or becomes a runtime
// dependency of the published package). Without this, every `font-family: Inter, ...`
// declaration silently falls through Inter to the OS default UI font (San Francisco /
// Segoe UI / Roboto) on any machine that doesn't happen to have Inter installed
// system-wide — Storybook would still "work" but wouldn't be a trustworthy visual
// reference for what the design tokens actually specify. Only the 4 weights the
// typography foundation defines (`font.weight.regular/medium/semibold/bold` — see
// docs/foundations/typography.md) are imported, not the full family (100–900 + italics),
// to avoid pulling in weights this system never uses.
//
// This is a Storybook-only fix, not a library-level one: production consumers of this
// package are still responsible for providing their own Inter (or an equivalent
// substitute font) the same way any design-system consumer supplies its own webfonts —
// see "Font loading is a consumer responsibility" in docs/foundations/typography.md.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Generated token CSS (gitignored, produced by `npm run tokens:build`) — the same three
// files, same order, that src/index.ts now imports to build the package's public
// dist/index.css (see the comment there for why this exact order matters: variables,
// then typography, then the reduced-motion override last so it wins the cascade). Every
// token-consuming component (Icon, Button, ...) resolves its custom properties from
// these — without this import nothing in Storybook has --color-*/--space-*/--text-*/etc.
// defined, so components would render with default browser sizing/colors instead of
// design system values.
import '../src/tokens/build/css/variables.css';
import '../src/tokens/build/css/typography.css';
import '../src/tokens/build/css/motion-reduced-motion.css';

// Deliberately importing these source files directly rather than the built
// `dist/index.css` a real consumer imports (`production-design-system/index.css`):
// dist/index.css is a static artifact produced by `npm run build` and is not
// regenerated on file save, so routing Storybook's dev server through it would break
// Vite's CSS hot-reload for every component edit — a real cost for the tool this repo
// uses to iterate on components. Component CSS itself (e.g. Button.css) is NOT imported
// here for the same reason and doesn't need to be: each component already imports its
// own stylesheet directly (see Button.tsx), so Storybook picks it up automatically
// through the normal module graph, with full HMR.
//
// This does mean Storybook alone cannot prove the packaged dist/index.css is correct —
// that it actually contains these token custom properties ahead of component rules is a
// packaging concern, verified by running `npm run build` and inspecting dist/index.css
// (see docs/design-to-code-mappings.md), not by anything rendering correctly in
// Storybook. Both paths ultimately read the identical generated files as their only
// source of truth, so they can't drift into two different definitions of a token.

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
