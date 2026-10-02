/**
 * Normalized Figma snapshot: integrity + schema validation. A snapshot is produced only by the
 * committed read-only extractor (scripts/design-audit/figma/extract-<surface>.js) run through
 * the Figma MCP, then imported with scripts/design-audit/snapshot.mjs.
 */
import fs from 'node:fs';

export const SNAPSHOT_SCHEMA_VERSION = 1;

/** FNV-1a 32-bit — identical to the extractor's, so the checksum round-trips. */
export function checksum(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Version the committed extractor file declares (`const EXTRACTOR = { …, version: N }`). */
export function extractorVersion(file) {
  const m = fs.readFileSync(file, 'utf8').match(/EXTRACTOR\s*=\s*\{[^}]*version:\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/**
 * @returns {string[]} problems; empty when the snapshot is valid for `contract`.
 */
export function validateSnapshot(snapshot, contract) {
  const errors = [];
  if (!isObj(snapshot)) return ['snapshot is not a JSON object'];
  if (snapshot.loadError) return [String(snapshot.loadError)];
  if (snapshot.schemaVersion !== SNAPSHOT_SCHEMA_VERSION)
    errors.push(`schemaVersion ${snapshot.schemaVersion} ≠ supported ${SNAPSHOT_SCHEMA_VERSION}`);
  if (snapshot.surface !== contract.surface)
    errors.push(`surface "${snapshot.surface}" ≠ contract "${contract.surface}"`);
  if (snapshot.fileKey !== contract.figma.fileKey)
    errors.push(`fileKey ${snapshot.fileKey} ≠ canonical ${contract.figma.fileKey}`);
  const ex = contract.figma.extractor;
  if (snapshot.extractor?.name !== ex.name || snapshot.extractor?.version !== ex.version)
    errors.push(
      `snapshot was produced by ${snapshot.extractor?.name}@${snapshot.extractor?.version}, ` +
        `contract expects ${ex.name}@${ex.version} — re-run the extractor`,
    );
  if (typeof snapshot.capturedAt !== 'string' || Number.isNaN(Date.parse(snapshot.capturedAt)))
    errors.push('capturedAt missing or not an ISO date');
  if (!isObj(snapshot.frames)) {
    errors.push('frames missing');
    return errors;
  }
  const sum = checksum(JSON.stringify(snapshot.frames));
  if (snapshot.checksum !== sum)
    errors.push(
      `checksum mismatch (recorded ${snapshot.checksum}, computed ${sum}) — the payload was ` +
        'truncated or edited after extraction',
    );
  for (const [key, def] of Object.entries(contract.frames)) {
    const f = snapshot.frames[key];
    if (!isObj(f)) {
      errors.push(`frame ${key} missing`);
      continue;
    }
    if (f.error) errors.push(`frame ${key}: extractor reported "${f.error}"`);
    if (f.nodeId !== def.nodeId) errors.push(`frame ${key}: nodeId ${f.nodeId} ≠ ${def.nodeId}`);
    if (!isObj(f.roles)) errors.push(`frame ${key}: roles missing`);
    if (!isObj(f.brandMode) || typeof f.brandMode.name !== 'string')
      errors.push(`frame ${key}: brandMode missing`);
    if (!Array.isArray(f.componentOrder)) errors.push(`frame ${key}: componentOrder missing`);
  }
  for (const key of Object.keys(snapshot.frames)) {
    if (!contract.frames[key]) errors.push(`frame ${key} is not declared in the contract`);
  }
  return errors;
}

/**
 * Full import validation: `validateSnapshot` plus a check that the committed extractor file
 * still declares the version the contract expects.
 * @returns {string[]} problems; empty when the snapshot may be imported.
 */
export function validateForImport(snapshot, contract, extractorFile) {
  const errors = validateSnapshot(snapshot, contract);
  const fileVersion = extractorVersion(extractorFile);
  if (fileVersion !== contract.figma.extractor.version)
    errors.push(
      `${contract.figma.extractor.file} declares version ${fileVersion}, contract expects ` +
        `${contract.figma.extractor.version}`,
    );
  return errors;
}

/**
 * Leaf-level differences between two snapshots' `frames` (capturedAt/checksum are ignored by
 * construction). Arrays whose length changed are reported as one whole-value change.
 * @returns {{ path: string, before: unknown, after: unknown }[]}
 */
export function diffFrames(before, after, base = 'frames') {
  const out = [];
  const walk = (a, b, p) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const bothArrays = Array.isArray(a) && Array.isArray(b) && a.length === b.length;
    if (bothArrays || (isObj(a) && isObj(b))) {
      const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
      for (const k of keys) walk(a[k], b[k], `${p}.${k}`);
    } else out.push({ path: p, before: a, after: b });
  };
  walk(before ?? {}, after ?? {}, base);
  return out;
}

/** Whole days since `capturedAt` (NaN when it isn't a date). */
export function snapshotAgeDays(capturedAt, now = new Date()) {
  return Math.floor((now.getTime() - Date.parse(capturedAt)) / 86_400_000);
}
