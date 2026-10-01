/**
 * Design audit tests — `npm run design:audit:test` (node:test, no extra dependencies).
 *
 * Fixtures are derived in memory from the committed snapshot (Figma-side mismatches) and
 * from in-memory code overrides (code-side mismatches), so no production file — and no
 * committed snapshot — is ever modified by a test.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { runAudit, validateKnownDifferences } from '../lib/audit.mjs';
import { getDeclaration, parseCss, varRefs } from '../lib/css.mjs';
import { elementOrder, findElements, parseAttributes, textOfClass } from '../lib/jsx.mjs';
import { checksum } from '../lib/snapshot.mjs';
import { loadTokens, toPx } from '../lib/tokens.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const contract = readJson('scripts/design-audit/surfaces/login.json');
const baseSnapshot = readJson(contract.figma.snapshot);
const knownDifferences = readJson('scripts/design-audit/known-differences.json');
const tokens = loadTokens({ root: path.join(ROOT, 'src/tokens') });

/** Deep-cloned snapshot with `mutate(frames)` applied and the checksum re-sealed. */
function fixture(mutate) {
  const snap = structuredClone(baseSnapshot);
  mutate(snap.frames);
  snap.checksum = checksum(JSON.stringify(snap.frames));
  return snap;
}

function audit({ snapshot = baseSnapshot, kds = knownDifferences, overrides, c = contract } = {}) {
  return runAudit({
    contract: structuredClone(c),
    snapshot,
    knownDifferences: kds,
    tokens,
    root: ROOT,
    codeOverrides: overrides,
  });
}

const rows = (rep, check, frame) =>
  rep.results.filter((r) => r.check === check && (!frame || r.frame === frame));
const statusOf = (rep, check, frame) => [...new Set(rows(rep, check, frame).map((r) => r.status))];

/** Override one code file with a string replacement (asserting the target text exists). */
function override(file, from, to) {
  const src = read(file);
  const found = typeof from === 'string' ? src.includes(from) : from.test(src);
  assert.ok(found, `fixture setup: "${from}" not found in ${file}`);
  return { [file]: src.replace(from, to) };
}

describe('clean committed state', () => {
  const rep = audit();
  it('reports only PASS and KNOWN_DIFFERENCE', () => {
    assert.equal(
      rep.summary.DRIFT,
      0,
      JSON.stringify(
        rep.results.filter((r) => r.status === 'DRIFT'),
        null,
        2,
      ),
    );
    assert.equal(
      rep.summary.ERROR,
      0,
      JSON.stringify(
        rep.results.filter((r) => r.status === 'ERROR'),
        null,
        2,
      ),
    );
    assert.ok(rep.summary.PASS > 0);
  });
  it('reports the documented platform differences distinctly, with reason and doc', () => {
    for (const check of ['form-structure', 'row-wrap', 'row-gap']) {
      for (const r of rows(rep, check)) {
        assert.equal(r.status, 'KNOWN_DIFFERENCE', check);
        assert.ok(r.knownDifference.reason && r.knownDifference.doc && r.knownDifference.id);
      }
    }
  });
  it('covers every contract frame, including the Brand B preview', () => {
    assert.deepEqual(statusOf(audit(), 'brand-mode', 'B-01b'), ['PASS']);
    assert.match(rows(rep, 'card-radius', 'B-01b')[0].code, /16px/);
    assert.match(rows(rep, 'card-radius', '01')[0].code, /12px/);
  });
});

describe('Figma-side drift (fixture snapshots)', () => {
  it('detects a changed spacing token (card density)', () => {
    const rep = audit({
      snapshot: fixture((f) => {
        f['01'].roles.content.layout.gap = { px: 16, token: 'Semantic Space/stack/lg' };
      }),
    });
    assert.deepEqual(statusOf(rep, 'card-content-gap', '01'), ['DRIFT']);
    assert.deepEqual(statusOf(rep, 'form-gap', '01'), ['DRIFT']);
    assert.deepEqual(statusOf(rep, 'card-content-gap', '01b'), ['PASS']);
  });
  it('detects a changed card width', () => {
    const rep = audit({ snapshot: fixture((f) => (f['01b'].roles.card.width = 400)) });
    assert.deepEqual(statusOf(rep, 'card-width', '01b'), ['DRIFT']);
  });
  it('detects variable-value drift even when the token name matches', () => {
    const rep = audit({ snapshot: fixture((f) => (f['01'].roles.card.radius.px = 16)) });
    const [r] = rows(rep, 'card-radius', '01');
    assert.equal(r.status, 'DRIFT');
    assert.match(r.notes.join(' '), /Same token, different value/);
  });
  it('detects an unbound (hard-coded) Figma value', () => {
    const rep = audit({
      snapshot: fixture((f) => (f['01'].roles.title.fill = { token: null, hex: '#111827' })),
    });
    assert.deepEqual(statusOf(rep, 'title-color', '01'), ['DRIFT']);
  });
  it('detects a wrong brand mode on the Brand B preview', () => {
    const rep = audit({
      snapshot: fixture((f) => (f['B-01b'].brandMode = { name: 'Brand A', explicit: false })),
    });
    assert.deepEqual(statusOf(rep, 'brand-mode', 'B-01b'), ['DRIFT']);
  });
  it('detects component usage / variant changes', () => {
    const rep = audit({
      snapshot: fixture((f) => {
        f['01'].componentOrder = ['Input', 'Password Input', 'Link', 'Button'];
        f['01b'].roles.submit.component.props.Variant = 'Secondary';
      }),
    });
    assert.deepEqual(statusOf(rep, 'component-order', '01'), ['DRIFT']);
    assert.deepEqual(statusOf(rep, 'submit-variant', '01b'), ['DRIFT']);
  });
  it('detects a changed text style role', () => {
    const rep = audit({
      snapshot: fixture((f) => (f['01'].roles.title.text.style = 'text/heading/md/semibold')),
    });
    assert.deepEqual(statusOf(rep, 'title-typography', '01'), ['DRIFT']);
  });
});

