/**
 * Figma ↔ code design-drift audit (detection/reporting only). See docs/design-audit.md.
 *
 *   npm run design:audit                         all surfaces in scripts/design-audit/surfaces/
 *   npm run design:audit -- --surface login      one surface
 *   npm run design:audit -- --snapshot <file>    audit against another snapshot (fixtures)
 *   npm run design:audit -- --known <file>       use another known-differences file
 *   npm run design:audit -- --json <file>        JSON report path (default design-audit-report.json)
 *
 * Fully offline and deterministic: compares the COMMITTED normalized Figma snapshot with the
 * repo's code and DTCG token source. It never calls Figma, never edits Figma or code, and
 * never commits/pushes. The only file it writes is the (gitignored) JSON report.
 *
 * Exit code: 0 when every check is PASS or KNOWN_DIFFERENCE; 1 on any DRIFT or ERROR.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runAudit, validateKnownDifferences } from './lib/audit.mjs';
import { failed, formatTerminal, toJson } from './lib/report.mjs';
import { loadTokens } from './lib/tokens.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

function parseArgs(argv) {
  const args = { json: 'design-audit-report.json' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i] ?? usage(`${a} needs a value`);
    if (a === '--surface') args.surface = next();
    else if (a === '--snapshot') args.snapshot = next();
    else if (a === '--known') args.known = next();
    else if (a === '--json') args.json = next();
    else if (a === '--no-json') args.json = null;
    else usage(`unknown argument ${a}`);
  }
  return args;
}

function usage(msg) {
  console.error(`design-audit: ${msg}`);
  process.exit(2);
}

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(ROOT, p), 'utf8'));

const args = parseArgs(process.argv.slice(2));
const surfaceDir = path.join(HERE, 'surfaces');
const surfaces = fs
  .readdirSync(surfaceDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort()
  .filter((s) => !args.surface || s === args.surface);
if (!surfaces.length) usage(`no surface contract "${args.surface}" in ${surfaceDir}`);
if (args.snapshot && surfaces.length > 1) usage('--snapshot requires --surface');

const knownDifferences = readJson(args.known ?? 'scripts/design-audit/known-differences.json');
const kdProblems = validateKnownDifferences(knownDifferences);
if (kdProblems.length) usage(`invalid known differences:\n  ${kdProblems.join('\n  ')}`);

const tokens = loadTokens({ root: path.join(ROOT, 'src/tokens') });
const reports = surfaces.map((surface) => {
  const contract = readJson(`scripts/design-audit/surfaces/${surface}.json`);
  const snapshotPath = args.snapshot ?? contract.figma.snapshot;
  let snapshot = null;
  try {
    snapshot = readJson(snapshotPath);
  } catch (err) {
    snapshot = { loadError: `${snapshotPath}: ${err.message}` };
  }
  if (args.snapshot) contract.figma.snapshot = args.snapshot;
  return runAudit({ contract, snapshot, knownDifferences, tokens, root: ROOT });
});

process.stdout.write(formatTerminal(reports, { color: process.stdout.isTTY }) + '\n');
if (args.json) {
  const out = path.resolve(ROOT, args.json);
  fs.writeFileSync(out, JSON.stringify(toJson(reports), null, 2) + '\n');
  console.log(`JSON report: ${path.relative(ROOT, out)}`);
}
process.exit(failed(reports) ? 1 : 0);
