/**
 * Snapshot tooling for the design audit (part of the refresh workflow in docs/design-audit.md).
 *
 *   node scripts/design-audit/snapshot.mjs import <raw.json> [--surface login]
 *       Validate the raw output of the committed extractor (schema, extractor version, node
 *       IDs, checksum) and write it — pretty-printed, otherwise unchanged — to the surface's
 *       committed snapshot path. Refuses to write anything if validation fails.
 *       (`npm run design:audit:refresh` wraps this import + the audit + a change summary.)
 *
 *   node scripts/design-audit/snapshot.mjs validate [--surface login] [--snapshot <file>]
 *       Validate a snapshot without writing.
 *
 *   node scripts/design-audit/snapshot.mjs age [--surface login] [--max-days 14] [--now <iso>]
 *       Print the committed snapshot's age and warn when it is older than --max-days (a GitHub
 *       `::warning::` annotation under GitHub Actions). Warning only: always exits 0.
 *
 * Writes only the snapshot file under scripts/design-audit/snapshots/. Never touches Figma,
 * production code, or git.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { snapshotAgeDays, validateForImport } from './lib/snapshot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const [cmd, ...rest] = process.argv.slice(2);
const opts = { surface: 'login', maxDays: 14 };
const positional = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--surface') opts.surface = rest[++i];
  else if (rest[i] === '--snapshot') opts.snapshot = rest[++i];
  else if (rest[i] === '--max-days') opts.maxDays = Number(rest[++i]);
  else if (rest[i] === '--now') opts.now = new Date(rest[++i]);
  else positional.push(rest[i]);
}

const contract = JSON.parse(
  fs.readFileSync(path.join(HERE, 'surfaces', `${opts.surface}.json`), 'utf8'),
);

const check = (snapshot) =>
  validateForImport(snapshot, contract, path.join(ROOT, contract.figma.extractor.file));

function report(errors, label) {
  if (errors.length) {
    console.error(`✗ ${label} is invalid:\n  - ${errors.join('\n  - ')}`);
    process.exit(1);
  }
}

function readSnapshot(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    report([`not readable JSON (${err.message}) — truncated or not extractor output?`], file);
  }
}

if (cmd === 'import') {
  const src =
    positional[0] ?? (console.error('usage: snapshot.mjs import <raw.json>'), process.exit(2));
  const snapshot = readSnapshot(path.resolve(src));
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
  const snapshot = readSnapshot(path.resolve(ROOT, p));
  report(check(snapshot), p);
  console.log(`✓ ${p} is valid (captured ${snapshot.capturedAt}, checksum ${snapshot.checksum})`);
} else if (cmd === 'age') {
  const p = opts.snapshot ?? contract.figma.snapshot;
  const gha = process.env.GITHUB_ACTIONS === 'true';
  const warn = (msg) =>
    console.log(
      gha ? `::warning file=${p},title=Design audit snapshot is stale::${msg}` : `⚠ ${msg}`,
    );
  let capturedAt;
  try {
    capturedAt = JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8')).capturedAt;
  } catch (err) {
    warn(`could not read ${p} (${err.message}); design:audit will report the error`);
    process.exit(0);
  }
  const days = snapshotAgeDays(capturedAt, opts.now ?? new Date());
  if (Number.isNaN(days)) warn(`${p} has no valid capturedAt; design:audit will report the error`);
  else if (days > opts.maxDays)
    warn(
      `${p} was captured ${capturedAt} (${days} days ago, limit ${opts.maxDays}). The audit ` +
        'only checks code against this snapshot — refresh it with the design-audit Claude ' +
        'skill to pick up Figma edits.',
    );
  else console.log(`✓ ${p} captured ${capturedAt} (${days} days ago, limit ${opts.maxDays})`);
} else {
  console.error('usage: snapshot.mjs <import <raw.json> | validate | age> [--surface <name>]');
  process.exit(2);
}
