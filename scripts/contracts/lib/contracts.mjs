/**
 * Component contract checks (ADR 0015). Pure functions over already-loaded inputs so the CLI
 * (../validate.mjs) and the tests share them:
 *
 *   1. schema          — JSON Schema (design/contracts/schema.json), structure only.
 *   2. platform-api    — no web DOM / native view API names anywhere in the contract.
 *   3. references      — internal cross-references (defaults, parts, slots, states, sizes).
 *   4. tokens          — every token path exists in every brand's resolved IR and is a
 *                        semantic, shared token (never Core, brand.* or platform-only).
 *   5. figma           — variant axes ↔ property enums / state model, variant count, and every
 *                        committed design-audit Figma snapshot instance of the component set.
 *   6. web-reference   — while web status is alpha/beta/stable: enum unions, defaults and the
 *                        set of tokens the web styles use ↔ the contract.
 *   7. react-native-reference — the same while react-native is alpha/beta/stable; the token
 *                        set comes from the component's token map (contract token paths kept
 *                        as string literals). The RN Jest suite compares that map cell by cell.
 *
 * Each check returns findings `{ level: 'error' | 'warning', check, message }`.
 */
import Ajv2020 from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';

import { parseCss, varRefs } from '../../design-audit/lib/css.mjs';

export const PLATFORMS = ['web', 'react-native', 'ios', 'android'];
const IMPLEMENTED = new Set(['alpha', 'beta', 'stable']);

/**
 * Platform API names that must never appear in a shared contract (ADR 0015 rules 1, 2, 5).
 * Platform-only capabilities are described by meaning in `platform-notes` instead.
 */
export const FORBIDDEN_TERMS = [
  // Web / React
  { re: /\bclassName\b/, why: 'web styling API' },
  { re: /\bhref\b/, why: 'web navigation attribute' },
  { re: /\baria-[a-z]+/, why: 'web accessibility API — state the outcome instead' },
  { re: /\brole=/, why: 'web accessibility API — use accessibility.role' },
  { re: /\bReactNode\b|\bReactElement\b|\bJSX\b/, why: 'React content type — use a typed slot' },
  { re: /\b[A-Z][A-Za-z]*HTMLAttributes\b|\bHTML attributes?\b/i, why: 'DOM attribute API' },
  { re: /\btype\s*[=:]\s*["']?(submit|reset)\b/, why: 'web form API' },
  {
    re: /\bon(Click|Change|Press|LongPress|Focus|Blur|KeyDown)\b/,
    why: 'platform event idiom — use a semantic event',
  },
  { re: /\bforwardRef\b|\bref=/, why: 'React ref API' },
  { re: /\btabIndex\b|\btabindex\b/, why: 'web focus API' },
  // React Native
  { re: /\bhitSlop\b|\btestID\b|\bkeyboardType\b|\btextContentType\b/, why: 'React Native prop' },
  {
    re: /\baccessibility(Label|Hint|State|Role|Value|Traits)\b/,
    why: 'native accessibility API — state the outcome instead',
  },
  // SwiftUI
  { re: /@(State|Binding|ViewBuilder|Environment)\b/, why: 'SwiftUI API' },
  { re: /\baction:\s*\{/, why: 'SwiftUI action closure — use a semantic event' },
  // Compose
  { re: /\bModifier\b/, why: 'Compose API' },
  { re: /\b(contentDescription|semantics\s*\{|@Composable)\b/, why: 'Compose API' },
];

const err = (check, message) => ({ level: 'error', check, message });
const warn = (check, message) => ({ level: 'warning', check, message });
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Parses YAML strictly: duplicate keys, merge keys and syntax errors are failures. */
export function parseContract(text) {
  const doc = parseDocument(text, { uniqueKeys: true, merge: false, prettyErrors: true });
  const problems = [...doc.errors, ...doc.warnings].map((e) => e.message);
  return { contract: problems.length ? null : doc.toJS(), problems };
}

// ---------------------------------------------------------------- 1. schema

export function compileSchema(schema) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictRequired: false,
    allowUnionTypes: true,
  });
  return ajv.compile(schema);
}

export function checkSchema(validate, contract) {
  if (validate(contract)) return [];
  return validate.errors.map((e) =>
    err(
      'schema',
      `${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` ('${e.params.additionalProperty}')` : ''}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : ''}`,
    ),
  );
}

// ---------------------------------------------------------------- 2. platform-api

/** Scans raw YAML text, so keys, values and comments are all covered. */
export function checkPlatformApi(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const { re, why } of FORBIDDEN_TERMS) {
      const m = line.match(re);
      if (m) out.push(err('platform-api', `line ${i + 1}: '${m[0]}' — ${why}`));
    }
  });
  return out;
}

