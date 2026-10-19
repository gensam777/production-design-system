/**
 * Validates every cross-platform component contract (ADR 0015) — run: npm run contracts:validate
 *
 *   design/contracts/schema.json                    JSON Schema (structure)
 *   design/contracts/components/*.contract.yaml     one contract per component
 *
 * On top of the schema it checks platform-API leakage, internal references, semantic token
 * paths against every brand's resolved IR (resolved in memory — no token build needed),
 * Figma axes + the committed design-audit Figma snapshots, and the web, React Native, iOS and Android
 * reference implementations. See scripts/contracts/lib/contracts.mjs. Exit 1 on any error.
 */
import fs from 'node:fs';
import path from 'node:path';

import { loadFontCatalog } from '../../packages/tokens/scripts/fonts.mjs';
import { BRANDS, resolveBrand } from '../../packages/tokens/scripts/ir.mjs';
import { checkContract, compileSchema, parseContract } from './lib/contracts.mjs';

const CONTRACTS = 'design/contracts';
const COMPONENTS = `${CONTRACTS}/components`;
const SNAPSHOTS = 'scripts/design-audit/snapshots';

const read = (p) => {
  const file = p.split('#')[0];
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

const files = fs.existsSync(COMPONENTS)
  ? fs
      .readdirSync(COMPONENTS)
      .filter((f) => f.endsWith('.contract.yaml'))
      .sort()
  : [];

if (!files.length) {
  console.error(`✖ No contracts found in ${COMPONENTS}/`);
  process.exit(1);
}

const validate = compileSchema(JSON.parse(fs.readFileSync(`${CONTRACTS}/schema.json`, 'utf8')));
const fontCatalog = loadFontCatalog();
const irs = [];
for (const brand of BRANDS) irs.push(await resolveBrand(brand, { fontCatalog }));
const snapshots = fs.existsSync(SNAPSHOTS)
  ? fs
      .readdirSync(SNAPSHOTS)
      .filter((f) => f.endsWith('.figma.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(SNAPSHOTS, f), 'utf8')))
  : [];

let errors = 0;
let warnings = 0;
for (const name of files) {
  const file = `${COMPONENTS}/${name}`;
  const text = fs.readFileSync(file, 'utf8');
  const { contract, problems } = parseContract(text);
  const findings = contract
    ? checkContract({ text, contract, validate, irs, snapshots, read, file })
    : problems.map((message) => ({ level: 'error', check: 'yaml', message }));

  const e = findings.filter((f) => f.level === 'error');
  const w = findings.filter((f) => f.level === 'warning');
  errors += e.length;
  warnings += w.length;
  const status = contract?.status
    ? Object.entries(contract.status)
        .map(([p, s]) => `${p}: ${s}`)
        .join(', ')
    : '';
  console.log(`${e.length ? '✖' : '✔'} ${file}${status ? `  (${status})` : ''}`);
  for (const f of findings)
    console.log(`    ${f.level === 'error' ? 'error' : 'warn '} [${f.check}] ${f.message}`);
  const open = contract?.['open-questions']?.length;
  if (!e.length && open) console.log(`    ${open} open question(s) recorded in the contract`);
  for (const g of contract?.['implementation-gaps'] ?? [])
    console.log(
      `    gap   [${g.platform}] ${g.id} — implementation does not match the contract yet`,
    );
}

console.log(
  `\n${files.length} contract(s), ${errors} error(s), ${warnings} warning(s) — schema, platform-api, references, tokens (${BRANDS.join(', ')}), figma (${snapshots.length} snapshot(s)), web-reference, react-native-reference, ios-reference, android-reference.`,
);
process.exit(errors ? 1 : 0);
