/**
 * Design audit engine — pure, deterministic comparison of a normalized Figma snapshot against
 * the repo's code, for one surface contract. Reads files only; never writes anything.
 *
 * Statuses:
 *   PASS             Figma and code agree (token identity AND resolved value, where both exist)
 *   DRIFT            they disagree, and no matching known difference covers it
 *   KNOWN_DIFFERENCE they disagree in exactly the way a known-differences.json entry records
 *   ERROR            the check could not be evaluated (missing node/selector/token, invalid
 *                    snapshot, stale or orphaned known difference, non-literal code value)
 */
import fs from 'node:fs';
import path from 'node:path';

import { getDeclaration, parseCss, varRefs } from './css.mjs';
import { elementOrder, findElements, textOfClass } from './jsx.mjs';
import { toPx } from './tokens.mjs';
import { extractorVersion, validateSnapshot } from './snapshot.mjs';

export const STATUSES = ['PASS', 'DRIFT', 'KNOWN_DIFFERENCE', 'ERROR'];

class CheckError extends Error {}
const fail = (msg) => {
  throw new CheckError(msg);
};

const TYPOGRAPHY_PROPS = [
  ['font-family', 'fontFamily'],
  ['font-size', 'fontSize'],
  ['font-weight', 'fontWeight'],
  ['line-height', 'lineHeight'],
  ['letter-spacing', 'letterSpacing'],
];

/** Code-side reader bound to one contract (file aliases) and an optional in-memory override. */
function createCodeReader(contract, { root, overrides = {} }) {
  const cache = new Map();
  const fileFor = (alias) => contract.files[alias] ?? fail(`unknown file alias "${alias}"`);
  const read = (alias) => {
    const rel = fileFor(alias);
    if (rel in overrides) return overrides[rel];
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) fail(`file not found: ${rel}`);
    return fs.readFileSync(abs, 'utf8');
  };
  const css = (alias) => {
    if (!cache.has(alias)) cache.set(alias, parseCss(read(alias)));
    return cache.get(alias);
  };
  const decl = (alias, selector, property) => {
    const v = getDeclaration(css(alias), selector, property);
    if (v === null) fail(`${fileFor(alias)}: no \`${property}\` declared for \`${selector}\``);
    return v;
  };
  /** Literal JSX prop (or declared default when absent). Returns { value, display }. */
  const prop = ({ file, element, name, default: def, index = 0 }) => {
    const el = findElements(read(file), element)[index];
    if (!el) fail(`${fileFor(file)}: no <${element}> element (#${index})`);
    if (!(name in el.props)) {
      if (def === undefined) fail(`${fileFor(file)}: <${element}> has no \`${name}\` prop`);
      return { value: def, display: `${String(def)} (default)` };
    }
    const v = el.props[name];
    if (v && typeof v === 'object')
      fail(`${fileFor(file)}: <${element} ${name}={${v.expression}}> is not a literal`);
    return { value: v, display: String(v) };
  };
  return { read, decl, prop, fileFor };
}

/** Resolve a dotted path inside a frame: role paths, or `$frame` fields. */
function figmaGet(frame, p) {
  const segs = p.split('.');
  let cur = segs[0].startsWith('$') ? frame[segs.shift().slice(1)] : frame.roles;
  for (const s of segs) {
    if (cur === null || cur === undefined) break;
    cur = cur[s];
  }
  if (cur === undefined || cur === null) fail(`Figma snapshot has no \`${p}\` for this frame`);
  return cur;
}

const asList = (v) => (Array.isArray(v) ? v : [v]);
const fmtPx = (n) => `${Math.round(n * 100) / 100}px`;

function resolvedDisplay(tokens, tokenPath, brand) {
  const v = tokens.resolve(tokenPath, brand);
  if (typeof v === 'string' && v.startsWith('#')) return v.toLowerCase();
  const px = toPx(v);
  return px === null ? JSON.stringify(v) : fmtPx(px);
}

