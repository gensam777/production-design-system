/**
 * Stage 1 of the token build — resolve one brand into the platform-neutral IR.
 * See governance/decisions/0014-token-source-portability.md and
 * docs/cross-platform/token-portability.md.
 *
 *   source (core + brands/<brand> + semantic + platform/<p>/{core,semantic})
 *     → Style Dictionary reference resolution, NO value transforms
 *     → IR: an ordered list of resolved tokens in source units (px numbers, hex/hex8,
 *       family names, unitless ratios, ms numbers) with tier, scope and brand-dependence
 *
 * Every emitter (web CSS/JS, React Native, Swift, Kotlin) and every guardrail reads the IR —
 * never the source — so no platform has its own resolution path. `brand.*` tokens are
 * resolved into their consumers but never appear in the IR.
 *
 * The IR also carries the brand's font manifest (`fonts`): the faces each font role (`sans`,
 * `mono`) needs, derived from src/tokens/fonts/fonts.json (ADR 0016). Fonts are asset
 * metadata, not tokens.
 */
import fs from 'node:fs';
import path from 'node:path';
import StyleDictionary from 'style-dictionary';

import { fontManifest, loadFontCatalog } from './fonts.mjs';

export const TOKENS = 'src/tokens';
export const BRANDS = ['brand-a', 'brand-b'];
export const DEFAULT_BRAND = 'brand-a';
/** Platform tiers under src/tokens/platform/<platform>/{core,semantic}. A token's scope is
 * `shared` or the tier it comes from (`web`, `native`). */
export const PLATFORM_TIERS = ['web', 'native'];

const jsonFiles = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : [];

/**
 * Source files in merge order. Within the core and semantic layers, shared files and
 * platform-tier files are merged as ONE list sorted by file name (shared first on a tie), so
 * moving a file into a platform tier doesn't change where its tokens sit in the merged tree
 * (and therefore in every generated output).
 */
export function sourceFiles(brand) {
  const layer = (tier) =>
    [
      ...jsonFiles(`${TOKENS}/${tier}`).map((f) => ({ f, dir: `${TOKENS}/${tier}`, rank: 0 })),
      ...PLATFORM_TIERS.flatMap((p) =>
        jsonFiles(`${TOKENS}/platform/${p}/${tier}`).map((f) => ({
          f,
          dir: `${TOKENS}/platform/${p}/${tier}`,
          rank: 1,
        })),
      ),
    ]
      .sort((a, b) => a.f.localeCompare(b.f) || a.rank - b.rank)
      .map(({ f, dir }) => `${dir}/${f}`);
  const brandDir = `${TOKENS}/brands/${brand}`;
  return [
    ...layer('core'),
    ...jsonFiles(brandDir)
      .sort()
      .map((f) => `${brandDir}/${f}`),
    ...layer('semantic'),
  ];
}

/** Tier and scope of a token from the file that defines it. */
function classify(filePath) {
  const rel = path.relative(TOKENS, filePath).split(path.sep);
  if (rel[0] === 'platform') return { tier: rel[2], scope: rel[1] };
  if (rel[0] === 'brands') return { tier: 'brand', scope: 'shared' };
  return { tier: rel[0], scope: 'shared' };
}

const refsIn = (value) =>
  [...JSON.stringify(value ?? null).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
const refOf = (value) =>
  typeof value === 'string' ? (/^\{([^}]+)\}$/.exec(value)?.[1] ?? null) : null;

/** Resolve one brand into its IR. */
export async function resolveBrand(brand, { fontCatalog = loadFontCatalog() } = {}) {
  const sd = new StyleDictionary({
    source: sourceFiles(brand),
    log: { verbosity: 'silent', warnings: 'disabled' },
    platforms: { ir: { transforms: [] } },
  });
  const dict = await sd.getPlatformTokens('ir');
  const byPath = new Map(dict.allTokens.map((t) => [t.path.join('.'), t]));

  const memo = new Map();
  const dependsOnBrand = (refPath, seen = new Set()) => {
    if (refPath.startsWith('brand.')) return true;
    if (memo.has(refPath)) return memo.get(refPath);
    if (seen.has(refPath)) return false;
    seen.add(refPath);
    const result = refsIn(byPath.get(refPath)?.original.$value).some((r) =>
      dependsOnBrand(r, seen),
    );
    memo.set(refPath, result);
    return result;
  };

  const tokens = [];
  const brandLeaves = [];
  for (const t of dict.allTokens) {
    const p = t.path.join('.');
    const { tier, scope } = classify(t.filePath);
    if (tier === 'brand') {
      brandLeaves.push(p);
      continue;
    }
    const original = t.original.$value;
    const entry = { path: p, type: t.$type, value: t.$value, tier, scope };
    if (t.$description) entry.description = t.$description;
    if (t.$extensions) entry.extensions = t.$extensions;

    const isComposite = original && typeof original === 'object' && !Array.isArray(original);
    if (isComposite) {
      const refs = {};
      const dependentSubs = [];
      for (const [sub, subValue] of Object.entries(original)) {
        const r = refOf(subValue);
        if (r) refs[sub] = r;
        if (refsIn(subValue).some((x) => dependsOnBrand(x))) dependentSubs.push(sub);
      }
      if (Object.keys(refs).length) entry.refs = refs;
      entry.brandDependent = dependentSubs.length > 0;
      if (dependentSubs.length) entry.brandDependentSubs = dependentSubs;
    } else {
      const r = refOf(original);
      if (r) entry.ref = r;
      entry.brandDependent = refsIn(original).some((x) => dependsOnBrand(x));
    }
    tokens.push(entry);
  }

  return {
    format: 'pds.tokens.ir',
    version: 2,
    brand,
    default: brand === DEFAULT_BRAND,
    brandContract: brandLeaves,
    fonts: fontManifest(tokens, fontCatalog).manifest,
    tokens,
  };
}
