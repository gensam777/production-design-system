/**
 * Design-audit snapshot refresh (local, offline, deterministic). See docs/design-audit.md.
 *
 *   npm run design:audit:refresh -- <raw.json> [--surface login]
 *
 * <raw.json> is the output of the committed read-only extractor
 * (scripts/design-audit/figma/extract-<surface>.js), saved verbatim by the design-audit Claude
 * skill — reading live Figma is the one step this script cannot do. It then:
 *
 *   1. validates the raw output (JSON, schema, canonical file key, extractor version, node IDs,
 *      checksum) — on any failure it writes nothing and exits 2;
 *   2. writes the surface's committed snapshot (atomically);
 *   3. runs the audit (scripts/design-audit/audit.mjs) for that surface;
 *   4. prints which Figma properties changed versus the previous snapshot, plus the summary.
 *
 * Exit code: the audit's (0 = PASS/KNOWN_DIFFERENCE only, 1 = DRIFT/ERROR), or 2 when the raw
 * input was rejected. Writes only the snapshot and the gitignored JSON report. Never touches
 * Figma, production code, or git — the refreshed snapshot is left uncommitted for review.
 *
 * Test-only options: --out <file> (snapshot path, default the contract's) and --json <file>.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffFrames, validateForImport } from './lib/snapshot.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const MAX_CHANGES_SHOWN = 25;

const args = { surface: 'login', json: 'design-audit-report.json' };
const positional = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => argv[++i] ?? usage(`${a} needs a value`);
  if (a === '--surface') args.surface = next();
  else if (a === '--out') args.out = next();
  else if (a === '--json') args.json = next();
  else if (a.startsWith('--')) usage(`unknown argument ${a}`);
  else positional.push(a);
}
if (positional.length !== 1) usage('expected exactly one raw extractor JSON file');

function usage(msg) {
  console.error(`design-audit:refresh: ${msg}`);
  console.error('usage: npm run design:audit:refresh -- <raw.json> [--surface <name>]');
  process.exit(2);
}

function reject(errors) {
  console.error(`✗ ${rawPath} rejected — nothing written:\n  - ${errors.join('\n  - ')}`);
  console.error(
    'Re-run the committed extractor and save its output verbatim. Never hand-edit the raw ' +
      'output or the snapshot.',
  );
  process.exit(2);
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const fmt = (v) => (v === undefined ? '(absent)' : JSON.stringify(v));

const contractPath = path.join(HERE, 'surfaces', `${args.surface}.json`);
if (!fs.existsSync(contractPath)) usage(`no surface contract "${args.surface}"`);
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const rawPath = path.resolve(positional[0]);
const outPath = path.resolve(ROOT, args.out ?? contract.figma.snapshot);

// 1. Validate. Nothing is written before this passes.
let raw;
try {
  raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
} catch (err) {
  reject([`not readable JSON (${err.message}) — truncated or not extractor output?`]);
}
const errors = validateForImport(raw, contract, path.join(ROOT, contract.figma.extractor.file));
if (errors.length) reject(errors);

// 2. Write the snapshot (temp file + rename, so a crash can't leave a half-written snapshot).
let previous = null;
try {
  previous = JSON.parse(fs.readFileSync(outPath, 'utf8'));
} catch {
  // first capture, or the previous snapshot was unreadable — everything counts as changed
}
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const tmp = `${outPath}.tmp-${process.pid}`;
fs.writeFileSync(tmp, JSON.stringify(raw, null, 2) + '\n');
fs.renameSync(tmp, outPath);

// 3. Audit. (Clear any old report first so the summary can't come from a previous run.)
const jsonPath = path.resolve(ROOT, args.json);
fs.rmSync(jsonPath, { force: true });
const auditArgs = [path.join(HERE, 'audit.mjs'), '--surface', args.surface, '--json', args.json];
if (args.out) auditArgs.push('--snapshot', rel(outPath));
const audit = spawnSync(process.execPath, auditArgs, { cwd: ROOT, stdio: 'inherit' });

// 4. Summary.
const lines = ['', `Design audit refresh — ${contract.title} (${args.surface})`];
lines.push(
  `Snapshot: ${rel(outPath)} · captured ${raw.capturedAt} · ` +
    `${raw.extractor.name}@${raw.extractor.version} · checksum ${raw.checksum}`,
);
const rawRel = path.relative(ROOT, rawPath);
if (!rawRel.startsWith('..') && !path.isAbsolute(rawRel))
  lines.push(`Note: ${rel(rawPath)} is inside the repo — keep raw output in the scratchpad.`);

if (!previous) {
  lines.push('Figma changes: no previous snapshot to compare against (first capture).');
} else {
  const changes = diffFrames(previous.frames, raw.frames);
  if (!changes.length) {
    lines.push(
      `Figma changes: none since the previous snapshot (captured ${previous.capturedAt}); ` +
        'only capturedAt changed.',
    );
  } else {
    lines.push(
      `Figma changes since the previous snapshot (captured ${previous.capturedAt}): ` +
        `${changes.length} propert${changes.length === 1 ? 'y' : 'ies'}`,
    );
    for (const c of changes.slice(0, MAX_CHANGES_SHOWN))
      lines.push(`  ${c.path}: ${fmt(c.before)} → ${fmt(c.after)}`);
    if (changes.length > MAX_CHANGES_SHOWN)
      lines.push(`  …and ${changes.length - MAX_CHANGES_SHOWN} more (see git diff)`);
  }
}

let summary = null;
try {
  summary = JSON.parse(fs.readFileSync(jsonPath, 'utf8')).summary;
} catch {
  // the audit printed its own error
}
lines.push(
  summary
    ? `Audit: PASS ${summary.PASS} · DRIFT ${summary.DRIFT} · ` +
        `KNOWN_DIFFERENCE ${summary.KNOWN_DIFFERENCE} · ERROR ${summary.ERROR}`
    : `Audit: did not produce a report (exit ${audit.status})`,
);
lines.push(
  `Wrote: ${rel(outPath)}, ${args.json}. Nothing committed — review the snapshot diff ` +
    '(git diff scripts/design-audit/snapshots/) before committing.',
);
console.log(lines.join('\n'));

process.exit(audit.status ?? 1);
