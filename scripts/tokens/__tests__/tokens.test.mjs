/**
 * Token pipeline tests (ADR 0014, 0016) — run: npm run tokens:test
 *
 *   1. Snapshots: every generated output — web CSS/JS (must stay byte-identical) and the React
 *      Native, Swift and Kotlin outputs — is compared with the committed copy in
 *      __snapshots__/. A change fails until it's reviewed and the snapshots are updated with
 *      `npm run tokens:test:update`. CI compiles the committed Swift/Kotlin snapshots.
 *   2. Parity: native outputs expose exactly the semantic `shared` tokens (no Core, brand.* or
 *      web-only), with values that match the IR under the ADR 0016 mappings.
 *   3. The React Native output type-checks under `strict`.
 *   4. The design audit's own token resolver agrees with the IR.
 *   5. Every guardrail fires on a broken input.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { before, describe, test } from 'node:test';

import ts from 'typescript';

import { loadTokens } from '../../design-audit/lib/tokens.mjs';
import { emitKotlin } from '../emit-kotlin.mjs';
import { emitReactNative } from '../emit-react-native.mjs';
import { emitSwift } from '../emit-swift.mjs';
import { emitWeb } from '../emit-web.mjs';
import { loadFontCatalog } from '../fonts.mjs';
import {
  checkBrandContract,
  checkContrast,
  checkFonts,
  checkPlatformOverrides,
  checkScopes,
  checkSharedInvariance,
} from '../guards.mjs';
import { BRANDS, resolveBrand } from '../ir.mjs';
import { nativeModels, segmentName, walk } from '../native.mjs';

const SNAPSHOTS = 'scripts/tokens/__tests__/__snapshots__';
const UPDATE = process.argv.includes('--update') || process.env.UPDATE_SNAPSHOTS === '1';
const norm = (s) => s.replace(/\r\n/g, '\n');

let catalog;
let irs;
let models;
let outputs; // snapshot-relative path → generated contents
let themes; // evaluated React Native module

const listFiles = (dir, base = dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory()
          ? listFiles(p, base)
          : [path.relative(base, p).split(path.sep).join('/')];
      })
    : [];

before(async () => {
  catalog = loadFontCatalog();
  irs = [];
  for (const brand of BRANDS) irs.push(await resolveBrand(brand, { fontCatalog: catalog }));
  const native = nativeModels(irs);
  assert.deepEqual(native.errors, [], 'native model errors on current source');
  models = native.models;

  outputs = new Map();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pds-tokens-'));
  try {
    for (const ir of irs) await emitWeb(ir, tmp);
    for (const f of listFiles(tmp))
      outputs.set(`web/${f}`, fs.readFileSync(path.join(tmp, f), 'utf8'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  for (const [f, c] of Object.entries(emitReactNative(models))) outputs.set(`react-native/${f}`, c);
  for (const [f, c] of Object.entries(emitSwift(models))) outputs.set(`swift/PDSTokens/${f}`, c);
  for (const [f, c] of Object.entries(emitKotlin(models)))
    outputs.set(`kotlin/com/pds/tokens/${f}`, c);

  const js = ts.transpileModule(outputs.get('react-native/index.ts'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  themes = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
});

const exposed = (ir) => ir.tokens.filter((t) => t.tier === 'semantic' && t.scope === 'shared');
const nativeTokens = (ir, prefix) =>
  new Map(
    ir.tokens
      .filter((t) => t.scope === 'native' && t.path.startsWith(prefix))
      .map((t) => [t.path.slice(prefix.length), t.value]),
  );
const nativePathOf = (irPath) =>
  irPath
    .split('.')
    .map((s, i) => (i === 0 && s === 'text' ? 'typography' : s))
    .map(segmentName);
const get = (obj, segs) => segs.reduce((o, k) => o?.[k], obj);
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-6, `${msg}: ${a} ≠ ${b}`);

describe('snapshots', () => {
  test('every generated output matches its committed snapshot', () => {
    if (UPDATE) {
      fs.rmSync(SNAPSHOTS, { recursive: true, force: true });
      for (const [rel, content] of outputs) {
        fs.mkdirSync(path.dirname(path.join(SNAPSHOTS, rel)), { recursive: true });
        fs.writeFileSync(path.join(SNAPSHOTS, rel), content);
      }
      return;
    }
    assert.deepEqual(
      [...outputs.keys()].sort(),
      listFiles(SNAPSHOTS).sort(),
      'generated file set differs from __snapshots__ (npm run tokens:test:update after review)',
    );
    for (const [rel, content] of outputs)
      assert.equal(
        norm(content),
        norm(fs.readFileSync(path.join(SNAPSHOTS, rel), 'utf8')),
        `${rel} differs from its snapshot — web output must stay byte-identical; review native changes, then npm run tokens:test:update`,
      );
  });

  test('web snapshot covers the 8 web outputs', () => {
    assert.deepEqual([...outputs.keys()].filter((k) => k.startsWith('web/')).sort(), [
      'web/css/brands/brand-a.css',
      'web/css/brands/brand-b.css',
      'web/css/motion-reduced-motion.css',
      'web/css/typography.css',
      'web/css/variables.css',
      'web/js/tokens.brand-a.js',
      'web/js/tokens.brand-b.js',
      'web/js/tokens.js',
    ]);
  });
});

describe('native exposure', () => {
  test('models expose exactly the semantic shared tokens, plus font roles', () => {
    for (const [i, ir] of irs.entries()) {
      const leaves = [];
      walk(models[i].root, [], null, (_, leaf) => leaves.push(leaf.irPath));
      assert.deepEqual(
        leaves.filter((p) => !p.startsWith('fonts.')).sort(),
        exposed(ir)
          .map((t) => t.path)
          .sort(),
      );
      assert.deepEqual(leaves.filter((p) => p.startsWith('fonts.')).sort(), [
        'fonts.mono',
        'fonts.sans',
      ]);
      for (const p of leaves) {
        const t = ir.tokens.find((x) => x.path === p);
        if (t) assert.equal(t.tier, 'semantic', `${p} is ${t.tier}`);
      }
    }
  });

  test('React Native themes have the expected roots and both brands', () => {
    assert.deepEqual(Object.keys(themes.themes), BRANDS);
    assert.equal(themes.defaultBrand, 'brand-a');
    for (const theme of Object.values(themes.themes))
      assert.deepEqual(Object.keys(theme), [
        'color',
        'motion',
        'radius',
        'space',
        'elevation',
        'icon',
        'typography',
        'fonts',
        'dynamicTypeRamp',
      ]);
  });
});

describe('parity: React Native values match the IR', () => {
  for (const brand of BRANDS) {
    test(brand, () => {
      const ir = irs.find((x) => x.brand === brand);
      const theme = themes.themes[brand];
      const heights = nativeTokens(ir, 'elevationHeight.');
      const anchors = nativeTokens(ir, 'textScaling.');
      for (const t of exposed(ir)) {
        const segs = nativePathOf(t.path);
        const v = get(theme, segs);
        assert.notEqual(v, undefined, `${t.path} missing at ${segs.join('.')}`);
        switch (t.type) {
          case 'color':
            assert.equal(v, t.value.toUpperCase(), t.path);
            break;
          case 'dimension':
            assert.equal(v, t.value, t.path);
            break;
          case 'typography': {
            const face = catalog.families[t.value.fontFamily].faces.find(
              (f) => f.weight === t.value.fontWeight,
            );
            assert.equal(v.fontFamily, face.postScriptName, t.path);
            assert.equal(v.fontSize, t.value.fontSize, t.path);
            close(v.lineHeight, t.value.fontSize * t.value.lineHeight, `${t.path} lineHeight`);
            close(
              v.letterSpacing,
              t.value.fontSize * t.value.letterSpacing,
              `${t.path} letterSpacing`,
            );
            assert.equal('fontWeight' in v, false, `${t.path} must not set fontWeight`);
            const key = t.path.split('.').slice(1, -1).join('.');
            assert.equal(
              get(theme.dynamicTypeRamp, key.split('.')),
              anchors.get(key),
              `${t.path} ramp`,
            );
            break;
          }
          case 'shadow': {
            const role = t.path.split('.').slice(1).join('.');
            assert.equal(v.elevation, heights.get(role), `${t.path} Android elevation`);
            if (Array.isArray(t.value)) {
              assert.equal(v.shadowOpacity, 0, t.path);
            } else {
              assert.equal(v.shadowRadius, t.value.blur / 2, `${t.path} radius = blur ÷ 2`);
              assert.equal(v.shadowOffset.height, t.value.offsetY, t.path);
              assert.equal(v.shadowOffset.width, t.value.offsetX, t.path);
              const alpha = parseInt(t.value.color.slice(7, 9), 16) / 255;
              assert.ok(Math.abs(v.shadowOpacity - alpha) < 0.005, `${t.path} opacity`);
              assert.equal(v.shadowColor, t.value.color.slice(0, 7).toUpperCase(), t.path);
            }
            break;
          }
          case 'transition':
            assert.equal(v.duration, t.value.duration, t.path);
            assert.equal(v.delay, t.value.delay, t.path);
            assert.deepEqual(v.easing, t.value.timingFunction, t.path);
            break;
          default:
            assert.fail(`${t.path}: untested type ${t.type}`);
        }
      }
      assert.equal(theme.fonts.sans.family, ir.fonts.sans.family);
      assert.equal(theme.fonts.mono.family, 'Roboto Mono');
    });
  }

  test('brands differ only in brand-dependent tokens and the sans family', () => {
    const [a, b] = BRANDS.map((x) => themes.themes[x]);
    const ir = irs.find((x) => x.default);
    for (const t of exposed(ir)) {
      const segs = nativePathOf(t.path);
      const same = JSON.stringify(get(a, segs)) === JSON.stringify(get(b, segs));
      assert.equal(same, !t.brandDependent, `${t.path} brandDependent=${t.brandDependent}`);
    }
    assert.notEqual(a.fonts.sans.family, b.fonts.sans.family);
    assert.deepEqual(a.fonts.mono, b.fonts.mono);
  });
});

/** Literal sequences the IR predicts, compared with what the Swift / Kotlin text contains. */
function expectedSequences(ir) {
  const colors = [];
  const faces = [];
  const scales = [];
  const radii = [];
  const durations = [];
  const anchors = nativeTokens(ir, 'textScaling.');
  const heights = nativeTokens(ir, 'elevationHeight.');
  const elevations = [];
  for (const t of exposed(ir)) {
    if (t.type === 'color') colors.push(t.value.toUpperCase());
    if (t.type === 'typography') {
      faces.push(
        catalog.families[t.value.fontFamily].faces.find((f) => f.weight === t.value.fontWeight)
          .postScriptName,
      );
      scales.push(anchors.get(t.path.split('.').slice(1, -1).join('.')));
    }
    if (t.type === 'shadow') {
      if (!Array.isArray(t.value)) radii.push(t.value.blur / 2);
      elevations.push(heights.get(t.path.split('.').slice(1).join('.')));
    }
    if (t.type === 'transition') durations.push(t.value.duration);
  }
  return { colors, faces, scales, radii, durations, elevations };
}
const all = (re, s, f = (m) => m[1]) => [...s.matchAll(re)].map(f);

