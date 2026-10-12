/**
 * Multi-brand token build — see governance/decisions/0011-multi-brand-token-architecture.md,
 * 0014-token-source-portability.md, 0016-native-token-mappings.md, docs/foundations/theming.md
 * and docs/cross-platform/token-portability.md.
 *
 *   source (design/)                resolve (per brand)        guard            emit
 *   tokens/core/             ──┐
 *   tokens/brands/<brand>/     │
 *   tokens/semantic/           ├─► platform-neutral IR ──► contract, scopes, ──► web CSS + JS
 *   tokens/platform/{web,native}    build/ir/<brand>.json     invariance,          (emit-web.mjs)
 *   fonts/fonts.json ──────────┘    (ir.mjs)                  contrast, fonts, ─► React Native TS
 *                                                              native mappings     (emit-react-native)
 *                                                              (guards.mjs)      ─► Swift PDSTokens
 *                                                                                ─► Kotlin com.pds.tokens
 *
 * Outputs (paths.mjs): IR, web CSS/JS and React Native TS go to packages/tokens/build/
 * (gitignored; exposed through @pds/tokens' package exports). Swift and Kotlin go straight
 * into the committed native sources — platforms/ios/Sources/PDSTokens/ and
 * platforms/android/tokens/src/main/kotlin/com/pds/tokens/ — because SwiftPM and Gradle
 * consumers build them without a Node step; npm run tokens:test fails if they're stale.
 *
 * The IR holds every resolved token in source units, with its tier (core/semantic), scope
 * (shared/web/native) and brand-dependence, plus the brand's font manifest. Emitters read only
 * the IR; `brand.*` tokens never reach it, so no output can expose them. Native emitters
 * expose semantic `shared` tokens only (native.mjs), folding the native tier (text-scaling anchors,
 * Android elevation) into them.
 *
 * The build FAILS (non-zero exit) on:
 *   - an incomplete or extra brand contract (every brand must define exactly the default
 *     brand's `brand.*` leaves, and nothing outside `brand`)
 *   - a platform-tier token overriding a shared token
 *   - a shared token aliasing a platform-tier token
 *   - a brand-independent token that resolves differently between brands
 *   - any per-brand WCAG contrast pair below its minimum (see CONTRAST_PAIRS)
 *   - an invalid font catalog, or a family × weight a brand uses with no catalog face
 *   - a missing / invalid native mapping (text-scaling anchor, Android elevation, token type),
 *     a native naming collision, or a theme shape that differs between brands
 */
import fs from 'node:fs';

import { emitKotlin } from './emit-kotlin.mjs';
import { emitReactNative } from './emit-react-native.mjs';
import { emitSwift } from './emit-swift.mjs';
import { emitWeb } from './emit-web.mjs';
import { loadFontCatalog } from './fonts.mjs';
import {
  checkBrandContract,
  checkContrast,
  checkFonts,
  checkNative,
  checkPlatformOverrides,
  checkScopes,
  checkSharedInvariance,
} from './guards.mjs';
import { BRANDS, DEFAULT_BRAND, resolveBrand } from './ir.mjs';
import { BUILD, KOTLIN_SOURCES, REPO_ROOT, SWIFT_SOURCES } from './paths.mjs';

export { BRANDS, DEFAULT_BRAND };

// Every path is repo-root-relative — same result from the root or from this workspace.
process.chdir(REPO_ROOT);

function fail(errors) {
  console.error(`\n✖ Token build failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n`);
  process.exit(1);
}

// Guardrails that run on source, before anything is resolved.
const sourceErrors = [...checkBrandContract(), ...checkPlatformOverrides()];
if (sourceErrors.length) fail(sourceErrors);

// Stage 1 — resolve every brand into its IR (including its font manifest).
const fontCatalog = loadFontCatalog();
const irs = [];
for (const brand of BRANDS) irs.push(await resolveBrand(brand, { fontCatalog }));

// Stage 2 — guardrails on the IR, including the native mappings (ADR 0016).
const { errors: contrastErrors, report: contrastReport } = checkContrast(irs);
const { models, errors: nativeErrors } = checkNative(irs);
const errors = [
  ...irs.flatMap(checkScopes),
  ...checkSharedInvariance(irs),
  ...contrastErrors,
  ...checkFonts(irs, fontCatalog),
  ...nativeErrors,
];
if (errors.length) fail(errors);

// Stage 3 — write the IR, then emit every platform from it.
fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(`${BUILD}/ir`, { recursive: true });
for (const ir of irs) {
  fs.writeFileSync(`${BUILD}/ir/${ir.brand}.json`, `${JSON.stringify(ir, null, 2)}\n`);
  await emitWeb(ir, BUILD);
}
// Native source dirs hold only generated files: clear the old ones first so a file the emitter
// stops producing doesn't linger in a committed dir.
const writeAll = (dir, files, ext) => {
  fs.mkdirSync(dir, { recursive: true });
  if (ext) for (const f of fs.readdirSync(dir)) if (f.endsWith(ext)) fs.rmSync(`${dir}/${f}`);
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(`${dir}/${name}`, content);
  return Object.keys(files).length;
};
const nativeCounts = {
  'react-native': writeAll(`${BUILD}/react-native`, emitReactNative(models)),
  swift: writeAll(SWIFT_SOURCES, emitSwift(models), '.swift'),
  kotlin: writeAll(KOTLIN_SOURCES, emitKotlin(models), '.kt'),
};

const reference = irs.find((ir) => ir.default);
const dependent = reference.tokens.filter((t) => t.brandDependent).map((t) => t.path);
const scopes = Object.entries(
  reference.tokens.reduce((acc, t) => ({ ...acc, [t.scope]: (acc[t.scope] ?? 0) + 1 }), {}),
)
  .map(([s, n]) => `${n} ${s}`)
  .join(', ');
console.log(`✔ Tokens built for ${BRANDS.join(', ')} (default: ${DEFAULT_BRAND}).`);
console.log(`  IR: ${reference.tokens.length} tokens per brand (${scopes}) → ${BUILD}/ir/.`);
console.log(`  Brand contract: ${reference.brandContract.length} brand.* tokens per brand.`);
const exposed = reference.tokens.filter((t) => t.tier === 'semantic' && t.scope === 'shared');
console.log(
  `  Native: ${exposed.length} semantic tokens + ${Object.keys(reference.fonts).length} font roles per brand → ` +
    Object.entries(nativeCounts)
      .map(([p, n]) => `${p} (${n} file${n === 1 ? '' : 's'})`)
      .join(', ') +
    '.',
);
console.log(`  Brand-dependent semantic tokens (${dependent.length}): ${dependent.join(', ')}`);
for (const brand of BRANDS) {
  const rows = contrastReport.filter((r) => r.brand === brand);
  const weakest = rows.reduce((w, r) => (r.ratio / r.min < w.ratio / w.min ? r : w));
  console.log(
    `  Contrast ${brand}: ${rows.length}/${rows.length} pairs pass (tightest: ${weakest.pair} ${weakest.ratio}:1, min ${weakest.min}).`,
  );
}
