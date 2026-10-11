/**
 * Font asset catalog — governance/decisions/0016-native-token-mappings.md.
 *
 * src/tokens/fonts/fonts.json lists every family a brand can resolve to, with one face per
 * weight (file + PostScript name). It is asset METADATA, not tokens, and the repo holds no
 * font files. Each brand's manifest is DERIVED here: the brand's resolved typography roles say
 * which family each font role (`sans`, `mono`) uses and which weights it needs, so brand.json
 * stays the only place a brand picks a family and the shared mono family isn't duplicated.
 *
 * The same rules as fonts.schema.json are enforced in code (no JSON Schema validator
 * dependency yet).
 */
import fs from 'node:fs';

export const FONT_CATALOG = 'src/tokens/fonts/fonts.json';

/** Font roles a typography token's fontFamily may alias (`brand.font.family.sans`,
 * `font.family.mono`). Each maps to a system fallback class on native (ADR 0016). */
export const FONT_ROLES = ['sans', 'mono'];

const WEIGHTS = new Set([100, 200, 300, 400, 500, 600, 700, 800, 900]);
const LICENSES = new Set(['OFL-1.1', 'Apache-2.0']);
const FILE = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*\.(ttf|otf)$/;
const POSTSCRIPT = /^[!-~]{1,63}$/;

export const loadFontCatalog = (file = FONT_CATALOG) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Android resource name for a font file: `Inter-SemiBold.ttf` → `inter_semibold`. */
export const androidResourceName = (file) =>
  file
    .replace(/\.(ttf|otf)$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

/** Structural validation — mirrors src/tokens/fonts/fonts.schema.json. */
export function validateFontCatalog(catalog) {
  const errors = [];
  const where = 'src/tokens/fonts/fonts.json';
  if (catalog?.format !== 'pds.fonts') errors.push(`${where}: format must be "pds.fonts"`);
  if (catalog?.version !== 1) errors.push(`${where}: version must be 1`);
  const families = Object.entries(catalog?.families ?? {});
  if (!families.length) errors.push(`${where}: families is empty`);
  const files = new Map();
  const postScriptNames = new Map();
  const resources = new Map();
  for (const [name, fam] of families) {
    const at = `${where} ${name}`;
    if (!LICENSES.has(fam.license)) errors.push(`${at}: unknown license "${fam.license}"`);
    if (!fam.source?.name || !fam.source?.url) errors.push(`${at}: source needs name and url`);
    if (typeof fam.verified !== 'boolean') errors.push(`${at}: verified must be a boolean`);
    if (!Array.isArray(fam.faces) || !fam.faces.length) {
      errors.push(`${at}: faces is empty`);
      continue;
    }
    const seen = new Set();
    for (const face of fam.faces) {
      const id = `${at} ${face.weight}/${face.style}`;
      if (!WEIGHTS.has(face.weight)) errors.push(`${id}: weight must be 100–900 in steps of 100`);
      if (!['normal', 'italic'].includes(face.style))
        errors.push(`${id}: style must be normal or italic`);
      if (!FILE.test(face.file ?? '')) errors.push(`${id}: invalid file name "${face.file}"`);
      if (!POSTSCRIPT.test(face.postScriptName ?? ''))
        errors.push(`${id}: invalid PostScript name "${face.postScriptName}"`);
      const key = `${face.weight}/${face.style}`;
      if (seen.has(key)) errors.push(`${id}: duplicate face`);
      seen.add(key);
      for (const [map, value, what] of [
        [files, face.file, 'file'],
        [postScriptNames, face.postScriptName, 'PostScript name'],
        [resources, face.file && androidResourceName(face.file), 'Android resource name'],
      ]) {
        if (map.has(value))
          errors.push(`${id}: ${what} "${value}" is also used by ${map.get(value)}`);
        else map.set(value, id);
      }
    }
  }
  return errors;
}

/** `brand.font.family.sans` / `font.family.mono` → `sans` / `mono`. */
const roleOf = (refPath) => /(?:^|\.)font\.family\.([^.]+)$/.exec(refPath ?? '')?.[1] ?? null;

/**
 * Derive one brand's manifest from its resolved IR tokens.
 * @returns {{ manifest: Record<string, {family: string, faces: object[]}>, errors: string[] }}
 */
export function fontManifest(tokens, catalog) {
  const errors = [];
  const roles = new Map(); // role → { family, weights:Set }
  for (const t of tokens) {
    if (t.type !== 'typography' || t.scope !== 'shared') continue;
    const role = roleOf(t.refs?.fontFamily);
    if (!role) {
      errors.push(
        `${t.path}: fontFamily must alias a font family token (brand.font.family.* / font.family.*)`,
      );
      continue;
    }
    if (!FONT_ROLES.includes(role)) {
      errors.push(`${t.path}: unknown font role "${role}" (known: ${FONT_ROLES.join(', ')})`);
      continue;
    }
    const r = roles.get(role) ?? { family: t.value.fontFamily, weights: new Set() };
    if (r.family !== t.value.fontFamily)
      errors.push(`font role ${role} resolves to both "${r.family}" and "${t.value.fontFamily}"`);
    r.weights.add(t.value.fontWeight);
    roles.set(role, r);
  }

  const manifest = {};
  for (const [role, { family, weights }] of roles) {
    const fam = catalog?.families?.[family];
    if (!fam) {
      errors.push(`font family "${family}" (role ${role}) is not in src/tokens/fonts/fonts.json`);
      continue;
    }
    const faces = [];
    for (const weight of [...weights].sort((a, b) => a - b)) {
      const face = fam.faces.find((f) => f.weight === weight && f.style === 'normal');
      if (!face) {
        errors.push(
          `font family "${family}" has no ${weight} normal face in src/tokens/fonts/fonts.json`,
        );
        continue;
      }
      faces.push({
        weight,
        style: face.style,
        postScriptName: face.postScriptName,
        file: face.file,
        androidResource: androidResourceName(face.file),
      });
    }
    manifest[role] = { family, license: fam.license, verified: fam.verified, faces };
  }
  return { manifest, errors };
}
