/**
 * Multi-brand token build — see governance/decisions/0011-multi-brand-token-architecture.md
 * and docs/foundations/theming.md.
 *
 *   core (shared scales + hue ramps)  ─┐
 *   brands/<brand> (brand.* choices)  ─┼─> semantic contract (unchanged names) ─> CSS / JS
 *   semantic (roles, alias core/brand)─┘
 *
 * Runs Style Dictionary once per brand. A semantic token is *brand-dependent* when its
 * alias chain reaches `brand.*` (typography: per sub-value). Outputs, in src/tokens/build/:
 *
 *   css/variables.css              shared tokens, :root                 (brand-independent)
 *   css/typography.css             shared typography sub-values, :root  (brand-independent)
 *   css/motion-reduced-motion.css  prefers-reduced-motion override      (brand-independent)
 *   css/brands/brand-a.css         `:root, [data-brand="brand-a"]` — the default brand
 *   css/brands/brand-b.css         `:root[data-brand="brand-b"], [data-brand="brand-b"]`
 *   js/tokens.js                   default brand (backwards compatible)
 *   js/tokens.<brand>.js           per brand
 *
 * `brand.*` tokens themselves are never emitted — components can only ever see semantic
 * tokens. The build FAILS (non-zero exit) on:
 *   - an incomplete or extra brand contract (every brand must define exactly the default
 *     brand's `brand.*` leaves, and nothing outside `brand`)
 *   - a brand-independent token that resolves differently between brands
 *   - any per-brand WCAG contrast pair below its minimum (see CONTRAST_PAIRS)
 */
import fs from 'node:fs';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';

import { CSS_TRANSFORMS, JS_TRANSFORMS } from '../style-dictionary.config.mjs';

export const BRANDS = ['brand-a', 'brand-b'];
export const DEFAULT_BRAND = 'brand-a';

const TOKENS = 'src/tokens';
const BUILD = `${TOKENS}/build`;

/** Scoping: the default brand also applies with no data-brand at all; every other brand
 * uses a :root-qualified selector so it wins over the default on <html> regardless of CSS
 * load order, and a bare attribute selector for contained previews. */
const selectorFor = (brand) =>
  brand === DEFAULT_BRAND
    ? `:root,\n[data-brand="${brand}"]`
    : `:root[data-brand="${brand}"],\n[data-brand="${brand}"]`;

/** Per-brand accessibility contract: [foreground, background, minimum ratio, why]. Names
 * are the generated CSS custom-property names (without `--`). */
const CONTRAST_PAIRS = [
  ['color-action-primary-on-color', 'color-action-primary-default', 4.5, 'Primary button label'],
  [
    'color-action-primary-on-color',
    'color-action-primary-hover',
    4.5,
    'Primary button label (hover)',
  ],
  [
    'color-action-primary-on-color',
    'color-action-primary-active',
    4.5,
    'Primary button label (active)',
  ],
  ['color-text-link', 'color-surface-default', 4.5, 'Link on default surface'],
  ['color-text-link', 'color-surface-canvas', 4.5, 'Link on canvas'],
  ['color-text-link', 'color-surface-sunken', 4.5, 'Link on sunken surface'],
  ['color-text-link-hover', 'color-surface-default', 4.5, 'Link hover'],
  ['color-focus-ring', 'color-surface-canvas', 3, 'Focus ring vs canvas (WCAG 2.4.11)'],
  ['color-focus-ring', 'color-surface-raised', 3, 'Focus ring vs raised surface (WCAG 2.4.11)'],
  ['color-focus-ring', 'color-focus-ring-offset', 3, 'Focus ring vs its offset'],
  [
    'color-action-primary-default',
    'color-surface-default',
    3,
    'Selected control fill (checkbox, switch, tab indicator) — non-text',
  ],
  ['color-text-primary', 'color-surface-default', 4.5, 'Body text'],
  ['color-text-secondary', 'color-surface-default', 4.5, 'Secondary text'],
  ['color-text-tertiary', 'color-surface-default', 4.5, 'Helper / placeholder text'],
];

