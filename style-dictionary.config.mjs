/**
 * Web emitter configuration — formats and transforms for the web CSS and JS outputs.
 *
 * Since Phase 1 of the cross-platform architecture (governance/decisions/0014-token-source-
 * portability.md) the web emitter does NOT read token source. scripts/tokens/emit-web.mjs
 * feeds Style Dictionary the platform-neutral IR (scripts/tokens/ir.mjs): every value is
 * already resolved, in source units — px numbers, hex/hex8 colors, single family names,
 * em-fraction letter-spacing, ms durations. These transforms therefore convert each token by
 * its OWN path and type; nothing here depends on walking an alias chain any more.
 *
 * The web output (src/tokens/build/css, src/tokens/build/js) is unchanged by that refactor —
 * byte-identical to the pre-Phase-1 build. Unit decisions per foundation are unchanged too:
 * spacing and font size scale with the root font size (rem — ADR 0003/0004); radius (0006),
 * shadow geometry (0007), breakpoints/layout (0009) and icon sizes (0010) stay px.
 */
import StyleDictionary from 'style-dictionary';
import { fileHeader, formattedVariables } from 'style-dictionary/utils';

/**
 * Sub-values of a DTCG composite `typography` token, in output order, paired with the
 * CSS custom-property suffix each one is emitted under.
 */
export const TYPOGRAPHY_SUBS = [
  ['fontFamily', 'font-family'],
  ['fontSize', 'font-size'],
  ['fontWeight', 'font-weight'],
  ['lineHeight', 'line-height'],
  ['letterSpacing', 'letter-spacing'],
];

/**
 * Expands typography tokens into one longhand custom property per sub-value.
 * `include(token, subKey)` decides per sub-value whether it belongs in this file — the
 * multi-brand build uses it to put brand-dependent sub-values (today only `fontFamily`, via
 * brand.font.family.sans) in the brand files and everything else in the shared
 * typography.css. The token's description is attached to the first emitted line.
 */
function typographyLines(tokens, include = () => true) {
  return tokens.flatMap((token) => {
    const value = token.value ?? token.$value;
    const join = (v) => (Array.isArray(v) ? v.join(', ') : v);
    const lines = TYPOGRAPHY_SUBS.filter(([key]) => include(token, key)).map(
      ([key, suffix]) =>
        `  --${token.name}-${suffix}: ${key === 'fontFamily' ? join(value[key]) : value[key]};`,
    );
    if (lines.length && token.$description) lines[0] += ` /** ${token.$description} */`;
    return lines;
  });
}

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
  format: ({ dictionary, options = {} }) => {
    const lines = typographyLines(dictionary.allTokens, options.include);
    return `/**\n * Do not edit directly, this file was auto-generated.\n */\n\n:root {\n${lines.join('\n')}\n}\n`;
  },
});

/**
 * Multi-brand: one brand's brand-dependent semantic tokens, scoped to `options.selector`
 * (see scripts/tokens/emit-web.mjs and governance/decisions/0011-multi-brand-token-
 * architecture.md). Non-typography tokens use Style Dictionary's own CSS line formatter
 * (identical output to `css/variables`); typography tokens emit only their
 * brand-dependent sub-values via `options.includeTypography`.
 */
StyleDictionary.registerFormat({
  name: 'css/brand-scope',
  format: async ({ dictionary, options = {}, file }) => {
    const header = await fileHeader({ file, options });
    const plain = dictionary.allTokens.filter((t) => t.$type !== 'typography');
    const typography = dictionary.allTokens.filter((t) => t.$type === 'typography');
    const vars = formattedVariables({
      format: 'css',
      dictionary: { ...dictionary, allTokens: plain },
      outputReferences: false,
      usesDtcg: options.usesDtcg,
    });
    const lines = [vars, ...typographyLines(typography, options.includeTypography)].filter(Boolean);
    return `${header}${options.selector} {\n${lines.join('\n')}\n}\n`;
  },
});

/**
 * Accessibility requirement: `prefers-reduced-motion: reduce` must force every
 * `--motion-*` custom property to an effectively-instant value, with zero
 * component-level special-casing. Semantic `--motion-*` composites ship as fully baked
 * strings (no live `var()` chain back to the primitive durations), so the override targets
 * BOTH tiers independently — whichever one a component consumes. Easing primitives are left
 * alone: at 0ms duration a timing-function curve has no visible effect. On native platforms
 * reduced motion is a runtime OS signal, not a token output (ADR 0014).
 */
StyleDictionary.registerFormat({
  name: 'css/reduced-motion',
  format: ({ dictionary }) => {
    const lines = dictionary.allTokens
      .filter((token) => token.$type === 'duration' || token.$type === 'transition')
      .map(
        (token) => `    --${token.name}: ${token.$type === 'duration' ? '0ms' : '0ms linear 0ms'};`,
      );
    return `/**\n * Do not edit directly, this file was auto-generated.\n *\n * Forces every motion duration/transition custom property to an effectively-instant\n * value under prefers-reduced-motion. Components that consume any --motion-* custom\n * property (primitive or semantic) automatically respect reduced-motion, as long as\n * they use var(--motion-*) rather than a hardcoded duration.\n */\n\n@media (prefers-reduced-motion: reduce) {\n  :root {\n${lines.join('\n')}\n  }\n}\n`;
  },
});

