/**
 * Icon catalog tests (ADR 0019) — run: npm run icons:test
 *
 *   1. The committed catalog passes every check against the web implementation and the
 *      installed lucide-react.
 *   2. Every check fires on a broken input.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  MANIFEST,
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
  test('web IconName union has exactly the catalog names', () =>
    assert.deepEqual(checkWebNames(manifest, typesSource), []));
  test('web Lucide map matches the catalog', () =>
    assert.deepEqual(checkWebMap(manifest, lucideSource), []));
  test('artwork exists at the pinned provider version', () =>
    assert.deepEqual(checkArtwork(manifest, hasIcon, installedVersion), []));
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

  test('lucideComponent PascalCases kebab names', () => {
    assert.equal(lucideComponent('triangle-alert'), 'TriangleAlert');
    assert.equal(lucideComponent('x'), 'X');
    assert.equal(lucideComponent('eye-off'), 'EyeOff');
  });
});
