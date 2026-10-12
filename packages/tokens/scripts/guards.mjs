/**
 * Token build guardrails — see governance/decisions/0011-multi-brand-token-architecture.md
 * and 0014-token-source-portability.md. All but the brand-contract check run on the
 * platform-neutral IR (packages/tokens/scripts/ir.mjs), keyed by token PATH, so every platform's
 * output inherits them.
 */
import fs from 'node:fs';
import path from 'node:path';

import { fontManifest, validateFontCatalog } from './fonts.mjs';
import { BRANDS, DEFAULT_BRAND, PLATFORM_TIERS, TOKENS } from './ir.mjs';
import { nativeModels } from './native.mjs';

/** Per-brand accessibility contract: [foreground path, background path, minimum ratio, why]. */
export const CONTRAST_PAIRS = [
  ['color.action.primary.on-color', 'color.action.primary.default', 4.5, 'Primary button label'],
  [
    'color.action.primary.on-color',
    'color.action.primary.hover',
    4.5,
    'Primary button label (hover)',
  ],
  [
    'color.action.primary.on-color',
    'color.action.primary.active',
    4.5,
    'Primary button label (active)',
  ],
  ['color.text.link', 'color.surface.default', 4.5, 'Link on default surface'],
  ['color.text.link', 'color.surface.canvas', 4.5, 'Link on canvas'],
  ['color.text.link', 'color.surface.sunken', 4.5, 'Link on sunken surface'],
  ['color.text.link-hover', 'color.surface.default', 4.5, 'Link hover'],
  ['color.focus.ring', 'color.surface.canvas', 3, 'Focus ring vs canvas (WCAG 2.4.11)'],
  ['color.focus.ring', 'color.surface.raised', 3, 'Focus ring vs raised surface (WCAG 2.4.11)'],
  ['color.focus.ring', 'color.focus.ring-offset', 3, 'Focus ring vs its offset'],
  [
    'color.action.primary.default',
    'color.surface.default',
    3,
    'Selected control fill (checkbox, switch, tab indicator) — non-text',
  ],
  ['color.text.primary', 'color.surface.default', 4.5, 'Body text'],
  ['color.text.secondary', 'color.surface.default', 4.5, 'Secondary text'],
  ['color.text.tertiary', 'color.surface.default', 4.5, 'Helper / placeholder text'],
];

function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`contrast check needs an opaque #rrggbb color, got "${hex}"`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255);
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * Guardrail 1 — brand contract completeness; brand files may only define `brand.*`. Read
 * straight from the brand source files BEFORE resolving: a missing brand token would
 * otherwise surface only as an unresolved-reference crash inside Style Dictionary.
 */
export function checkBrandContract() {
  const errors = [];
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
  return errors;
}

/**
 * Guardrail 2 — platform scoping: a shared token may never alias a platform-tier token
 * (native outputs must be able to drop every `scope !== 'shared'` token safely).
 */
export function checkScopes(ir) {
  const scopeOf = new Map(ir.tokens.map((t) => [t.path, t.scope]));
  const errors = [];
  for (const t of ir.tokens.filter((x) => x.scope === 'shared')) {
    for (const r of [t.ref, ...Object.values(t.refs ?? {})].filter(Boolean)) {
      const s = scopeOf.get(r);
      if (s && s !== 'shared')
        errors.push(
          `shared token ${t.path} aliases ${s}-only token ${r} — move it or alias a shared token`,
        );
    }
  }
  return errors;
}