function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`contrast check needs an opaque #rrggbb color, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const isBrandToken = (t) => t.path[0] === 'brand';
const refsIn = (value) =>
  [...JSON.stringify(value ?? null).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

function newDictionary(brand) {
  return new StyleDictionary({
    source: [
      `${TOKENS}/core/**/*.json`,
      `${TOKENS}/brands/${brand}/**/*.json`,
      `${TOKENS}/semantic/**/*.json`,
    ],
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: {
      css: { transforms: CSS_TRANSFORMS, buildPath: `${BUILD}/css/` },
      js: { transforms: JS_TRANSFORMS, buildPath: `${BUILD}/js/` },
    },
  });
}

/** Pass 1 — resolve a brand and classify every token. */
async function analyze(brand) {
  const sd = newDictionary(brand);
  const dict = await sd.getPlatformTokens('css');
  const originalByPath = new Map(dict.allTokens.map((t) => [t.path.join('.'), t.original.$value]));
  const memo = new Map();
  const dependsOnBrand = (refPath, seen = new Set()) => {
    if (refPath.startsWith('brand.')) return true;
    if (memo.has(refPath)) return memo.get(refPath);
    if (seen.has(refPath)) return false;
    seen.add(refPath);
    const result = refsIn(originalByPath.get(refPath)).some((r) => dependsOnBrand(r, seen));
    memo.set(refPath, result);
    return result;
  };
  const brandDependent = new Set(); // token names (css)
  const typographySubDependent = new Set(); // `${name}|${subKey}`
  const values = new Map(); // name -> resolved css value (typography: name|sub)
  const brandLeaves = new Set();
  for (const t of dict.allTokens) {
    if (isBrandToken(t)) {
      brandLeaves.add(t.path.join('.'));
      continue;
    }
    const value = t.value ?? t.$value;
    if (t.$type === 'typography') {
      for (const [sub, subValue] of Object.entries(t.original.$value)) {
        const key = `${t.name}|${sub}`;
        values.set(key, JSON.stringify(value[sub]));
        if (refsIn(subValue).some((r) => dependsOnBrand(r))) {
          typographySubDependent.add(key);
          brandDependent.add(t.name);
        }
      }
    } else {
      values.set(t.name, JSON.stringify(value));
      if (refsIn(t.original.$value).some((r) => dependsOnBrand(r))) brandDependent.add(t.name);
    }
  }
  return { brand, sd, brandDependent, typographySubDependent, values, brandLeaves };
}

function fail(errors) {
  console.error(`\n✖ Token build failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n`);
  process.exit(1);
}

const errors = [];

// Guardrail 1 — brand contract completeness + brand files may only define `brand.*`.
// Read straight from the brand source files, BEFORE resolving: a missing brand token would
// otherwise surface only as an unresolved-reference crash inside Style Dictionary.
const leavesOf = (node, trail, out) => {
  if (node && typeof node === 'object' && '$value' in node) return out.add(trail.join('.'));
  for (const [k, v] of Object.entries(node ?? {}))
    if (!k.startsWith('$')) leavesOf(v, [...trail, k], out);
  return out;
};
const contract = {};
for (const brand of BRANDS) {
  const dir = `${TOKENS}/brands/${brand}`;
  contract[brand] = new Set();
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const roots = Object.keys(json);
    if (roots.some((r) => r !== 'brand'))
      errors.push(
        `${dir}/${file} defines non-brand roots (${roots.join(', ')}) — brand files may only define brand.*`,
      );
    leavesOf(json.brand, ['brand'], contract[brand]);
  }
}
for (const brand of BRANDS) {
  const missing = [...contract[DEFAULT_BRAND]].filter((p) => !contract[brand].has(p));
  const extra = [...contract[brand]].filter((p) => !contract[DEFAULT_BRAND].has(p));
  if (missing.length)
    errors.push(`${brand} is missing brand contract tokens: ${missing.join(', ')}`);
  if (extra.length)
    errors.push(`${brand} defines tokens outside the brand contract: ${extra.join(', ')}`);
}
if (errors.length) fail(errors);

const analyses = [];
for (const brand of BRANDS) analyses.push(await analyze(brand));
const reference = analyses.find((a) => a.brand === DEFAULT_BRAND);

// Guardrail 2 — anything not brand-dependent must resolve identically for every brand.
for (const a of analyses) {
  for (const [key, value] of reference.values) {
    const name = key.split('|')[0];
    const isDependent = key.includes('|')
      ? reference.typographySubDependent.has(key)
      : reference.brandDependent.has(name);
    if (!isDependent && a.values.get(key) !== value)
      errors.push(
        `${key} is shared but resolves differently for ${a.brand} (${a.values.get(key)} vs ${value})`,
      );
  }
}

// Guardrail 3 — per-brand WCAG contrast.
const contrastReport = [];
for (const a of analyses) {
  for (const [fg, bg, min, why] of CONTRAST_PAIRS) {
    const f = JSON.parse(a.values.get(fg) ?? 'null');
    const b = JSON.parse(a.values.get(bg) ?? 'null');
    if (!f || !b) {
      errors.push(`${a.brand}: contrast pair references unknown token (${fg} / ${bg})`);
      continue;
    }
    const ratio = contrast(f, b);
    contrastReport.push({
      brand: a.brand,
      pair: `${fg} on ${bg}`,
      ratio: Math.round(ratio * 100) / 100,
      min,
      why,
    });
    if (ratio < min)
      errors.push(
        `${a.brand}: ${why} — ${fg} ${f} on ${bg} ${b} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
      );
  }
}

