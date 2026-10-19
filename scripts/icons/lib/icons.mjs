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
 * Checks 2–4 run once per platform package: web (`lucide-react`) and React Native
 * (`lucide-react-native`, packages/react-native/src/icons/), whose map also has to import each
 * component from its own per-icon subpath (`lucide-react-native/icons/<lucide name>`).
 *
 * Each check returns error strings; an empty array means the check passed.
 */
import Ajv2020 from 'ajv/dist/2020.js';

export const MANIFEST = 'design/icons/icons.json';
export const SCHEMA = 'design/icons/icons.schema.json';
export const WEB_TYPES = 'packages/react/src/icons/types.ts';
export const WEB_LUCIDE = 'packages/react/src/icons/providers/lucide.ts';
export const RN_TYPES = 'packages/react-native/src/icons/types.ts';
export const RN_LUCIDE = 'packages/react-native/src/icons/providers/lucide.ts';

/** Per-platform inputs: label (error prefix), files and the Lucide package. */
export const PLATFORMS = {
  web: { label: 'web', types: WEB_TYPES, map: WEB_LUCIDE, pkg: 'lucide-react' },
  'react-native': {
    label: 'react-native',
    types: RN_TYPES,
    map: RN_LUCIDE,
    pkg: 'lucide-react-native',
  },
};

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

/** `import Plus from 'lucide-react-native/icons/plus'` → { Plus: 'plus' }. */
export function parseSubpathImports(source, pkg) {
  const re = new RegExp(
    `import\\s+([A-Za-z0-9]+)\\s+from\\s+['"]${pkg}/icons/([a-z0-9-]+)['"]`,
    'g',
  );
  return Object.fromEntries([...source.matchAll(re)].map((x) => [x[1], x[2]]));
}

export function checkWebNames(manifest, typesSource, platform = PLATFORMS.web) {
  const { label, types } = platform;
  const names = parseIconNameUnion(typesSource);
  if (!names) return [`${label}-names: no \`export type IconName\` union in ${types}`];
  const want = Object.keys(manifest.icons);
  return [
    ...want
      .filter((n) => !names.includes(n))
      .map((n) => `${label}-names: catalog icon '${n}' is missing from IconName`),
    ...names
      .filter((n) => !want.includes(n))
      .map((n) => `${label}-names: IconName '${n}' is not in the catalog (${MANIFEST})`),
  ];
}

export function checkWebMap(manifest, lucideSource, platform = PLATFORMS.web) {
  const { label, map: file, pkg } = platform;
  const map = parseLucideMap(lucideSource);
  if (!map) return [`${label}-map: no lucideIconMap object in ${file}`];
  // Platforms that import per icon (React Native) must import each component from the
  // subpath of the Lucide name it stands for.
  const subpaths = parseSubpathImports(lucideSource, pkg);
  const checkSubpaths = Object.keys(subpaths).length > 0;
  const out = [];
  for (const [name, { lucide }] of Object.entries(manifest.icons)) {
    const want = lucideComponent(lucide);
    if (!(name in map)) out.push(`${label}-map: '${name}' is not mapped in lucideIconMap`);
    else if (map[name] !== want)
      out.push(
        `${label}-map: '${name}' maps to ${map[name]}, catalog says lucide '${lucide}' (${want})`,
      );
    else if (checkSubpaths && subpaths[want] !== lucide)
      out.push(
        `${label}-map: ${want} must be imported from '${pkg}/icons/${lucide}'` +
          (subpaths[want] ? `, not '${pkg}/icons/${subpaths[want]}'` : ''),
      );
  }
  return out;
}

/**
 * @param hasIcon (lucideName) → whether the installed Lucide package ships that icon
 * @param installedVersion the installed Lucide package version
 */
export function checkArtwork(manifest, hasIcon, installedVersion, platform = PLATFORMS.web) {
  const { pkg } = platform;
  const out = [];
  if (installedVersion !== manifest.provider.version)
    out.push(
      `artwork: installed ${pkg} is ${installedVersion}, catalog provider.version is ${manifest.provider.version} — update both together (every platform pins this version)`,
    );
  for (const [name, { lucide }] of Object.entries(manifest.icons))
    if (!hasIcon(lucide))
      out.push(`artwork: '${name}' → lucide '${lucide}' does not exist in ${pkg}`);
  return out;
}
