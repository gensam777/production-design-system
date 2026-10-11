/**
 * Multi-brand token build — see governance/decisions/0011-multi-brand-token-architecture.md,
 * 0014-token-source-portability.md, docs/foundations/theming.md and
 * docs/cross-platform/token-portability.md.
 *
 *   source                          resolve (per brand)        guard            emit
 *   core/  brands/<brand>/  ──┐
 *   semantic/                 ├──► platform-neutral IR ──► contract, scopes, ──► web CSS + JS
 *   platform/web/{core,semantic}┘   build/ir/<brand>.json     invariance,          (scripts/tokens/
 *                                   (scripts/tokens/ir.mjs)    contrast             emit-web.mjs)
 *                                                              (scripts/tokens/guards.mjs)
 *
 * The IR holds every resolved token in source units, with its tier (core/semantic), scope
 * (shared/web) and brand-dependence. Emitters read only the IR; `brand.*` tokens never reach
 * it, so no output can expose them. React Native / Swift / Kotlin emitters are Phase 2 and
 * will read the same IR, keeping only `scope: "shared"` tokens.
 *
 * The build FAILS (non-zero exit) on:
 *   - an incomplete or extra brand contract (every brand must define exactly the default
 *     brand's `brand.*` leaves, and nothing outside `brand`)
 *   - a shared token aliasing a platform-tier (web-only) token
 *   - a brand-independent token that resolves differently between brands
 *   - any per-brand WCAG contrast pair below its minimum (see CONTRAST_PAIRS)
 */
import fs from 'node:fs';

import { emitWeb } from './tokens/emit-web.mjs';
import {
  checkBrandContract,
  checkContrast,
  checkScopes,
  checkSharedInvariance,
} from './tokens/guards.mjs';
import { BRANDS, DEFAULT_BRAND, TOKENS, resolveBrand } from './tokens/ir.mjs';

export { BRANDS, DEFAULT_BRAND };

const BUILD = `${TOKENS}/build`;

function fail(errors) {
  console.error(`\n✖ Token build failed:\n${errors.map((e) => `  - ${e}`).join('\n')}\n`);
  process.exit(1);
}

// Guardrail 1 runs on source, before anything is resolved.
const contractErrors = checkBrandContract();
if (contractErrors.length) fail(contractErrors);

// Stage 1 — resolve every brand into its IR.
const irs = [];
for (const brand of BRANDS) irs.push(await resolveBrand(brand));

// Stage 2 — guardrails on the IR.
const { errors: contrastErrors, report: contrastReport } = checkContrast(irs);
const errors = [...irs.flatMap(checkScopes), ...checkSharedInvariance(irs), ...contrastErrors];
if (errors.length) fail(errors);

// Stage 3 — write the IR, then emit web outputs from it.
fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(`${BUILD}/ir`, { recursive: true });
for (const ir of irs) {
  fs.writeFileSync(`${BUILD}/ir/${ir.brand}.json`, `${JSON.stringify(ir, null, 2)}\n`);
  await emitWeb(ir, BUILD);
}

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
console.log(`  Brand-dependent semantic tokens (${dependent.length}): ${dependent.join(', ')}`);
for (const brand of BRANDS) {
  const rows = contrastReport.filter((r) => r.brand === brand);
  const weakest = rows.reduce((w, r) => (r.ratio / r.min < w.ratio / w.min ? r : w));
  console.log(
    `  Contrast ${brand}: ${rows.length}/${rows.length} pairs pass (tightest: ${weakest.pair} ${weakest.ratio}:1, min ${weakest.min}).`,
  );
}