// ---------------------------------------------------------------------------------------
// Unit helpers (source units → web units)
// ---------------------------------------------------------------------------------------

const valueOf = (token) => token.$value ?? token.value;
const isNumberDimension = (token) =>
  token.$type === 'dimension' && typeof valueOf(token) === 'number';
const pathIs = (token, ...prefix) => prefix.every((seg, i) => token.path[i] === seg);

/** px number → rem string (0 stays the unitless '0'), base 16 unless configured. */
const remOf = (px, config) =>
  px === 0 ? '0' : `${px / ((config && config.basePxFontSize) || 16)}rem`;
/** px number → px string (0 stays the unitless '0'). */
const pxOf = (px) => (px === 0 ? '0' : `${px}px`);
/** letter-spacing: a fraction of the font size → em string (always unitted, incl. '0em'). */
const emOf = (n) => `${n}em`;
/** ms number → ms string. Always unitted, even 0: CSS `<time>` is not valid unitless. */
const msOf = (n) => `${n}ms`;
/** Run a built-in Style Dictionary value transform on a single sub-value. */
const builtin = (name, $value, $type, config, options) =>
  StyleDictionary.hooks.transforms[name].transform({ $value, value: $value, $type }, config, {
    ...options,
    usesDtcg: true,
  });

// ---------------------------------------------------------------------------------------
// Leaf-token transforms
// ---------------------------------------------------------------------------------------

/**
 * Spacing and font size: px numbers in source (Figma's unit, platform-neutral), rem on the
 * web so both scale with the user's root font size. See ADR 0004 (spacing) and ADR 0003 /
 * 0014 (typography — font sizes were authored as rem strings before Phase 1).
 */
StyleDictionary.registerTransform({
  name: 'size/px-to-rem',
  type: 'value',
  filter: (token) =>
    isNumberDimension(token) && (pathIs(token, 'space') || pathIs(token, 'font', 'size')),
  transform: (token, config) => remOf(valueOf(token), config),
});

/**
 * Radius (ADR 0006), shadow geometry (0007), breakpoints + layout (0009) and icon sizes
 * (0010) are fixed visual/viewport geometry — px in source and in CSS, never rem. One
 * transform, scoped by path, replaces the four per-foundation px transforms that existed when
 * the build still resolved references itself (each had to match through the alias chain).
 */
StyleDictionary.registerTransform({
  name: 'size/fixed-px',
  type: 'value',
  filter: (token) =>
    isNumberDimension(token) &&
    (pathIs(token, 'radius') ||
      pathIs(token, 'shadow') ||
      pathIs(token, 'viewport') ||
      pathIs(token, 'layout') ||
      pathIs(token, 'size', 'icon') ||
      pathIs(token, 'icon')),
  transform: (token) => pxOf(valueOf(token)),
});

/**
 * Letter-spacing is authored as a unitless fraction of the font size, marked
 * `$extensions["com.pds"].unit = "em"` (DTCG's dimension type has no `em` unit). Web output
 * is the same em string it always was ('-0.01em', '0em'). Used by CSS and JS.
 */
StyleDictionary.registerTransform({
  name: 'size/letter-spacing-em',
  type: 'value',
  filter: (token) =>
    typeof valueOf(token) === 'number' && token.$extensions?.['com.pds']?.unit === 'em',
  transform: (token) => emOf(valueOf(token)),
});

/**
 * Motion durations are ms numbers (`$type: "duration"`), emitted as "Nms". Not the built-in
 * `time/seconds` transform, which targets `$type: "time"` and converts to seconds — see
 * ADR 0008.
 */
StyleDictionary.registerTransform({
  name: 'time/duration-ms',
  type: 'value',
  filter: (token) => token.$type === 'duration' && typeof valueOf(token) === 'number',
  transform: (token) => msOf(valueOf(token)),
});

// ---------------------------------------------------------------------------------------
// Composite pre-transforms — put each sub-value into web units, then the built-in
// `fontFamily/css`, `cubicBezier/css`, `transition/css/shorthand` and `shadow/css/shorthand`
// transforms (listed after these) produce the final CSS strings.
// ---------------------------------------------------------------------------------------

/** Typography (CSS + JS): fontSize px → rem, letterSpacing fraction → em. */
StyleDictionary.registerTransform({
  name: 'typography/web-units',
  type: 'value',
  filter: (token) => token.$type === 'typography',
  transform: (token, config) => {
    const v = valueOf(token);
    return {
      ...v,
      ...(typeof v.fontSize === 'number' && { fontSize: remOf(v.fontSize, config) }),
      ...(typeof v.letterSpacing === 'number' && { letterSpacing: emOf(v.letterSpacing) }),
    };
  },
});