if (errors.length) fail(errors);

// Pass 2 — write outputs.
fs.rmSync(BUILD, { recursive: true, force: true });
const notBrand = (t) => !isBrandToken(t);
for (const a of analyses) {
  const { sd, brandDependent, typographySubDependent } = a;
  const isDefault = a.brand === DEFAULT_BRAND;
  const cssFiles = [
    {
      destination: `brands/${a.brand}.css`,
      format: 'css/brand-scope',
      filter: (t) => notBrand(t) && brandDependent.has(t.name),
      options: {
        selector: selectorFor(a.brand),
        includeTypography: (t, sub) => typographySubDependent.has(`${t.name}|${sub}`),
      },
    },
  ];
  if (isDefault) {
    cssFiles.push(
      {
        destination: 'variables.css',
        format: 'css/variables',
        filter: (t) => notBrand(t) && t.$type !== 'typography' && !brandDependent.has(t.name),
      },
      {
        destination: 'typography.css',
        format: 'css/typography-expanded',
        filter: (t) => t.$type === 'typography',
        options: { include: (t, sub) => !typographySubDependent.has(`${t.name}|${sub}`) },
      },
      { destination: 'motion-reduced-motion.css', format: 'css/reduced-motion', filter: notBrand },
    );
  }
  const jsFiles = [
    { destination: `tokens.${a.brand}.js`, format: 'javascript/es6', filter: notBrand },
  ];
  if (isDefault)
    jsFiles.push({ destination: 'tokens.js', format: 'javascript/es6', filter: notBrand });

  const brandSd = await sd.extend({
    platforms: {
      css: { transforms: CSS_TRANSFORMS, buildPath: `${BUILD}/css/`, files: cssFiles },
      js: { transforms: JS_TRANSFORMS, buildPath: `${BUILD}/js/`, files: jsFiles },
    },
  });
  await brandSd.buildAllPlatforms();
}

const dependent = [...reference.brandDependent].sort();
console.log(`✔ Tokens built for ${BRANDS.join(', ')} (default: ${DEFAULT_BRAND}).`);
console.log(`  Brand contract: ${reference.brandLeaves.size} brand.* tokens per brand.`);
console.log(`  Brand-dependent semantic tokens (${dependent.length}): ${dependent.join(', ')}`);
for (const brand of BRANDS) {
  const rows = contrastReport.filter((r) => r.brand === brand);
  const weakest = rows.reduce((w, r) => (r.ratio / r.min < w.ratio / w.min ? r : w));
  console.log(
    `  Contrast ${brand}: ${rows.length}/${rows.length} pairs pass (tightest: ${weakest.pair} ${weakest.ratio}:1, min ${weakest.min}).`,
  );
}
