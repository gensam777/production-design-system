/**
 * Icon catalog checks (ADR 0019). Pure functions over already-loaded inputs so the tests can
 * feed them broken copies:
 *
 *   1. schema    — design/icons/icons.json against design/icons/icons.schema.json.
 *   2. web-names — the web `IconName` union (packages/react/src/icons/types.ts) has exactly the
 *                  catalog's names.
 *   3. web-map   — the Lucide provider map (packages/react/src/icons/providers/lucide.ts) maps
 *                  every catalog name to the PascalCase component of its `lucide` name.
 *   4. artwork   — every `lucide` name exists in the installed lucide-react, and the installed
 *                  version equals provider.version (every platform pins the same artwork).
 *
 * Each check returns error strings; an empty array means the check passed.
 */
import Ajv2020 from 'ajv/dist/2020.js';

export const MANIFEST = 'design/icons/icons.json';
export const SCHEMA = 'design/icons/icons.schema.json';
export const WEB_TYPES = 'packages/react/src/icons/types.ts';
export const WEB_LUCIDE = 'packages/react/src/icons/providers/lucide.ts';

/** `triangle-alert` → `TriangleAlert` (lucide-react's component naming). */
export const lucideComponent = (name) =>
  name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

export function checkSchema(schema, manifest) {
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  if (validate(manifest)) return [];
  return validate.errors.map(
    (e) =>
      `schema: ${e.instancePath || '/'} ${e.message}${e.params?.additionalProperty ? ` ('${e.params.additionalProperty}')` : ''}`,
  );
}

/** Names in `export type IconName = | 'a' | 'b';`. */
export function parseIconNameUnion(source) {
  const m = source.match(/export\s+type\s+IconName\s*=([^;]+);/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : null;
}

/** `{ plus: Plus, 'arrow-left': ArrowLeft }` entries of `lucideIconMap`. */
export function parseLucideMap(source) {
  const m = source.match(/lucideIconMap[^=]*=\s*\{([^}]*)\}/);
  if (!m) return null;
  return Object.fromEntries(
    [...m[1].matchAll(/['"]?([a-z][a-z0-9-]*)['"]?\s*:\s*([A-Za-z0-9]+)/g)].map((x) => [
      x[1],
      x[2],
    ]),
  );
}

export function checkWebNames(manifest, typesSource) {
  const names = parseIconNameUnion(typesSource);
  if (!names) return [`web-names: no \`export type IconName\` union in ${WEB_TYPES}`];
  const want = Object.keys(manifest.icons);
  return [
    ...want
      .filter((n) => !names.includes(n))
      .map((n) => `web-names: catalog icon '${n}' is missing from IconName`),
    ...names
      .filter((n) => !want.includes(n))
      .map((n) => `web-names: IconName '${n}' is not in the catalog (${MANIFEST})`),
  ];
}

export function checkWebMap(manifest, lucideSource) {
  const map = parseLucideMap(lucideSource);
  if (!map) return [`web-map: no lucideIconMap object in ${WEB_LUCIDE}`];
  const out = [];
  for (const [name, { lucide }] of Object.entries(manifest.icons)) {
    const want = lucideComponent(lucide);
    if (!(name in map)) out.push(`web-map: '${name}' is not mapped in lucideIconMap`);
    else if (map[name] !== want)
      out.push(
        `web-map: '${name}' maps to ${map[name]}, catalog says lucide '${lucide}' (${want})`,
      );
  }
  return out;
}

/**
 * @param hasIcon (lucideName) → whether the installed lucide-react ships that icon
 * @param installedVersion the installed lucide-react version
 */
export function checkArtwork(manifest, hasIcon, installedVersion) {
  const out = [];
  if (installedVersion !== manifest.provider.version)
    out.push(
      `artwork: installed lucide-react is ${installedVersion}, catalog provider.version is ${manifest.provider.version} — update both together (every platform pins this version)`,
    );
  for (const [name, { lucide }] of Object.entries(manifest.icons))
    if (!hasIcon(lucide))
      out.push(`artwork: '${name}' → lucide '${lucide}' does not exist in lucide-react`);
  return out;
}