/**
 * Shadow, CSS: geometry px numbers → px strings (zeros stay '0' — `shadow/css/shorthand`
 * prints a '0' spread, matching the Figma effect), color hex8 → `rgba(…)` via the built-in
 * `color/css`. An empty shadow list (`elevation.flat`, matching Figma's empty effects array)
 * is the CSS keyword `none`.
 */
StyleDictionary.registerTransform({
  name: 'shadow/css-units',
  type: 'value',
  filter: (token) => token.$type === 'shadow',
  transform: (token, config, options) => {
    const v = valueOf(token);
    if (Array.isArray(v) && v.length === 0) return 'none';
    const one = (s) => ({
      ...s,
      ...Object.fromEntries(
        ['offsetX', 'offsetY', 'blur', 'spread']
          .filter((k) => typeof s[k] === 'number')
          .map((k) => [k, pxOf(s[k])]),
      ),
      ...(s.color && { color: builtin('color/css', s.color, 'color', config, options) }),
    });
    return Array.isArray(v) ? v.map(one) : one(v);
  },
});

/**
 * Shadow, JS: geometry stays px numbers, color → lowercase hex/hex8 (built-in `color/hex`),
 * empty list → 'none' — the exact pre-Phase-1 JS shape.
 */
StyleDictionary.registerTransform({
  name: 'shadow/js-units',
  type: 'value',
  filter: (token) => token.$type === 'shadow',
  transform: (token, config, options) => {
    const v = valueOf(token);
    if (Array.isArray(v) && v.length === 0) return 'none';
    const one = (s) => ({
      ...s,
      ...(s.color && { color: builtin('color/hex', s.color, 'color', config, options) }),
    });
    return Array.isArray(v) ? v.map(one) : one(v);
  },
});

/** Transition, CSS: duration and delay ms numbers → "Nms". */
StyleDictionary.registerTransform({
  name: 'transition/css-units',
  type: 'value',
  filter: (token) => token.$type === 'transition',
  transform: (token) => {
    const v = valueOf(token);
    return {
      ...v,
      ...(typeof v.duration === 'number' && { duration: msOf(v.duration) }),
      ...(typeof v.delay === 'number' && { delay: msOf(v.delay) }),
    };
  },
});

/**
 * Transition, JS: the pre-Phase-1 JS shape kept duration a number but delay the string
 * "0ms" (delay was authored as a CSS string). Reproduced exactly so the web JS output is
 * unchanged; native outputs (Phase 2) get plain ms numbers from the IR.
 */
StyleDictionary.registerTransform({
  name: 'transition/js-units',
  type: 'value',
  filter: (token) => token.$type === 'transition',
  transform: (token) => {
    const v = valueOf(token);
    return { ...v, ...(typeof v.delay === 'number' && { delay: msOf(v.delay) }) };
  },
});

/**
 * Font size, JS: the web JS output has always carried font sizes as rem strings (they were
 * authored that way); kept for an unchanged web JS output. Spacing stays px numbers in JS
 * (ADR 0004) — only `font.size.*` is affected.
 */
StyleDictionary.registerTransform({
  name: 'size/font-size-rem',
  type: 'value',
  filter: (token) => isNumberDimension(token) && pathIs(token, 'font', 'size'),
  transform: (token, config) => remOf(valueOf(token), config),
});

// ---------------------------------------------------------------------------------------
// Transform lists
// ---------------------------------------------------------------------------------------

// The built-in 'css' transformGroup, minus 'typography/css/shorthand' (it collapses
// typography into a `font` shorthand and drops letter-spacing — see 'css/typography-expanded'),
// with the unit transforms above inserted before the built-ins that format final strings.
// The built-in 'size/rem' stays as a pass-through safety net: every dimension token reaching
// it is already unitted by a transform above.
export const CSS_TRANSFORMS = [
  'attribute/cti',
  'name/kebab',
  'time/seconds',
  'html/icon',
  'size/px-to-rem',
  'size/fixed-px',
  'size/letter-spacing-em',
  'time/duration-ms',
  'typography/web-units',
  'shadow/css-units',
  'transition/css-units',
  'size/rem',
  'color/css',
  'asset/url',
  'fontFamily/css',
  'cubicBezier/css',
  'strokeStyle/css/shorthand',
  'border/css/shorthand',
  'transition/css/shorthand',
  'shadow/css/shorthand',
];

// The built-in 'js' transformGroup, minus 'size/rem' (it would append "rem" to spacing's px
// numbers without scaling — JS keeps spacing as px numbers, ADR 0004), plus the composite and
// font-size/letter-spacing transforms that reproduce the pre-Phase-1 web JS shapes.
export const JS_TRANSFORMS = [
  'attribute/cti',
  'name/pascal',
  'size/font-size-rem',
  'size/letter-spacing-em',
  'typography/web-units',
  'shadow/js-units',
  'transition/js-units',
  'color/hex',
];
