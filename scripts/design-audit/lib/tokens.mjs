/**
 * Token resolution straight from the DTCG source (src/tokens/{core,brands/<brand>,semantic}),
 * so the audit never depends on `npm run tokens:build` having run. Same layering as
 * scripts/build-tokens.mjs: core + one brand + semantic, aliases resolved per brand.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Figma variable collection → DTCG path prefix (see ADR 0005 / 0011 for the split). */
const FIGMA_COLLECTION_PREFIX = {
  'Semantic Color': 'color',
  'Semantic Space': 'space',
  'Semantic Radius': 'radius',
  'Semantic Motion': 'motion',
  'Semantic Layout': 'layout',
  'Semantic Icon': 'icon',
  Brand: 'brand',
  Core: '',
};

// Same naming as Style Dictionary's `name/kebab` (and scripts/check-token-usage.mjs).
const kebab = (segments) =>
  segments
    .map((s) =>
      String(s)
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase(),
    )
    .join('-');

const TYPOGRAPHY_SUBS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];

function readTree(dir) {
  const tree = {};
  if (!fs.existsSync(dir)) return tree;
  for (const f of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    deepMerge(tree, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  }
  return tree;
}

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !('$value' in v)) {
      target[k] = target[k] && typeof target[k] === 'object' ? target[k] : {};
      deepMerge(target[k], v);
    } else target[k] = v;
  }
  return target;
}

function flatten(node, trail, out) {
  if (node && typeof node === 'object' && '$value' in node) {
    out.set(trail.join('.'), node);
    return out;
  }
  for (const [k, v] of Object.entries(node ?? {})) {
    if (!k.startsWith('$')) flatten(v, [...trail, k], out);
  }
  return out;
}

/**
 * @param {{ root?: string }} [opts]
 * @returns token API: brands, has(), type(), resolve(), cssVar(), fromFigmaVariable(), …
 */
export function loadTokens({ root = 'src/tokens' } = {}) {
  const brands = fs
    .readdirSync(path.join(root, 'brands'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const core = readTree(path.join(root, 'core'));
  const semantic = readTree(path.join(root, 'semantic'));
  const byBrand = new Map();
  for (const brand of brands) {
    const tree = deepMerge(
      deepMerge(deepMerge({}, core), readTree(path.join(root, 'brands', brand))),
      semantic,
    );
    byBrand.set(brand, flatten(tree, [], new Map()));
  }
  const anyBrand = byBrand.get(brands[0]);

  // CSS custom property name (without `--`) → { path, sub? }
  const cssIndex = new Map();
  for (const [p, tok] of anyBrand) {
    const segs = p.split('.');
    if (segs[0] === 'brand') continue; // never emitted (ADR 0011)
    cssIndex.set(kebab(segs), { path: p });
    if (tok.$type === 'typography') {
      for (const sub of TYPOGRAPHY_SUBS) cssIndex.set(kebab([...segs, sub]), { path: p, sub });
    }
  }

  const lookup = (brand) => {
    const map = byBrand.get(brand);
    if (!map) throw new Error(`Unknown brand "${brand}" (known: ${brands.join(', ')})`);
    return map;
  };

  function resolveValue(value, map, seen) {
    if (typeof value === 'string') {
      const m = value.match(/^\{([^}]+)\}$/);
      if (m) return resolvePath(m[1], map, seen);
      return value;
    }
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, resolveValue(v, map, seen)]),
      );
    }
    return value;
  }
  function resolvePath(p, map, seen = new Set()) {
    if (seen.has(p)) throw new Error(`Circular token alias at ${p}`);
    const tok = map.get(p);
    if (!tok) throw new Error(`Unresolvable token reference {${p}}`);
    return resolveValue(tok.$value, map, new Set([...seen, p]));
  }

  return {
    brands,
    has: (p) => anyBrand.has(p),
    type: (p) => anyBrand.get(p)?.$type ?? null,
    /** Fully resolved value of `path` (optionally a typography sub-value) in `brand`. */
    resolve(p, brand, sub) {
      const v = resolvePath(p, lookup(brand));
      return sub ? v?.[sub] : v;
    },
    /** `--space-stack-md` / `space-stack-md` → { path: 'space.stack.md' } (or null). */
    cssVar(name) {
      return cssIndex.get(name.replace(/^--/, '')) ?? null;
    },
    /** `space.stack.md` → `--space-stack-md`. */
    toCssVar: (p) => `--${kebab(p.split('.'))}`,
    /** `Semantic Space/stack/md` → `space.stack.md` (null if the collection is unknown). */
    fromFigmaVariable(name) {
      const slash = name.indexOf('/');
      if (slash < 0) return null;
      const collection = name.slice(0, slash);
      const prefix = FIGMA_COLLECTION_PREFIX[collection];
      if (prefix === undefined) return null;
      const segs = name.slice(slash + 1).split('/');
      if (prefix && segs[0] !== prefix) segs.unshift(prefix);
      return segs.join('.');
    },
    /** Figma text style `text/heading/sm/semibold` → `text.heading.sm.semibold`. */
    fromFigmaTextStyle: (name) => name.split('/').join('.'),
  };
}

/** Number of CSS pixels a resolved dimension represents (`12`, `'12px'`, `'0.75rem'`). */
export function toPx(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const m = value.trim().match(/^(-?[\d.]+)(px|rem)?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 'rem' ? n * 16 : n;
}