// ---------------------------------------------------------------- 3. references

const enumProps = (c) => Object.entries(c.properties ?? {}).filter(([, p]) => p.type === 'enum');
const stateNames = (c) => [
  ...Object.keys(c.states?.shared ?? {}),
  ...Object.keys(c.states?.['platform-owned'] ?? {}),
];

export function checkReferences(c) {
  const out = [];
  const R = 'references';
  const parts = new Set(Object.keys(c.anatomy ?? {}));
  const slots = new Set(Object.keys(c.slots ?? {}));
  const shared = new Set(Object.keys(c.states?.shared ?? {}));
  const states = new Set(stateNames(c));

  for (const [name, p] of enumProps(c))
    if (!(p.default in p.values))
      out.push(err(R, `properties.${name}.default '${p.default}' is not one of its values`));

  for (const name of Object.keys(c.slots ?? {}))
    if (!parts.has(name)) out.push(err(R, `slot '${name}' has no anatomy part of the same name`));

  for (const [name, e] of Object.entries(c.events ?? {}))
    for (const s of e['suppressed-when'] ?? [])
      if (!shared.has(s))
        out.push(err(R, `events.${name}.suppressed-when '${s}' is not a shared state`));

  for (const [name, s] of Object.entries(c.states?.shared ?? {})) {
    if (name !== 'default' && !(name in (c.properties ?? {})))
      out.push(warn(R, `shared state '${name}' is not driven by a property of the same name`));
    if (s['tokens-from'] && !states.has(s['tokens-from']))
      out.push(err(R, `states.shared.${name}.tokens-from '${s['tokens-from']}' is not a state`));
  }
  for (const name of Object.keys(c.states?.['platform-owned'] ?? {}))
    if (shared.has(name)) out.push(err(R, `state '${name}' is both shared and platform-owned`));
  for (const s of c.states?.precedence ?? [])
    if (!shared.has(s)) out.push(err(R, `states.precedence '${s}' is not a shared state`));

  const src = c.accessibility?.name?.source;
  if (src && src !== 'consumer' && !slots.has(src))
    out.push(err(R, `accessibility.name.source '${src}' is not a slot`));
  if (src && slots.has(src) && c.slots[src].type !== 'text')
    out.push(err(R, `accessibility.name.source '${src}' must be a text slot`));

  // tokens: part → property → selector keys (enum values | states)* → leaf
  const selectorKeys = new Set([
    ...enumProps(c).flatMap(([, p]) => Object.keys(p.values)),
    ...states,
  ]);
  for (const [part, props] of Object.entries(c.tokens ?? {})) {
    if (!parts.has(part)) out.push(err(R, `tokens.${part} is not an anatomy part`));
    for (const [prop, node] of Object.entries(props ?? {}))
      walkTokens(node, `tokens.${part}.${prop}`, (key, at) => {
        if (!selectorKeys.has(key))
          out.push(err(R, `${at}: '${key}' is neither an enum value nor a state`));
      });
  }

  for (const [name, k] of Object.entries(c['component-constants'] ?? {}))
    if (k.part && !parts.has(k.part))
      out.push(err(R, `component-constants.${name}.part '${k.part}' is not an anatomy part`));

  const sizing = c.sizing;
  if (sizing?.property) {
    const p = c.properties?.[sizing.property];
    if (!p || p.type !== 'enum')
      out.push(err(R, `sizing.property '${sizing.property}' is not an enum property`));
    else if (sizing['visual-height']) {
      const want = Object.keys(p.values).sort().join(',');
      const got = Object.keys(sizing['visual-height']).sort().join(',');
      if (want !== got)
        out.push(
          err(R, `sizing.visual-height keys [${got}] ≠ ${sizing.property} values [${want}]`),
        );
    }
  } else if (sizing?.['visual-height'])
    out.push(err(R, 'sizing.visual-height needs sizing.property'));

  return out;
}