/** Code value for a token/px/enum check: { raw, display, selectorNote }. */
function codeCssValue(reader, spec) {
  if (spec.cssFromProp) {
    const p = reader.prop(spec.cssFromProp);
    const selector = spec.selectors
      ? (spec.selectors[String(p.value)] ?? fail(`no selector mapped for prop value ${p.value}`))
      : spec.selector.replace('{value}', String(p.value));
    return {
      raw: reader.decl(spec.css, selector, spec.property),
      via: `${spec.cssFromProp.name}=${p.display}`,
    };
  }
  if (spec.css) {
    const props = asList(spec.property ?? spec.properties);
    return { raw: props.map((pr) => reader.decl(spec.css, spec.selector, pr)).join(' / ') };
  }
  if (spec.prop) {
    const names = asList(spec.prop.name ?? spec.prop.names);
    const vals = names.map((name) => reader.prop({ ...spec.prop, name }));
    return {
      raw: vals.map((v) => String(v.value)).join(' / '),
      display: vals.map((v) => v.display).join(' / '),
    };
  }
  if (spec.match) {
    const { file, pattern, then: yes, else: no } = spec.match;
    return { raw: new RegExp(pattern).test(reader.read(file)) ? yes : no };
  }
  if (spec.text) {
    const { file, className, element, index = 0 } = spec.text;
    let t;
    if (className) t = textOfClass(reader.read(file), className);
    else {
      const el = findElements(reader.read(file), element)[index];
      if (!el) fail(`${reader.fileFor(file)}: no <${element}> element`);
      if (spec.text.prop) {
        t = el.props[spec.text.prop];
      } else {
        const src = reader.read(file);
        const close = src.indexOf(`</${element}>`, el.end);
        t = close < 0 ? null : src.slice(el.end, close).replace(/\s+/g, ' ').trim();
      }
    }
    if (t === null || t === undefined) fail(`code text not found (${JSON.stringify(spec.text)})`);
    if (typeof t === 'object') fail(`code text is an expression, not static copy: ${t.expression}`);
    return { raw: t };
  }
  return fail(`unsupported code spec ${JSON.stringify(spec)}`);
}

// ---------------------------------------------------------------------------------------------
// Comparators. Each returns { status: 'PASS'|'DRIFT', figma, code, notes[] } or throws.

