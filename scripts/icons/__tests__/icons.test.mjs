/**
 * Icon catalog tests (ADR 0019) — run: npm run icons:test
 *
 *   1. The committed catalog passes every check against the web and React Native
 *      implementations and their installed Lucide packages (lucide-react, lucide-react-native).
 *   2. Every check fires on a broken input.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  MANIFEST,
  PLATFORMS,
  SCHEMA,
  WEB_LUCIDE,
  WEB_TYPES,
  checkArtwork,
  checkSchema,
  checkWebMap,
  checkWebNames,
  lucideComponent,
} from '../lib/icons.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'));

const json = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const manifest = json(MANIFEST);
const schema = json(SCHEMA);
const typesSource = fs.readFileSync(WEB_TYPES, 'utf8');
const lucideSource = fs.readFileSync(WEB_LUCIDE, 'utf8');
const LUCIDE = 'node_modules/lucide-react';
const installedVersion = json(`${LUCIDE}/package.json`).version;
const hasIcon = (name) => fs.existsSync(`${LUCIDE}/dist/esm/icons/${name}.mjs`);
const clone = () => structuredClone(manifest);

describe('committed catalog', () => {
  test('matches the schema', () => assert.deepEqual(checkSchema(schema, manifest), []));

  for (const platform of Object.values(PLATFORMS)) {
    const pkgDir = `node_modules/${platform.pkg}`;
    const has = (name) => fs.existsSync(`${pkgDir}/dist/esm/icons/${name}.mjs`);
    test(`${platform.label} IconName union has exactly the catalog names`, () =>
      assert.deepEqual(
        checkWebNames(manifest, fs.readFileSync(platform.types, 'utf8'), platform),
        [],
      ));
    test(`${platform.label} Lucide map matches the catalog`, () =>
      assert.deepEqual(checkWebMap(manifest, fs.readFileSync(platform.map, 'utf8'), platform), []));
    test(`${platform.label} artwork exists at the pinned provider version (${platform.pkg})`, () =>
      assert.deepEqual(
        checkArtwork(manifest, has, json(`${pkgDir}/package.json`).version, platform),
        [],
      ));
  }
});

describe('checks fire on broken input', () => {
  test('schema: unknown icon field, bad name, missing description', () => {
    const m = clone();
    m.icons.plus.sfSymbol = 'plus';
    m.icons['Bad_Name'] = { lucide: 'x', description: 'x' };
    delete m.icons.minus.description;
    const errors = checkSchema(schema, m);
    assert.ok(
      errors.some((e) => e.includes("'sfSymbol'")),
      errors.join('\n'),
    );
    assert.ok(
      errors.some((e) => e.includes('property name')),
      errors.join('\n'),
    );
    assert.ok(
      errors.some((e) => e.includes("'description'")),
      errors.join('\n'),
    );
  });

  test('web-names: catalog name missing from the union, and an extra union name', () => {
    const m = clone();
    m.icons.bell = { lucide: 'bell', description: 'Notifications.' };
    delete m.icons.plus;
    const errors = checkWebNames(m, typesSource);
    assert.ok(errors.some((e) => e.includes("'bell' is missing")));
    assert.ok(errors.some((e) => e.includes("IconName 'plus' is not in the catalog")));
  });

  test('web-map: wrong Lucide component and unmapped name', () => {
    const m = clone();
    m.icons.edit.lucide = 'pen';
    m.icons.bell = { lucide: 'bell', description: 'Notifications.' };
    const errors = checkWebMap(m, lucideSource);
    assert.ok(errors.some((e) => e.includes("'edit' maps to Pencil")));
    assert.ok(errors.some((e) => e.includes("'bell' is not mapped")));
  });

  test('artwork: version drift and a name lucide does not ship', () => {
    const m = clone();
    m.provider.version = '0.0.1';
    m.icons.close.lucide = 'not-an-icon';
    const errors = checkArtwork(m, hasIcon, installedVersion);
    assert.ok(errors.some((e) => e.includes('provider.version is 0.0.1')));
    assert.ok(errors.some((e) => e.includes("'not-an-icon' does not exist")));
  });

  test('react-native map: per-icon import from the wrong subpath, labelled by platform', () => {
    const rn = PLATFORMS['react-native'];
    const source = fs
      .readFileSync(rn.map, 'utf8')
      .replace("'lucide-react-native/icons/pencil'", "'lucide-react-native/icons/pen'");
    const errors = checkWebMap(manifest, source, rn);
    assert.ok(
      errors.some((e) =>
        e.includes("Pencil must be imported from 'lucide-react-native/icons/pencil'"),
      ),
      errors.join('\n'),
    );
    const names = checkWebNames(
      { ...manifest, icons: { ...manifest.icons, bell: { lucide: 'bell', description: 'x' } } },
      fs.readFileSync(rn.types, 'utf8'),
      rn,
    );
    assert.ok(names.some((e) => e.startsWith("react-native-names: catalog icon 'bell'")));
  });

  test('react-native artwork: version drift names lucide-react-native', () => {
    const errors = checkArtwork(manifest, () => true, '0.0.1', PLATFORMS['react-native']);
    assert.ok(errors.some((e) => e.includes('installed lucide-react-native is 0.0.1')));
  });

  test('lucideComponent PascalCases kebab names', () => {
    assert.equal(lucideComponent('triangle-alert'), 'TriangleAlert');
    assert.equal(lucideComponent('x'), 'X');
    assert.equal(lucideComponent('eye-off'), 'EyeOff');
  });
});