/** Calls onKey(key, path) for every selector key; returns leaf paths ['color.x.y' | 'none']. */
function walkTokens(node, at, onKey = () => {}, leaves = []) {
  if (typeof node === 'string') leaves.push({ at, value: node });
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) {
      onKey(k, at);
      walkTokens(v, `${at}.${k}`, onKey, leaves);
    }
  return leaves;
}

export function tokenLeaves(c) {
  return Object.entries(c.tokens ?? {}).flatMap(([part, props]) =>
    Object.entries(props ?? {}).flatMap(([prop, node]) =>
      walkTokens(node, `tokens.${part}.${prop}`),
    ),
  );
}

// ---------------------------------------------------------------- 4. tokens

/** @param irs resolved IRs (packages/tokens/scripts/ir.mjs resolveBrand), one per brand */
export function checkTokens(c, irs) {
  const out = [];
  const maps = irs.map((ir) => ({
    brand: ir.brand,
    byPath: new Map(ir.tokens.map((t) => [t.path, t])),
  }));
  for (const { at, value } of tokenLeaves(c)) {
    if (value === 'none') continue;
    if (value.startsWith('brand.')) {
      out.push(
        err('tokens', `${at}: '${value}' is a brand-contract token — use the semantic token`),
      );
      continue;
    }
    for (const { brand, byPath } of maps) {
      const t = byPath.get(value);
      if (!t) out.push(err('tokens', `${at}: '${value}' does not exist (${brand})`));
      else if (t.tier !== 'semantic')
        out.push(
          err(
            'tokens',
            `${at}: '${value}' is a ${t.tier} token — contracts use semantic tokens only`,
          ),
        );
      else if (t.scope !== 'shared')
        out.push(
          err(
            'tokens',
            `${at}: '${value}' is ${t.scope}-only — a shared contract can't depend on it`,
          ),
        );
      if (!t || t.tier !== 'semantic' || t.scope !== 'shared') break; // one report per leaf
    }
  }
  return out;
}

// ---------------------------------------------------------------- 5. figma

/**
 * @param snapshots committed design-audit Figma snapshots ({ surface, frames: {…roles…} })
 */