const comparators = {
  token({ check, frame, reader, tokens, brand }) {
    const objs = asList(check.figma).map((p) => figmaGet(frame, p));
    const notes = [];
    const names = [...new Set(objs.map((o) => o.token ?? null))];
    const describeFigma = (o) =>
      o.token ? `${o.token} (${o.hex ?? fmtPx(o.px)})` : `${o.hex ?? fmtPx(o.px)} (unbound)`;
    const figma = [...new Set(objs.map(describeFigma))].join(' | ');

    const cv = codeCssValue(reader, check.code);
    const refs = varRefs(cv.raw);
    const codePaths = refs.map((r) => {
      const hit = tokens.cssVar(r);
      if (!hit) fail(`code references \`${r}\`, which is not a token in src/tokens`);
      return hit.path;
    });
    const codeDisplay = refs.length
      ? refs.map((r, i) => `${r} (${resolvedDisplay(tokens, codePaths[i], brand)})`).join(' ')
      : `${cv.raw} (raw value)`;
    const code = cv.via ? `${cv.via} → ${codeDisplay}` : codeDisplay;

    if (names.length > 1) {
      notes.push('Figma sides disagree with each other.');
      return { status: 'DRIFT', figma, code, notes };
    }
    if (!names[0]) {
      notes.push('Figma value is not bound to a variable.');
      return { status: 'DRIFT', figma, code, notes };
    }
    const figmaPath = tokens.fromFigmaVariable(names[0]);
    if (!figmaPath || !tokens.has(figmaPath))
      fail(`Figma variable "${names[0]}" has no matching token in src/tokens`);
    if (!refs.length) {
      notes.push('Code uses a raw value, not a token.');
      return { status: 'DRIFT', figma, code, notes };
    }
    if (codePaths.length !== 1 || codePaths[0] !== figmaPath) {
      notes.push(`Figma token ${figmaPath} ≠ code token ${codePaths.join(' + ')}.`);
      return { status: 'DRIFT', figma, code, notes };
    }
    // Same token identity — now confirm the Figma variable VALUE matches the code token value
    // in this frame's brand (catches variable-value drift, e.g. a Brand mode edited in Figma).
    const resolved = resolvedDisplay(tokens, figmaPath, brand);
    for (const o of objs) {
      const figmaVal = o.hex ? o.hex.toLowerCase() : fmtPx(o.px);
      if (figmaVal !== resolved) {
        notes.push(
          `Same token, different value: Figma ${figmaVal} vs code ${resolved} (${brand}).`,
        );
        return { status: 'DRIFT', figma, code, notes };
      }
    }
    return { status: 'PASS', figma, code, notes };
  },

  px({ check, frame, reader, tokens, brand }) {
    const v = figmaGet(frame, check.figma);
    const figmaPx = typeof v === 'number' ? v : v.px;
    const cv = codeCssValue(reader, check.code);
    const refs = varRefs(cv.raw);
    let codePx;
    if (refs.length === 1) {
      const hit = tokens.cssVar(refs[0]) ?? fail(`unknown token ${refs[0]}`);
      codePx = toPx(tokens.resolve(hit.path, brand));
    } else codePx = toPx(cv.raw);
    if (codePx === null) fail(`cannot read a pixel value from \`${cv.raw}\``);
    const code = cv.via ? `${cv.via} / ${cv.raw}` : cv.raw;
    return {
      status: codePx === figmaPx ? 'PASS' : 'DRIFT',
      figma: fmtPx(figmaPx),
      code,
      notes: [],
    };
  },

  enum({ check, frame, reader }) {
    const raw = asList(check.figma).map((p) => figmaGet(frame, p));
    const mapped = raw.map((v) => (check.map && v in check.map ? check.map[v] : v));
    const cv = codeCssValue(reader, check.code);
    const norm = (s) => String(s).trim().toLowerCase();
    return {
      status: norm(mapped.join(' / ')) === norm(cv.raw) ? 'PASS' : 'DRIFT',
      figma: raw.join(' / '),
      code: cv.display ?? cv.raw,
      notes: [],
    };
  },

  text({ check, frame, reader }) {
    const figma = String(figmaGet(frame, check.figma));
    const cv = codeCssValue(reader, check.code);
    return {
      status: figma === String(cv.raw) ? 'PASS' : 'DRIFT',
      figma: JSON.stringify(figma),
      code: JSON.stringify(String(cv.raw)),
      notes: [],
    };
  },

  typography({ check, frame, reader, tokens, brand }) {
    const node = figmaGet(frame, check.figma);
    const text = node.text ?? fail('Figma node has no text properties');
    const figma = text.style
      ? `${text.style} (${text.fontFamily} ${text.fontSize}px)`
      : `unstyled (${text.fontFamily} ${text.fontSize}px)`;
    const { css, selector } = check.code.typography;
    const parts = TYPOGRAPHY_PROPS.map(([cssProp, sub]) => {
      const refs = varRefs(reader.decl(css, selector, cssProp));
      const hit = refs.length === 1 ? tokens.cssVar(refs[0]) : null;
      return hit && hit.sub === sub ? hit.path : null;
    });
    const roles = [...new Set(parts)];
    const role = roles.length === 1 && roles[0] ? roles[0] : null;
    const code = role ? `${tokens.toCssVar(role)}-*` : 'mixed / raw typography declarations';
    const notes = [];
    if (!text.style) {
      notes.push('Figma text has no text style applied.');
      return { status: 'DRIFT', figma, code, notes };
    }
    const figmaRole = tokens.fromFigmaTextStyle(text.style);
    if (!tokens.has(figmaRole) || tokens.type(figmaRole) !== 'typography')
      fail(`Figma text style "${text.style}" has no typography token in src/tokens`);
    if (role !== figmaRole) {
      notes.push(`Figma role ${figmaRole} ≠ code ${role ?? '(not a single role)'}.`);
      return { status: 'DRIFT', figma, code, notes };
    }
    const fam = asList(tokens.resolve(role, brand, 'fontFamily'))[0];
    const size = toPx(tokens.resolve(role, brand, 'fontSize'));
    const codeFull = `${code} (${fam} ${fmtPx(size)})`;
    if (fam !== text.fontFamily || size !== text.fontSize) {
      notes.push(`Same role, different resolved font in ${brand}.`);
      return { status: 'DRIFT', figma, code: codeFull, notes };
    }
    return { status: 'PASS', figma, code: codeFull, notes };
  },

  componentOrder({ frame, reader, contract, frameDef }) {
    const map = contract.components;
    const figmaList = frame.componentOrder.map((n) => map[n] ?? `${n} (unmapped)`);
    const tracked = Object.values(map);
    const codeList = elementOrder(reader.read(contract.componentOrderFile ?? 'screen'), tracked)
      .filter((e) => !e.guard || frameDef.codeState?.[e.guard])
      .map((e) => e.name);
    return {
      status: figmaList.join(' → ') === codeList.join(' → ') ? 'PASS' : 'DRIFT',
      figma: figmaList.join(' → '),
      code: codeList.join(' → '),
      notes: [],
    };
  },

  brandMode({ frame, frameDef, contract, tokens }) {
    const bm = frame.brandMode;
    const figmaBrand = contract.brandModes[bm.name] ?? null;
    const known = tokens.brands.includes(frameDef.brand);
    if (!known) fail(`contract brand "${frameDef.brand}" has no src/tokens/brands/ directory`);
    return {
      status: figmaBrand === frameDef.brand ? 'PASS' : 'DRIFT',
      figma: `${bm.name} (${bm.explicit ? 'explicit mode' : 'collection default'})`,
      code: `${frameDef.brand} (data-brand)`,
      notes: figmaBrand ? [] : [`Figma mode "${bm.name}" is not mapped in contract.brandModes.`],
    };
  },
};