describe('code-side drift (in-memory overrides — no files touched)', () => {
  it('detects a different token in code', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.css',
        'gap: var(--space-stack-md);',
        'gap: var(--space-stack-lg);',
      ),
    });
    assert.deepEqual(statusOf(rep, 'form-gap'), ['DRIFT']);
  });
  it('detects a raw value replacing a token, even when the pixels match', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.css',
        'gap: var(--space-stack-md);',
        'gap: 12px;',
      ),
    });
    const r = rows(rep, 'form-gap', '01')[0];
    assert.equal(r.status, 'DRIFT');
    assert.match(r.notes.join(' '), /raw value/);
  });
  it('detects a layout prop change (card width / density)', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.tsx',
        /width="regular"\s+compact/, // line-ending agnostic (CRLF checkouts)
        'width="narrow"',
      ),
    });
    assert.deepEqual(statusOf(rep, 'card-width'), ['DRIFT']);
    assert.deepEqual(statusOf(rep, 'card-content-gap'), ['DRIFT']);
  });
  it('fails the run (non-zero exit semantics)', () => {
    const rep = audit({
      overrides: override('src/examples/Login/LoginScreen.tsx', 'Welcome back', 'Welcome'),
    });
    assert.ok(rep.summary.DRIFT > 0);
  });
});

describe('known differences', () => {
  it('a known difference whose recorded values no longer match is DRIFT, not hidden', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.css',
        'flex-wrap: wrap;',
        'flex-wrap: wrap-reverse;',
      ),
    });
    const r = rows(rep, 'row-wrap', '01')[0];
    assert.equal(r.status, 'DRIFT');
    assert.match(r.notes.join(' '), /Known difference login-row-wrap exists but records/);
  });
  it('a stale known difference (Figma and code now agree) is ERROR', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.css',
        'flex-wrap: wrap;',
        'flex-wrap: nowrap;',
      ),
    });
    const r = rows(rep, 'row-wrap', '01')[0];
    assert.equal(r.status, 'ERROR');
    assert.match(r.notes.join(' '), /Stale known difference login-row-wrap/);
  });
  it('an orphaned known difference (unknown check) is ERROR', () => {
    const rep = audit({
      kds: [
        ...knownDifferences,
        {
          id: 'orphan',
          surface: 'login',
          check: 'no-such-check',
          figma: 'x',
          code: 'y',
          scope: 's',
          reason: 'r',
        },
      ],
    });
    assert.deepEqual(statusOf(rep, 'no-such-check'), ['ERROR']);
  });
  it('without the known-differences file the same mismatches are DRIFT', () => {
    const rep = audit({ kds: [] });
    assert.deepEqual(statusOf(rep, 'row-wrap'), ['DRIFT']);
    assert.equal(rep.summary.KNOWN_DIFFERENCE, 0);
  });
  it('validates entry shape', () => {
    assert.deepEqual(validateKnownDifferences(knownDifferences), []);
    assert.ok(validateKnownDifferences([{ id: 'a', surface: 'login' }]).length > 0);
  });
});

describe('ERROR conditions', () => {
  it('rejects a tampered / truncated snapshot (checksum)', () => {
    const snap = structuredClone(baseSnapshot);
    snap.frames['01'].roles.card.width = 999; // not re-sealed
    const rep = audit({ snapshot: snap });
    assert.equal(rep.summary.PASS, 0);
    assert.match(rep.results.map((r) => r.notes.join(' ')).join(' '), /checksum mismatch/);
  });
  it('rejects a snapshot missing a contract frame', () => {
    const rep = audit({ snapshot: fixture((f) => delete f['B-01b']) });
    assert.ok(rep.summary.ERROR > 0);
    assert.equal(rep.summary.PASS, 0);
  });
  it('rejects a snapshot from a different extractor version', () => {
    const snap = structuredClone(baseSnapshot);
    snap.extractor.version = 1;
    const rep = audit({ snapshot: snap });
    assert.match(rep.results[0].notes[0], /re-run the extractor/);
  });
  it('reports a missing Figma role as ERROR, not PASS', () => {
    const rep = audit({ snapshot: fixture((f) => delete f['01b'].roles.alert) });
    assert.deepEqual(statusOf(rep, 'alert-status', '01b'), ['ERROR']);
  });
  it('reports a missing CSS selector as ERROR', () => {
    const rep = audit({
      overrides: override(
        'src/examples/Login/LoginScreen.css',
        '.ds-example-login__submit {',
        '.ds-example-login__cta {',
      ),
    });
    assert.deepEqual(statusOf(rep, 'submit-width'), ['ERROR']);
  });
});

