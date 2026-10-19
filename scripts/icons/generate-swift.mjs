/**
 * Writes the SwiftUI icon sources (ADR 0019) — run: npm run icons:swift
 * See scripts/icons/lib/swift.mjs. The output is committed; npm run icons:test fails when it is
 * stale (catalog or pinned Lucide version changed without regenerating).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MANIFEST } from './lib/icons.mjs';
import { generateSwift } from './lib/swift.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const pkg = JSON.parse(fs.readFileSync('node_modules/lucide-static/package.json', 'utf8'));
if (pkg.version !== manifest.provider.version) {
  console.error(
    `✖ lucide-static is ${pkg.version}, catalog provider.version is ${manifest.provider.version} — install the pinned version first.`,
  );
  process.exit(1);
}
const nodes = JSON.parse(fs.readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));
const license = fs.readFileSync('node_modules/lucide-static/LICENSE', 'utf8');

for (const [file, content] of generateSwift(manifest, nodes, license)) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`✔ ${file}`);
}