export function checkFigma(c, snapshots = []) {
  const out = [];
  const F = 'figma';
  const fig = c.figma;
  if (!fig)
    return c.status?.web && IMPLEMENTED.has(c.status.web) ? [warn(F, 'no figma section')] : [];

  const allStates = new Set(stateNames(c));
  let product = 1;
  for (const [axis, def] of Object.entries(fig.axes)) {
    product *= Object.keys(def.values).length;
    const targets = Object.values(def.values);
    if (new Set(targets).size !== targets.length)
      out.push(err(F, `axis ${axis}: two Figma values map to the same contract value`));
    if (def.property) {
      const p = c.properties?.[def.property];
      if (!p || p.type !== 'enum') {
        out.push(err(F, `axis ${axis} → '${def.property}' is not an enum property`));
        continue;
      }
      const want = Object.keys(p.values);
      for (const t of targets)
        if (!want.includes(t))
          out.push(err(F, `axis ${axis}: '${t}' is not a ${def.property} value`));
      for (const v of want)
        if (!targets.includes(v))
          out.push(err(F, `axis ${axis}: ${def.property} value '${v}' has no Figma variant`));
    } else {
      for (const t of targets)
        if (!allStates.has(t)) out.push(err(F, `axis ${axis}: '${t}' is not a contract state`));
      for (const s of Object.keys(c.states.shared))
        if (!targets.includes(s))
          out.push(err(F, `axis ${axis}: shared state '${s}' has no Figma variant`));
    }
  }
  if (fig['variant-count'] && fig['variant-count'] !== product)
    out.push(err(F, `variant-count ${fig['variant-count']} ≠ product of axis values (${product})`));

  const mapped = new Set(Object.values(fig['component-properties'] ?? {}).map((x) => x.slot));
  for (const [prop, { slot }] of Object.entries(fig['component-properties'] ?? {}))
    if (!(slot in (c.slots ?? {})))
      out.push(err(F, `component property '${prop}' → '${slot}' is not a slot`));
  for (const slot of Object.keys(c.slots ?? {}))
    if (!mapped.has(slot)) out.push(warn(F, `slot '${slot}' has no Figma component property`));

  // Committed Figma snapshots: every instance of this set must use known axes/values.
  let seen = 0;
  for (const snap of snapshots)
    for (const [frameId, frame] of Object.entries(snap.frames ?? {}))
      for (const [role, node] of Object.entries(frame.roles ?? {})) {
        const comp = node?.component;
        if (!comp) continue;
        const sameSet = fig['node-id']
          ? comp.setId === fig['node-id']
          : comp.set === fig['component-set'];
        if (!sameSet) continue;
        seen++;
        const at = `snapshot ${snap.surface} ${frameId}/${role}`;
        if (comp.set !== fig['component-set'])
          out.push(
            err(
              F,
              `${at}: component set is named '${comp.set}', contract says '${fig['component-set']}'`,
            ),
          );
        for (const [axis, value] of Object.entries(comp.props ?? {})) {
          const def = fig.axes[axis];
          if (!def) {
            if (!(axis in (fig['component-properties'] ?? {})))
              out.push(err(F, `${at}: Figma property '${axis}' is not in the contract`));
          } else if (!(value in def.values))
            out.push(err(F, `${at}: ${axis}='${value}' is not a known Figma value`));
        }
      }
  if (snapshots.length && seen === 0)
    out.push(warn(F, `no instance of '${fig['component-set']}' in the committed Figma snapshots`));
  return out;
}

// ---------------------------------------------------------------- 6. web-reference

/**
 * @param read (repoPath) → file text, or null when missing
 */
export function checkWebReference(c, read, irs) {
  const out = [];
  const W = 'web-reference';
  if (!IMPLEMENTED.has(c.status?.web)) return out;
  const ref = c.references?.web;
  if (!ref) return [err(W, `web is ${c.status.web} but references.web is missing`)];

  const source = read(ref.source);
  if (source == null) return [err(W, `${ref.source} not found`)];
  for (const k of ['styles', 'stories'])
    if (ref[k] && read(ref[k]) == null) out.push(err(W, `${ref[k]} not found`));
  out.push(...checkSourceApi(c, source, ref.source, W, 'web'));

  // Token set: what the styles reference ↔ what the contract binds.
  if (ref.styles && read(ref.styles) != null) {
    const types = new Map(irs[0].tokens.map((t) => [t.path, t.type]));
    const used = new Set(
      parseCss(read(ref.styles)).flatMap((r) => r.decls.flatMap(([, v]) => varRefs(v))),
    );
    const covered = new Set();
    for (const path of contractTokenSet(c)) {
      const css = `--${path.replace(/\./g, '-')}`;
      const hits =
        types.get(path) === 'typography'
          ? [...used].filter((v) => v.startsWith(`${css}-`))
          : used.has(css)
            ? [css]
            : [];
      if (!hits.length) out.push(err(W, `contract token '${path}' is not used by ${ref.styles}`));
      hits.forEach((h) => covered.add(h));
    }
    for (const v of used)
      if (!covered.has(v))
        out.push(err(W, `${ref.styles} uses ${v}, which the contract does not bind`));
  }
  return out;
}

