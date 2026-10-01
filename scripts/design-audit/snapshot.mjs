/**
 * Snapshot tooling for the design audit (part of the refresh workflow in docs/design-audit.md).
 *
 *   node scripts/design-audit/snapshot.mjs import <raw.json> [--surface login]
 *       Validate the raw output of the committed extractor (schema, extractor version, node
 *       IDs, checksum) and write it — pretty-printed, otherwise unchanged — to the surface's
 *       committed snapshot path. Refuses to write anything if validation fails.
 *
 *   node scripts/design-audit/snapshot.mjs validate [--surface login] [--snapshot <file>]
 *       Validate a snapshot without writing.
 *
 * Writes only the snapshot file under scripts/design-audit/snapshots/. Never touches Figma,
 * production code, or git.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractorVersion, validateSnapshot } from './lib/snapshot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const [cmd, ...rest] = process.argv.slice(2);
const opts = { surface: 'login' };
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--surface') opts.surface = rest[++i];
  else if (rest[i] === '--snapshot') opts.snapshot = rest[++i];
  else positional.push(rest[i]);
}

const contract = JSON.parse(
  fs.readFileSync(path.join(HERE, 'surfaces', `${opts.surface}.json`), 'utf8'),
);

function check(snapshot) {
  const errors = validateSnapshot(snapshot, contract);
  const fileVersion = extractorVersion(path.join(ROOT, contract.figma.extractor.file));
  if (fileVersion !== contract.figma.extractor.version)
    errors.push(
      `${contract.figma.extractor.file} declares version ${fileVersion}, contract expects ` +
        `${contract.figma.extractor.version}`,
    );
  return errors;
}

function report(errors, label) {
  if (errors.length) {
    console.error(`✗ ${label} is invalid:\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }
}

if (cmd === 'import') {
  const src =
    positional[0] ?? (console.error('usage: snapshot.mjs import <raw.json>'), process.exit(2));
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(src), 'utf8'));
  report(check(snapshot), src);
  const dest = path.join(ROOT, contract.figma.snapshot);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(snapshot, null, 2) + '\n');
  const frames = Object.keys(snapshot.frames).join(', ');
  console.log(
    `✓ ${contract.figma.snapshot} written (frames ${frames}; captured ${snapshot.capturedAt}; ` +
      `checksum ${snapshot.checksum})`,
  );
} else if (cmd === 'validate') {
  const p = opts.snapshot ?? contract.figma.snapshot;
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8'));
  report(check(snapshot), p);
  console.log(`✓ ${p} is valid (captured ${snapshot.capturedAt}, checksum ${snapshot.checksum})`);
} else {
  console.error('usage: snapshot.mjs <import <raw.json> | validate> [--surface <name>]');
  process.exit(2);
}
