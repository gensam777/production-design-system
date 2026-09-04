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
 *
 * Scoped to `space.*` only (checked via `token.path[0] === 'space'`), not to every bare-
 * number dimension token. Radius (governance/decisions/0006-radius-token-architecture.md)
 * is also a bare-number `dimension` token in source, but must stay px in CSS output — it's
 * visual geometry, not something that should scale with the user's root font size. Without
 * this scoping, radius would get silently swept into the same rem conversion as spacing.
 */
StyleDictionary.registerTransform({
  name: 'size/px-to-rem',
  type: 'value',
  transitive: true,
  filter: (token) =>
    token.$type === 'dimension' && typeof token.original.$value === 'number' && token.path[0] === 'space',
  transform: (token, config) => {
    const base = (config && config.basePxFontSize) || 16;
    const px = token.original.$value;
    return px === 0 ? '0' : `${px / base}rem`;
  },
});

/**
 * Radius is visual geometry, not something that should scale with the user's root font
 * size — per governance/decisions/0006-radius-token-architecture.md it stays px in both
 * source and CSS output, unlike spacing. Scoping 'size/px-to-rem' away from radius isn't
 * enough on its own: without a replacement, the built-in 'size/rem' transform would still
 * run on radius's bare-number dimension tokens next and corrupt them the same way spacing
 * would have been corrupted (appending "rem" without scaling, e.g. `4` -> "4rem"). This
 * transform pre-formats radius values as an explicit "Npx" string (or "0") before
 * 'size/rem' runs, so 'size/rem' sees an already-unitted value and passes it through
 * unchanged — same pass-through mechanism typography and spacing rely on.
 */
StyleDictionary.registerTransform({
  name: 'size/radius-px',
  type: 'value',
  transitive: true,
  filter: (token) =>
    token.$type === 'dimension' && typeof token.original.$value === 'number' && token.path[0] === 'radius',
  transform: (token) => {
    const px = token.original.$value;
    return px === 0 ? '0' : `${px}px`;
  },
});

/**
 * Shadow geometry (offset-x/offset-y/blur/spread) is visual geometry like radius, not
 * something that should scale with the user's root font size — per
 * governance/decisions/0007-elevation-token-architecture.md it stays px in both source
 * and CSS output. Same pass-through mechanism as 'size/radius-px': pre-format the bare
 * number as an explicit "Npx" string before 'size/rem' runs, so 'size/rem' passes it
 * through unchanged instead of appending "rem" unscaled.
 *
 * This also matters for the semantic `elevation.*` composite `$type: "shadow"` tokens:
 * the built-in `shadow/css/shorthand` transform (already present below, previously
 * unused) calls a DTCG dimension normalizer on each resolved offset/blur/spread value
 * that preserves a unit if one is already present, but does NOT add one to a bare
 * number — so primitive shadow geometry must already be "Npx" by the time a semantic
 * token's alias reference resolves, or the generated `box-shadow` would be missing
 * units (e.g. `0 1 2 0 rgba(...)` instead of `0 1px 2px 0 rgba(...)`).
 */
StyleDictionary.registerTransform({
  name: 'size/shadow-px',
  type: 'value',
  transitive: true,
  filter: (token) =>
    token.$type === 'dimension' && typeof token.original.$value === 'number' && token.path[0] === 'shadow',
  transform: (token) => {
    const px = token.original.$value;
    return px === 0 ? '0' : `${px}px`;
  },
});

/**
 * Motion durations use `$type: "duration"` (not the built-in `time/seconds` transform's
 * `$type: "time"`, which converts to *seconds* — the opposite of what's required here;
 * see governance/decisions/0008-motion-token-architecture.md). No spacing/radius/shadow
 * transform touches these tokens either, since none of them filter on `$type ===
 * "duration"` — motion needed no `path[0]` scoping the way radius/shadow did, because it
 * doesn't share the "dimension" `$type` with spacing at all.
 *
 * The built-in `transition/css/shorthand` transform (used for the semantic `motion.*`
 * composites below) does zero unit normalization — worse than `shadow/css/shorthand`,
 * which at least preserves an existing unit. It just string-interpolates
 * `${duration} ${timingFunction} ${delay}` directly. So primitive durations must already
 * be an explicit "Nms" string by the time a semantic token's alias reference resolves,
 * or the generated CSS `transition` value would have no unit on the duration at all.
 *
 * Always emits a unit, even for 0 — CSS `<time>` values (unlike `<length>`) are not
 * guaranteed valid unitless at zero in all engines; `0ms` is the safe, always-valid form.
 */
StyleDictionary.registerTransform({
  name: 'time/duration-ms',
  type: 'value',
  transitive: true,
  filter: (token) => token.$type === 'duration' && typeof token.original.$value === 'number',
  transform: (token) => `${token.original.$value}ms`,
});

/**
 * Accessibility requirement: `prefers-reduced-motion: reduce` must force every
 * `--motion-*` custom property to an effectively-instant value, with zero
 * component-level special-casing.
 *
 * This can't be done by overriding only the primitive `--motion-duration-*` custom
 * properties: Style Dictionary's alias references (`{motion.duration.base}` inside a
 * semantic `motion.overlay-enter` token) are resolved at BUILD time, not preserved as
 * live `var(--motion-duration-base)` chains in the generated CSS. The semantic
 * `--motion-overlay-enter` custom property ships as a fully baked string
 * (`"200ms cubic-bezier(...) 0ms"`), with no runtime reference back to
 * `--motion-duration-base` at all. So a reduced-motion override has to target BOTH tiers
 * independently — whichever one a given component actually consumes — not just the
 * primitive "source of truth". Easing primitives are deliberately left alone: at 0ms
 * duration, a timing-function curve has no visible effect anyway.
 */
StyleDictionary.registerFormat({
  name: 'css/reduced-motion',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens
      .filter((token) => token.$type === 'duration' || token.$type === 'transition')
      .map((token) => `    --${token.name}: ${token.$type === 'duration' ? '0ms' : '0ms linear 0ms'};`);
    return `/**\n * Do not edit directly, this file was auto-generated.\n *\n * Forces every motion duration/transition custom property to an effectively-instant\n * value under prefers-reduced-motion. Components that consume any --motion-* custom\n * property (primitive or semantic) automatically respect reduced-motion, as long as\n * they use var(--motion-*) rather than a hardcoded duration.\n */\n\n@media (prefers-reduced-motion: reduce) {\n  :root {\n${lines.join('\n')}\n  }\n}\n`;
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
      // 'size/radius-px' (custom, see above) runs the same way for radius, but formats to
      // px instead of rem — radius stays fixed geometry, not font-size-relative.
      // 'size/shadow-px' (custom, see above) does the same for shadow geometry, and also
      // makes sure 'shadow/css/shorthand' below sees already-unitted values.
      // 'time/duration-ms' (custom, see above) does the analogous thing for motion
      // durations — 'ms' instead of 'px' — and also makes sure 'transition/css/shorthand'
      // below (dormant until motion) sees already-unitted duration values.
      transforms: [
        'attribute/cti',
        'name/kebab',
        'time/seconds',
        'html/icon',
        'size/px-to-rem',
        'size/radius-px',
        'size/shadow-px',
        'time/duration-ms',
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
        {
          destination: 'motion-reduced-motion.css',
          format: 'css/reduced-motion',
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
