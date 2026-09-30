/**
 * Guardrail (ADR 0011): components, patterns and examples may only consume SEMANTIC tokens.
 *
 * Fails (exit 1) when a file under the checked roots references:
 *   - a Core primitive custom property (e.g. `--color-blue-600`, `--space-xl`, `--radius-sm`)
 *     — the list is derived from src/tokens/core/*.json, so it can't go stale;
 *   - any brand-layer custom property (`--brand-*`) — brand tokens are never emitted, and
 *     components must never know which brand is active;
 *   - a raw hex color in implementation CSS/TS (stories are exempt from this one).
 *
 * …unless the exact use is an explicit, documented exception in
 * scripts/token-usage-exceptions.json (file + token + expected occurrence count + reason +
 * doc link). An exception whose count no longer matches — a new use crept in, or the use
 * was removed and the exception is stale — also fails, so exceptions can't silently grow.
 *
 * Usage: node scripts/check-token-usage.mjs [root ...]
 *        (default: src/components src/patterns src/examples)
 * Runs as part of `npm run lint`, and therefore in CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_ROOTS = ['src/components', 'src/patterns', 'src/examples'];
const roots = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROOTS;

// Same naming as Style Dictionary's `name/kebab` for our token paths (camelCase → kebab).
const kebab = (segments) =>
  segments
    .map((s) =>
      String(s)
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase(),
    )
    .join('-');

const primitives = new Set();
const walk = (node, trail) => {
  if (node && typeof node === 'object' && '$value' in node) {
    primitives.add(kebab(trail));
    return;
  }
  for (const [k, v] of Object.entries(node ?? {})) if (!k.startsWith('$')) walk(v, [...trail, k]);
};
for (const f of fs.readdirSync('src/tokens/core').filter((f) => f.endsWith('.json'))) {
  walk(JSON.parse(fs.readFileSync(path.join('src/tokens/core', f), 'utf8')), []);
}

const exceptions = JSON.parse(
  fs.readFileSync(new URL('./token-usage-exceptions.json', import.meta.url), 'utf8'),
);
const exceptionKey = (file, token) => `${file.split(path.sep).join('/')}|${token}`;
const exceptionByKey = new Map(exceptions.map((e) => [exceptionKey(e.file, e.token), e]));

const files = [];
const collect = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(p);
    else if (/\.(css|tsx?|mjs)$/.test(entry.name)) files.push(p);
  }
};
roots.forEach(collect);

const findings = []; // { key, text }
for (const file of files) {
  const isStory = /\.stories\.tsx?$/.test(file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let inBlockComment = false;
  lines.forEach((raw, i) => {
    // Ignore comments so documentation may mention token names.
    let line = raw;
    if (inBlockComment) {
      const end = line.indexOf('*/');
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, '');
    const open = line.indexOf('/*');
    if (open !== -1) {
      line = line.slice(0, open);
      inBlockComment = true;
    }
    line = line.replace(/(^|[^:])\/\/.*$/, '$1');
    const add = (token, why) =>
      findings.push({
        key: exceptionKey(file, token),
        text: `${file}:${i + 1}  ${token}  (${why})`,
      });
    for (const m of line.matchAll(/--([a-z0-9-]+)/g)) {
      const name = m[1];
      if (name.startsWith('brand-')) add(`--${name}`, 'brand-layer token — use a semantic token');
      else if (primitives.has(name)) add(`--${name}`, 'Core primitive — use a semantic token');
    }
    if (!isStory) {
      for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g))
        add(m[0], 'raw color — use a semantic color token');
    }
  });
}

const errors = [];
const exceptedCounts = new Map();
for (const f of findings) {
  if (exceptionByKey.has(f.key)) exceptedCounts.set(f.key, (exceptedCounts.get(f.key) ?? 0) + 1);
  else errors.push(f.text);
}
const checkedRoots = roots.map((r) => r.split(path.sep).join('/'));
for (const [key, e] of exceptionByKey) {
  if (!checkedRoots.some((r) => e.file.startsWith(r))) continue; // file not in this run's roots
  const found = exceptedCounts.get(key) ?? 0;
  if (found !== e.occurrences)
    errors.push(
      `exception ${e.file} ${e.token}: documented ${e.occurrences} occurrence(s), found ${found} — ` +
        (found > e.occurrences
          ? 'a new use needs a semantic token or its own review'
          : 'update or remove the stale exception'),
    );
}

if (errors.length) {
  console.error(
    `\n✖ Token usage check failed — components/patterns/examples must consume semantic tokens only (ADR 0011):\n${errors.map((v) => `  ${v}`).join('\n')}\n`,
  );
  process.exit(1);
}
const excepted = [...exceptedCounts.values()].reduce((a, b) => a + b, 0);
console.log(
  `✔ Token usage: ${files.length} files in ${roots.join(', ')} use semantic tokens only ` +
    `(${primitives.size} Core primitives + --brand-* + raw hex guarded; ${excepted} documented exception use(s)).`,
);