const contractTokenSet = (c) =>
  new Set(
    tokenLeaves(c)
      .map((l) => l.value)
      .filter((v) => v !== 'none'),
  );

/** Enum unions `<Component><Prop>`, accepted properties and literal defaults in a source file. */
function checkSourceApi(c, source, file, check, label) {
  const out = [];
  for (const [name, p] of enumProps(c)) {
    const typeName = `${c.component}${pascal(name)}`;
    const m = source.match(new RegExp(`type\\s+${typeName}\\s*=([^;]+);`));
    if (!m) {
      out.push(err(check, `${file}: no union type ${typeName} for property '${name}'`));
      continue;
    }
    const got = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
    const want = Object.keys(p.values).sort();
    if (got.join() !== want.join())
      out.push(
        err(check, `${typeName} [${got.join(', ')}] ≠ contract ${name} [${want.join(', ')}]`),
      );
  }
  for (const [name, p] of Object.entries(c.properties ?? {})) {
    if (!new RegExp(`\\b${name}\\b`).test(source))
      out.push(err(check, `${file}: property '${name}' not found`));
    const d = source.match(new RegExp(`\\b${name}\\s*=\\s*('([^']*)'|true|false)`));
    if (d) {
      const got = d[2] ?? d[1];
      if (String(p.default) !== got)
        out.push(err(check, `default ${name}: ${label} '${got}' ≠ contract '${p.default}'`));
    }
  }
  return out;
}

// ---------------------------------------------------------------- 7. react-native-reference

/** Quoted contract token paths (`'color.action.primary.default'`, `'none'` excluded). */
const TOKEN_LITERAL = /'((?:color|space|radius|text|icon|motion|elevation|layout)\.[a-z0-9.-]+)'/g;

/**
 * @param read (repoPath) → file text, or null when missing
 */
export function checkReactNativeReference(c, read) {
  const out = [];
  const R = 'react-native-reference';
  const status = c.status?.['react-native'];
  if (!IMPLEMENTED.has(status)) return out;
  const ref = c.references?.['react-native'];
  if (!ref) return [err(R, `react-native is ${status} but references.react-native is missing`)];

  const source = read(ref.source);
  if (source == null) return [err(R, `${ref.source} not found`)];
  for (const k of ['styles', 'stories'])
    if (ref[k] && read(ref[k]) == null) out.push(err(R, `${ref[k]} not found`));
  out.push(...checkSourceApi(c, source, ref.source, R, 'react-native'));

  // Token set: the token map's path literals ↔ what the contract binds.
  const map = ref.styles && read(ref.styles);
  if (map) {
    const used = new Set([...map.matchAll(TOKEN_LITERAL)].map((m) => m[1]));
    const bound = contractTokenSet(c);
    for (const path of bound)
      if (!used.has(path))
        out.push(err(R, `contract token '${path}' is not used by ${ref.styles}`));
    for (const path of used)
      if (!bound.has(path))
        out.push(err(R, `${ref.styles} uses '${path}', which the contract does not bind`));
  }
  return out;
}

// ---------------------------------------------------------------- all

export function checkContract({ text, contract, validate, irs, snapshots, read, file }) {
  const findings = checkSchema(validate, contract);
  if (findings.length) return findings; // cross-checks assume a well-formed contract
  const expected = `${kebab(contract.component)}.contract.yaml`;
  if (file && !file.endsWith(expected))
    findings.push(err('references', `file must be named ${expected} (ADR 0015)`));
  return [
    ...findings,
    ...checkPlatformApi(text),
    ...checkReferences(contract),
    ...checkTokens(contract, irs),
    ...checkFigma(contract, snapshots),
    ...checkWebReference(contract, read, irs),
    ...checkReactNativeReference(contract, read),
  ];
}