function assertBalanced(file, s) {
  const body = s
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of body) {
    if ('([{'.includes(ch)) stack.push(ch);
    else if (ch in pairs) assert.equal(stack.pop(), pairs[ch], `${file}: unbalanced ${ch}`);
  }
  assert.equal(stack.length, 0, `${file}: unclosed ${stack.join('')}`);
  assert.doesNotMatch(body, /undefined|NaN|\[object |Infinity/, `${file}: bad literal`);
}

describe('parity: Swift and Kotlin match the IR', () => {
  for (const brand of BRANDS) {
    const Brand = brand.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
    test(`Swift ${brand}`, () => {
      const ir = irs.find((x) => x.brand === brand);
      const want = expectedSequences(ir);
      const s = outputs.get(
        `swift/PDSTokens/DSTheme+${Brand[0].toUpperCase()}${Brand.slice(1)}.swift`,
      );
      assertBalanced(brand, s);
      const colors = all(/(\w+): DSColorValue\(rgba: 0x([0-9A-F]{8})\)/g, s, (m) => [m[1], m[2]])
        .filter(([label]) => label !== 'color')
        .map(([, hex]) => (hex.endsWith('FF') ? `#${hex.slice(0, 6)}` : `#${hex}`));
      assert.deepEqual(colors, want.colors);
      assert.deepEqual(
        all(/DSTextStyle\(fontFamily: "[^"]+", postScriptName: "([^"]+)"/g, s),
        want.faces,
      );
      assert.deepEqual(all(/textScale: \.(\w+)\)/g, s), want.scales);
      assert.deepEqual(
        all(/DSShadow\([^)]*\), opacity: [\d.]+, radius: ([\d.]+)/g, s).map(Number),
        want.radii,
      );
      assert.deepEqual(
        all(/DSTransition\(duration: ([\d.]+)/g, s).map((x) => Math.round(x * 1000)),
        want.durations,
      );
      assert.match(s, /flat: nil/);
      assert.match(s, /full: \.full/);
    });
    test(`Kotlin ${brand}`, () => {
      const ir = irs.find((x) => x.brand === brand);
      const want = expectedSequences(ir);
      const s = outputs.get(`kotlin/com/pds/tokens/${Brand[0].toUpperCase()}${Brand.slice(1)}.kt`);
      assertBalanced(brand, s);
      const colors = all(/DsColorValue\(0x([0-9A-F]{8})L\)/g, s).map((h) =>
        h.startsWith('FF') ? `#${h.slice(2)}` : `#${h.slice(2)}${h.slice(0, 2)}`,
      );
      assert.deepEqual(colors, want.colors);
      assert.deepEqual(
        all(/DsTextStyle\(fontFamily = "[^"]+", postScriptName = "([^"]+)"/g, s),
        want.faces,
      );
      assert.deepEqual(all(/durationMillis = (\d+)/g, s).map(Number), want.durations);
      const elevation = /elevation = DsElevation\(([\s\S]*?)\n {4}\)/.exec(s)[1];
      assert.deepEqual(all(/= ([\d.]+)f,/g, elevation).map(Number), want.elevations);
      assert.match(s, /full = DsCornerShape\.Full/);
    });
  }

  test('type files are balanced and declare every group once', () => {
    for (const rel of ['swift/PDSTokens/DSTheme.swift', 'kotlin/com/pds/tokens/DsTheme.kt']) {
      const s = outputs.get(rel);
      assertBalanced(rel, s);
      const names = all(/(?:struct|data class) (\w+)/g, s);
      assert.equal(new Set(names).size, names.length, `${rel}: duplicate type`);
    }
  });
});

test('React Native output type-checks under strict', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pds-rn-'));
  try {
    const file = path.join(dir, 'index.ts');
    fs.writeFileSync(file, outputs.get('react-native/index.ts'));
    const program = ts.createProgram([file], {
      strict: true,
      noEmit: true,
      noUnusedLocals: true,
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      skipLibCheck: true,
    });
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    assert.deepEqual(diagnostics, []);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('design-audit resolver agrees with the IR for every web-visible token', () => {
  const tokens = loadTokens();
  for (const ir of irs)
    for (const t of ir.tokens.filter((x) => x.scope !== 'native'))
      assert.deepEqual(tokens.resolve(t.path, ir.brand), t.value, `${ir.brand} ${t.path}`);
});

describe('guardrails', () => {
  const clone = (x) => structuredClone(x);
  const nativeErrors = (mutate) => {
    const copy = irs.map(clone);
    mutate(copy);
    return nativeModels(copy).errors.join('\n');
  };
  const drop = (ir, p) => (ir.tokens = ir.tokens.filter((t) => t.path !== p));
  const tok = (ir, p) => ir.tokens.find((t) => t.path === p);

  test('pass on the current source', () => {
    assert.deepEqual(checkBrandContract(), []);
    assert.deepEqual(checkPlatformOverrides(), []);
    assert.deepEqual(irs.flatMap(checkScopes), []);
    assert.deepEqual(checkSharedInvariance(irs), []);
    assert.deepEqual(checkContrast(irs).errors, []);
    assert.deepEqual(checkFonts(irs, catalog), []);
  });

  test('missing, orphan and invalid text-scaling anchors', () => {
    assert.match(
      nativeErrors((x) => x.forEach((ir) => drop(ir, 'textScaling.code.sm'))),
      /no iOS text-scaling anchor — add textScaling\.code\.sm/,
    );
    assert.match(
      nativeErrors((x) =>
        x.forEach((ir) =>
          ir.tokens.push({
            path: 'textScaling.display.xl',
            type: 'string',
            value: 'largeTitle',
            tier: 'semantic',
            scope: 'native',
          }),
        ),
      ),
      /textScaling\.display\.xl has no typography role/,
    );
    assert.match(
      nativeErrors((x) => x.forEach((ir) => (tok(ir, 'textScaling.body.md').value = 'jumbo'))),
      /not one of largeTitle/,
    );
  });

  test('missing and out-of-order Android elevation', () => {
    assert.match(
      nativeErrors((x) => x.forEach((ir) => drop(ir, 'elevationHeight.modal'))),
      /no Android elevation — add elevationHeight\.modal/,
    );
    assert.match(
      nativeErrors((x) => x.forEach((ir) => (tok(ir, 'elevationHeight.modal').value = 2))),
      /elevationHeight\.modal \(2dp\) must be higher than elevationHeight\.overlay/,
    );
  });

  test('unmapped type, name collision and per-brand shape drift', () => {
    assert.match(
      nativeErrors((x) =>
        x.forEach((ir) =>
          ir.tokens.push({
            path: 'motion.curve',
            type: 'cubicBezier',
            value: [0, 0, 1, 1],
            tier: 'semantic',
            scope: 'shared',
          }),
        ),
      ),
      /type "cubicBezier" has no native mapping/,
    );
    assert.match(
      nativeErrors((x) =>
        x.forEach((ir) =>
          ir.tokens.push({
            path: 'color.text.linkHover',
            type: 'color',
            value: '#000000',
            tier: 'semantic',
            scope: 'shared',
          }),
        ),
      ),
      /both map to native name color\.text\.linkHover/,
    );
    assert.match(
      nativeErrors((x) => drop(x[1], 'icon.lg')),
      /native theme shape differs/,
    );
  });

  test('a shared token may not alias a native-only token', () => {
    const ir = clone(irs[0]);
    tok(ir, 'icon.md').ref = 'elevationHeight.raised';
    assert.match(checkScopes(ir).join('\n'), /aliases native-only token elevationHeight\.raised/);
  });

  test('font catalog: missing face, invalid entries, duplicates', () => {
    const noSemibold = clone(catalog);
    noSemibold.families.Figtree.faces = noSemibold.families.Figtree.faces.filter(
      (f) => f.weight !== 600,
    );
    assert.match(
      checkFonts(irs, noSemibold).join('\n'),
      /brand-b: font family "Figtree" has no 600 normal face/,
    );

    const bad = clone(catalog);
    bad.families.Inter.faces[0].postScriptName = 'Inter Regular';
    bad.families.Inter.faces[1].file = 'Inter-Regular.ttf';
    bad.families.Inter.license = 'proprietary';
    const msg = checkFonts(irs, bad).join('\n');
    assert.match(msg, /invalid PostScript name "Inter Regular"/);
    assert.match(msg, /file "Inter-Regular.ttf" is also used/);
    assert.match(msg, /unknown license/);

    const missing = clone(catalog);
    delete missing.families['Roboto Mono'];
    assert.match(checkFonts(irs, missing).join('\n'), /"Roboto Mono" \(role mono\) is not in/);
  });

  test('a platform tier may not override a shared token', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pds-override-'));
    try {
      const write = (rel, json) => {
        fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
        fs.writeFileSync(path.join(root, rel), JSON.stringify(json));
      };
      write('semantic/icon.json', { icon: { md: { $value: 20, $type: 'dimension' } } });
      write('platform/native/semantic/icon.json', {
        icon: { md: { $value: 24, $type: 'dimension' } },
      });
      write('platform/web/semantic/extra.json', { extra: { a: { $value: 1, $type: 'number' } } });
      write('platform/native/semantic/extra.json', {
        extra: { a: { $value: 1, $type: 'number' } },
      });
      const msg = checkPlatformOverrides(root).join('\n');
      assert.match(msg, /overrides shared token icon\.md/);
      assert.match(msg, /extra\.a is defined by two platform tiers/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