describe('CLI (npm run design:audit)', () => {
  const cli = (args) =>
    spawnSync(process.execPath, ['scripts/design-audit/audit.mjs', '--no-json', ...args], {
      cwd: ROOT,
      encoding: 'utf8',
    });
  it('exits 0 on the committed clean state', () => {
    const res = cli([]);
    assert.equal(res.status, 0, res.stdout + res.stderr);
    assert.match(res.stdout, /DRIFT 0/);
  });
  it('exits 1 on a drift fixture snapshot', () => {
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'design-audit-')), 'drift.json');
    fs.writeFileSync(tmp, JSON.stringify(fixture((f) => (f['01'].roles.card.width = 400))));
    const res = cli(['--surface', 'login', '--snapshot', tmp]);
    assert.equal(res.status, 1);
    assert.match(res.stdout, /DRIFT {2}Login \/ card-width {2}\[01\]/);
  });
});

describe('guardrail: the Figma extractor is read-only', () => {
  const src = read(contract.figma.extractor.file).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
  const MUTATIONS = [
    /figma\.create\w*\(/,
    /\.remove\(/,
    /(?<!varCache)\.set\(/, // node.set(…); the extractor's local Map cache is fine
    /figma\.currentPage\s*=/,
    /setCurrentPageAsync/,
    /\.(appendChild|insertChild|detachInstance|swapComponent|resize\w*|rescale|setProperties|setPluginData|setSharedPluginData|setRelaunchData|setBoundVariable\w*|setExplicitVariableModeForCollection|clearExplicitVariableModeForCollection|setValueForMode|set\w+StyleIdAsync|setRange\w+|loadFontAsync|importComponent\w*|commitUndo|closePlugin|notify)\(/,
    /\b(node|frame|n|child|card|content|page|password|remember|email|main|owner|instance)\.\w+\s*=(?!=)/,
  ];
  for (const re of MUTATIONS) {
    it(`contains no ${re}`, () => assert.doesNotMatch(src, re));
  }
});

describe('unit: readers and token resolution', () => {
  it('parses JSX literal props, booleans, defaults and expressions', () => {
    assert.deepEqual(
      parseAttributes(' width="regular" compact title={\'Hi\'} n={2} on={(e) => f(e > 1)}'),
      {
        width: 'regular',
        compact: true,
        title: 'Hi',
        n: 2,
        on: { expression: '(e) => f(e > 1)' },
      },
    );
    const src = `{error && (\n // note\n <Alert status="danger" />)}<Input label="A" /><p className="x">Don&apos;t</p>`;
    assert.deepEqual(elementOrder(src, ['Alert', 'Input']), [
      { name: 'Alert', guard: 'error' },
      { name: 'Input', guard: null },
    ]);
    assert.equal(findElements(src, 'Input')[0].props.label, 'A');
    assert.equal(textOfClass(src, 'x'), "Don't");
  });
  it('reads CSS declarations and ignores at-rule-scoped ones', () => {
    const rules = parseCss(
      '/* c */ .a, .b { gap: var(--x) var(--y); } @media (min-width: 1px) { .a { gap: 0; } }',
    );
    assert.equal(getDeclaration(rules, '.b', 'gap'), 'var(--x) var(--y)');
    assert.equal(getDeclaration(rules, '.a', 'gap'), 'var(--x) var(--y)');
    assert.deepEqual(varRefs('var(--x) var(--y)'), ['--x', '--y']);
  });
  it('maps Figma variables and CSS custom properties to the same token path', () => {
    assert.equal(tokens.fromFigmaVariable('Semantic Space/stack/md'), 'space.stack.md');
    assert.equal(tokens.fromFigmaVariable('Semantic Radius/container'), 'radius.container');
    assert.equal(tokens.cssVar('--space-stack-md').path, 'space.stack.md');
    assert.deepEqual(tokens.cssVar('--text-heading-sm-semibold-font-size'), {
      path: 'text.heading.sm.semibold',
      sub: 'fontSize',
    });
    assert.equal(tokens.resolve('radius.container', 'brand-a'), 12);
    assert.equal(tokens.resolve('radius.container', 'brand-b'), 16);
    assert.equal(toPx('0.75rem'), 12);
  });
});