/** Guardrail 3 — anything not brand-dependent must resolve identically for every brand. */
export function checkSharedInvariance(irs) {
  const errors = [];
  const reference = irs.find((ir) => ir.default);
  for (const ir of irs) {
    if (ir === reference) continue;
    const other = new Map(ir.tokens.map((t) => [t.path, t]));
    for (const t of reference.tokens) {
      const o = other.get(t.path);
      if (!o) {
        errors.push(`${t.path} exists for ${reference.brand} but not for ${ir.brand}`);
        continue;
      }
      const subs =
        t.type === 'typography'
          ? Object.keys(t.value).map((s) => [s, t.brandDependentSubs?.includes(s)])
          : null;
      if (subs) {
        for (const [sub, dependent] of subs)
          if (!dependent && JSON.stringify(o.value[sub]) !== JSON.stringify(t.value[sub]))
            errors.push(
              `${t.path}|${sub} is shared but resolves differently for ${ir.brand} (${JSON.stringify(o.value[sub])} vs ${JSON.stringify(t.value[sub])})`,
            );
      } else if (!t.brandDependent && JSON.stringify(o.value) !== JSON.stringify(t.value)) {
        errors.push(
          `${t.path} is shared but resolves differently for ${ir.brand} (${JSON.stringify(o.value)} vs ${JSON.stringify(t.value)})`,
        );
      }
    }
  }
  return errors;
}

/** Guardrail 4 — per-brand WCAG contrast on resolved IR values. */
export function checkContrast(irs) {
  const errors = [];
  const report = [];
  for (const ir of irs) {
    const value = new Map(ir.tokens.map((t) => [t.path, t.value]));
    for (const [fg, bg, min, why] of CONTRAST_PAIRS) {
      const f = value.get(fg);
      const b = value.get(bg);
      if (!f || !b) {
        errors.push(`${ir.brand}: contrast pair references unknown token (${fg} / ${bg})`);
        continue;
      }
      const ratio = contrast(f, b);
      report.push({
        brand: ir.brand,
        pair: `${fg} on ${bg}`,
        ratio: Math.round(ratio * 100) / 100,
        min,
        why,
      });
      if (ratio < min)
        errors.push(
          `${ir.brand}: ${why} — ${fg} ${f} on ${bg} ${b} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
        );
    }
  }
  return { errors, report };
}

const leafPaths = (dir) => {
  const out = new Map();
  const walkTree = (node, trail, file) => {
    if (node && typeof node === 'object' && '$value' in node) return out.set(trail.join('.'), file);
    for (const [k, v] of Object.entries(node ?? {}))
      if (!k.startsWith('$')) walkTree(v, [...trail, k], file);
  };
  if (fs.existsSync(dir))
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')))
      walkTree(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')), [], `${dir}/${f}`);
  return out;
};

/**
 * Guardrail 5 — platform tiers may ADD tokens, never override a shared one (ADR 0014 §2).
 * Read from source: Style Dictionary would merge an override silently.
 */
export function checkPlatformOverrides(root = TOKENS) {
  const shared = new Map([
    ...leafPaths(`${root}/core`),
    ...leafPaths(`${root}/semantic`),
    ...BRANDS.flatMap((b) => [...leafPaths(`${root}/brands/${b}`)]),
  ]);
  const errors = [];
  const seen = new Map();
  for (const p of PLATFORM_TIERS)
    for (const layer of ['core', 'semantic'])
      for (const [token, file] of leafPaths(`${root}/platform/${p}/${layer}`)) {
        if (shared.has(token))
          errors.push(
            `${file} overrides shared token ${token} (${shared.get(token)}) — platform tiers may only add tokens`,
          );
        else if (seen.has(token))
          errors.push(`${token} is defined by two platform tiers (${seen.get(token)}, ${file})`);
        else seen.set(token, file);
      }
  return errors;
}

/** Guardrail 6 — font catalog is valid and has a face for every family × weight a brand uses. */
export function checkFonts(irs, catalog) {
  const errors = validateFontCatalog(catalog);
  for (const ir of irs)
    errors.push(...fontManifest(ir.tokens, catalog).errors.map((e) => `${ir.brand}: ${e}`));
  return errors;
}

/**
 * Guardrail 7 — native mappings (ADR 0016): every typography role has an iOS text-scaling
 * anchor, every elevation role an Android height (growing with the shadow), every token type
 * a native mapping, unique native names, and the same theme shape for every brand.
 * Returns the models too, so the native emitters don't rebuild them.
 */
export function checkNative(irs) {
  return nativeModels(irs);
}