// ---------------------------------------------------------------------------------------------

function matchKnownDifference(kds, surface, row) {
  return kds.filter(
    (kd) =>
      kd.surface === surface &&
      kd.check === row.check &&
      (!kd.frames || kd.frames.includes(row.frame)),
  );
}

/**
 * Run one surface. Returns { surface, title, snapshot, results[], summary }.
 * @param {object} o
 * @param {object} o.contract      surfaces/<surface>.json
 * @param {object} o.snapshot      normalized Figma snapshot
 * @param {object[]} o.knownDifferences  known-differences.json entries (all surfaces)
 * @param {object} o.tokens        loadTokens() result
 * @param {string} [o.root]        repo root for code files
 * @param {object} [o.codeOverrides]  { 'repo/relative/path': 'file contents' } — tests only
 */
export function runAudit({
  contract,
  snapshot,
  knownDifferences = [],
  tokens,
  root = '.',
  codeOverrides,
}) {
  const results = [];
  const base = { surface: contract.surface };
  const snapshotErrors = validateSnapshot(snapshot, contract);
  const ex = contract.figma.extractor;
  const exFile = path.join(root, ex.file);
  const fileVersion = fs.existsSync(exFile) ? extractorVersion(exFile) : null;
  if (fileVersion !== ex.version)
    snapshotErrors.push(
      `${ex.file} declares version ${fileVersion}, contract expects ${ex.version} — bump the ` +
        'contract and refresh the snapshot together',
    );
  if (snapshotErrors.length) {
    for (const e of snapshotErrors)
      results.push({
        ...base,
        check: 'snapshot',
        property: 'Figma snapshot',
        frame: '*',
        scope: contract.figma.snapshot,
        status: 'ERROR',
        figma: '—',
        code: '—',
        notes: [e],
      });
    return finish(contract, snapshot, results);
  }

  const reader = createCodeReader(contract, { root, overrides: codeOverrides });
  const usedKds = new Set();
  const surfaceKds = knownDifferences.filter((kd) => kd.surface === contract.surface);

  for (const check of contract.checks) {
    const frameKeys = check.frames ?? Object.keys(contract.frames);
    for (const key of frameKeys) {
      const frameDef = contract.frames[key] ?? fail(`check ${check.id}: unknown frame ${key}`);
      const frame = snapshot.frames[key];
      const row = {
        ...base,
        check: check.id,
        property: check.property,
        frame: key,
        frameLabel: frameDef.label,
        brand: frameDef.brand,
        scope: `${frameDef.label} · ${frameDef.brand}`,
        status: 'ERROR',
        figma: '—',
        code: '—',
        notes: [],
      };
      try {
        const cmp = comparators[check.compare] ?? fail(`unknown comparator "${check.compare}"`);
        Object.assign(
          row,
          cmp({ check, frame, frameDef, reader, tokens, brand: frameDef.brand, contract }),
        );
      } catch (err) {
        if (!(err instanceof CheckError)) throw err;
        row.status = 'ERROR';
        row.notes = [err.message];
      }
      if (check.notes) row.notes.push(check.notes);

      const kds = matchKnownDifference(surfaceKds, contract.surface, row);
      for (const kd of kds) usedKds.add(kd.id);
      if (kds.length && row.status !== 'ERROR') {
        const kd = kds[0];
        const exact = kd.figma === row.figma && kd.code === row.code;
        if (row.status === 'DRIFT' && exact) {
          row.status = 'KNOWN_DIFFERENCE';
          row.knownDifference = { id: kd.id, reason: kd.reason, scope: kd.scope, doc: kd.doc };
        } else if (row.status === 'DRIFT') {
          row.notes.push(
            `Known difference ${kd.id} exists but records different values ` +
              `(Figma ${JSON.stringify(kd.figma)}, code ${JSON.stringify(kd.code)}) — ` +
              're-review before updating it.',
          );
        } else {
          row.status = 'ERROR';
          row.notes.push(
            `Stale known difference ${kd.id}: Figma and code now agree — remove the entry ` +
              'from scripts/design-audit/known-differences.json.',
          );
        }
      }
      results.push(row);
    }
  }

  for (const kd of surfaceKds) {
    if (usedKds.has(kd.id)) continue;
    results.push({
      ...base,
      check: kd.check,
      property: `Known difference ${kd.id}`,
      frame: (kd.frames ?? ['*']).join(', '),
      scope: kd.scope ?? '—',
      status: 'ERROR',
      figma: kd.figma ?? '—',
      code: kd.code ?? '—',
      notes: [`Orphaned known difference: no check "${kd.check}" in this surface's contract.`],
    });
  }
  return finish(contract, snapshot, results);
}

