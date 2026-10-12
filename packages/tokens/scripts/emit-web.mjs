/**
 * Stage 3 of the token build — the web emitter. Reads ONLY the IR (packages/tokens/scripts/ir.mjs),
 * never token source, and writes the web CSS and JS outputs in packages/tokens/build/:
 *
 *   css/variables.css              shared tokens, :root                 (brand-independent)
 *   css/typography.css             shared typography sub-values, :root  (brand-independent)
 *   css/motion-reduced-motion.css  prefers-reduced-motion override      (brand-independent)
 *   css/brands/brand-a.css         `:root, [data-brand="brand-a"]` — the default brand
 *   css/brands/brand-b.css         `:root[data-brand="brand-b"], [data-brand="brand-b"]`
 *   js/tokens.js                   default brand (backwards compatible)
 *   js/tokens.<brand>.js           per brand
 *
 * The web emitter consumes the `shared` and `web` scopes. Web-only data handled here, not in
 * the IR's shared tokens: font fallback stacks (`font.fallback.*`, web tier) are appended to
 * every family identity and are not emitted on their own.
 */
import StyleDictionary from 'style-dictionary';

import { CSS_TRANSFORMS, JS_TRANSFORMS } from '../style-dictionary.config.mjs';

export const WEB_SCOPES = new Set(['shared', 'web']);
const FALLBACK = ['font', 'fallback'];

/** Scoping: the default brand also applies with no data-brand at all; every other brand
 * uses a :root-qualified selector so it wins over the default on <html> regardless of CSS
 * load order, and a bare attribute selector for contained previews. */
const selectorFor = (brand, isDefault) =>
  isDefault
    ? `:root,\n[data-brand="${brand}"]`
    : `:root[data-brand="${brand}"],\n[data-brand="${brand}"]`;

const isFallback = (p) => p.startsWith(`${FALLBACK.join('.')}.`);
/** `brand.font.family.sans` / `font.family.mono` → 'sans' / 'mono'. */
const familyKey = (p) => /(?:^|\.)font\.family\.([^.]+)$/.exec(p ?? '')?.[1] ?? null;

/** Rebuild a DTCG tree (in IR order) with web-only adjustments applied. */
function webTree(ir) {
  const tokens = ir.tokens.filter((t) => WEB_SCOPES.has(t.scope));
  const fallbacks = new Map(
    tokens.filter((t) => isFallback(t.path)).map((t) => [t.path.split('.').pop(), t.value]),
  );
  const withFallback = (family, key) => {
    const stack = fallbacks.get(key);
    if (!stack) return family;
    return [...(Array.isArray(family) ? family : [family]), ...stack];
  };

  const tree = {};
  for (const t of tokens) {
    if (isFallback(t.path)) continue;
    let value = t.value;
    if (t.type === 'fontFamily') value = withFallback(value, familyKey(t.path));
    if (t.type === 'typography' && t.refs?.fontFamily)
      value = {
        ...value,
        fontFamily: withFallback(value.fontFamily, familyKey(t.refs.fontFamily)),
      };

    const segs = t.path.split('.');
    let node = tree;
    for (const s of segs.slice(0, -1)) node = node[s] ??= {};
    node[segs.at(-1)] = {
      $value: value,
      $type: t.type,
      ...(t.description && { $description: t.description }),
      ...(t.extensions && { $extensions: t.extensions }),
    };
  }
  return tree;
}

/** Emit one brand's web outputs from its IR. */
export async function emitWeb(ir, buildDir) {
  const meta = new Map(ir.tokens.map((t) => [t.path, t]));
  const m = (token) => meta.get(token.path.join('.'));
  const dependent = (token) => m(token)?.brandDependent === true;
  const dependentSub = (token, sub) => m(token)?.brandDependentSubs?.includes(sub) === true;

  const cssFiles = [
    {
      destination: `brands/${ir.brand}.css`,
      format: 'css/brand-scope',
      filter: dependent,
      options: { selector: selectorFor(ir.brand, ir.default), includeTypography: dependentSub },
    },
  ];
  if (ir.default) {
    cssFiles.push(
      {
        destination: 'variables.css',
        format: 'css/variables',
        filter: (t) => t.$type !== 'typography' && !dependent(t),
      },
      {
        destination: 'typography.css',
        format: 'css/typography-expanded',
        filter: (t) => t.$type === 'typography',
        options: { include: (t, sub) => !dependentSub(t, sub) },
      },
      { destination: 'motion-reduced-motion.css', format: 'css/reduced-motion' },
    );
  }
  const jsFiles = [{ destination: `tokens.${ir.brand}.js`, format: 'javascript/es6' }];
  if (ir.default) jsFiles.push({ destination: 'tokens.js', format: 'javascript/es6' });

  const sd = new StyleDictionary({
    tokens: webTree(ir),
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: { transforms: CSS_TRANSFORMS, buildPath: `${buildDir}/css/`, files: cssFiles },
      js: { transforms: JS_TRANSFORMS, buildPath: `${buildDir}/js/`, files: jsFiles },
    },
  });
  await sd.buildAllPlatforms();
}