function finish(contract, snapshot, results) {
  const summary = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of results) summary[r.status]++;
  return {
    surface: contract.surface,
    title: contract.title,
    snapshot: snapshot
      ? {
          path: contract.figma.snapshot,
          capturedAt: snapshot.capturedAt ?? null,
          checksum: snapshot.checksum ?? null,
          extractor: snapshot.extractor ?? null,
        }
      : null,
    summary,
    results,
  };
}

/** Validate known-differences.json entries (shape only). Returns problems. */
export function validateKnownDifferences(kds) {
  const errors = [];
  if (!Array.isArray(kds)) return ['known-differences.json must be an array'];
  const ids = new Set();
  for (const [i, kd] of kds.entries()) {
    for (const f of ['id', 'surface', 'check', 'figma', 'code', 'scope', 'reason'])
      if (typeof kd[f] !== 'string' || !kd[f].trim())
        errors.push(`entry #${i} (${kd.id ?? '?'}): \`${f}\` is required`);
    if (kd.frames !== undefined && !Array.isArray(kd.frames))
      errors.push(`entry ${kd.id}: \`frames\` must be an array`);
    if (ids.has(kd.id)) errors.push(`duplicate known difference id ${kd.id}`);
    ids.add(kd.id);
  }
  return errors;
}
