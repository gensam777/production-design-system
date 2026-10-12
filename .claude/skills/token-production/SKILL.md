---
name: token-production
description: Production workflow for design-token and Figma-variable changes — primitive (Core), brand (Brand A / Brand B), semantic and component-scoped tokens across color, typography, spacing, radius, elevation, motion, breakpoints/layout and icon size. Discovers what changed (Figma variables and/or `design/tokens/`), checks the Core → Brand → Semantic → Component architecture, reports impact (aliases, brands, components, examples, generated outputs, contrast, breaking changes) and pauses, then applies the approved change to token source (and Figma if approved), regenerates outputs and verifies parity. Use for "/token-production", "sync my token changes", "update the design tokens", "I changed variables in Figma", or any add/change/rename/remove of a token or variable. Not for component architecture (component-production), product screens (figma-screen-sync) or drift-only checks (design-audit). Never commits, pushes, opens PRs, or accepts Chromatic baselines.
---

# Token production

This skill owns **token and variable architecture changes**: adding, changing, re-aliasing,
renaming or removing a token in `design/tokens/` and/or a Figma Variable (or a Text/Effect
Style that represents a token). It makes that a repeatable pipeline: discover → architecture
check → impact → source-of-truth check → propose and pause → apply → regenerate → validate
→ parity → report.

`CLAUDE.md` overrides anything here. Read it first, then the ADRs and foundation docs for
every category the change touches (table below). Related skills:

- **`component-production`** — a component's structure, API or which token a component
  consumes. If a token change needs a component change, propose that part as a
  component-production task. Don't do it inside this skill.
- **`figma-screen-sync`** — product screens in `packages/react/src/examples/`.
- **`design-audit`** — Figma ↔ code drift detection for audited surfaces. Use it to refresh
  the snapshot after a Figma variable change that touches an audited surface.

## Hard rules (non-negotiable)

1. **Canonical Figma file only:** `zE07Pl0ioDayHN2GK2set7`. Call `create_session` first.
   Load `figma:figma-use` before any `use_figma` call (and `figma:figma-generate-library`
   before creating variables or styles).
2. **Read-only until approval.** Steps 1–5 change nothing: no token JSON edits, no Figma
   writes, no build-config edits. Raw dumps and comparison scripts go in the session
   scratchpad, never the repo.
3. **Two mandatory pauses:** on any Figma ↔ code conflict (step 4), and after the proposal
   (step 5). A request like "sync my token changes" authorizes discovery and the proposal
   only.
4. **Respect the layers.** Core → Brand → Semantic → Component, and components consume
   semantic tokens only (enforced by `scripts/check-token-usage.mjs`). Never "fix" a
   consumer by pointing it at a Core or `brand.*` token, or by adding a new
   `token-usage-exceptions.json` entry without approval.
5. **No speculative tokens.** A new token needs a real current consumer or an approved
   design decision. Prefer reusing or re-aliasing an existing role. A new Core step needs
   a semantic role that actually uses it.
6. **One contract for every brand.** Semantic token names never vary by brand. Brands
   differ only inside the `brand.*` contract. Never duplicate a semantic or component token
   per brand, and never add a brand-specific value outside `brands/<brand>/`.
7. **Never hand-edit generated files** (`packages/tokens/build/**`). Change the source, then run
   `npm run tokens:build`.
8. **Never delete or rename a token that still has consumers.** Migrate the consumers first
   (step 10).
9. **Preserve Figma variable identity.** Rename a variable in place, don't delete and
   recreate it: deleting breaks every binding and remote reference. Never delete a
   variable or style that is still bound.
10. **Don't commit, push, open PRs, or accept Chromatic baselines.**

## Architecture reference

**Layers (ADR 0011):**

| Layer | Code | Figma | Varies by brand | Who may consume it |
| --- | --- | --- | --- | --- |
| Core (shared primitives) | `design/tokens/core/*.json` | `Core` collection (single mode) | No | Brand and semantic token aliases only. Also `viewport.*` inside `@media` queries. |
| Brand | `design/tokens/brands/<brand>/brand.json` | `Brand` collection, modes **Brand A / Brand B** | **Yes** | Semantic token aliases only. Never emitted to CSS/JS. |
| Semantic (public contract) | `design/tokens/semantic/*.json` | `Semantic Color/Space/Radius/Motion/Layout/Icon` collections, Text Styles, Effect Styles | Names never; values only through `brand.*` aliases | Components, patterns, examples |
| Component-scoped | Inside the semantic files, under the component's name (e.g. `color.switch.track.*`, `radius.checkbox`) | Variables in the matching Semantic collection | Normally shared | That component only, until a second consumer justifies promoting it to a shared role |

**Brand contract (13 tokens):** `brand.color.primary.{50…900}`, `brand.font.family.sans`,
`brand.radius.control`, `brand.radius.container`. Every brand must define exactly the same
set (enforced by the build). Figma's `Brand` collection also has `font/weight/*` style-name
adapters, which are Figma-only. Changing the contract's shape is an architecture change:
it needs an ADR 0011 update and every brand filled in.

**Per category:**

| Category | Core | Semantic | Figma representation | ADR / doc |
| --- | --- | --- | --- | --- |
| Color | `core/color.json` | `semantic/color.json` | Core `color/*`, Brand `color/primary/*`, `Semantic Color` | 0002, 0011 · `color.md` |
| Typography | `core/typography.json` | `semantic/typography.json` (composite roles) | Core `font/*` variables + Brand family/weight, and **Text Styles** (no semantic variables) | 0003 · `typography.md` |
| Spacing | `core/spacing.json` | `semantic/spacing.json` | `Semantic Space` | 0004 · `spacing.md` |
| Radius | `core/radius.json` | `semantic/radius.json` | `Semantic Radius` (+ Brand `radius/*`) | 0006, 0011 · `radius.md` |
| Elevation | `core/shadow.json` | `semantic/elevation.json` | **Effect Styles** (shadow color bound to `Semantic Color`) | 0007 · `elevation.md` |
| Motion | `core/motion.json` | `semantic/motion.json` | `Semantic Motion` (TIMING/EASING) + reduced-motion output | 0008 · `motion.md` |
| Breakpoints / layout (web-only tier) | `platform/web/core/viewport.json` | `platform/web/semantic/layout.json` | `Semantic Layout` | 0009 · 0014 · `responsive.md` |
| Icon size | `core/icon.json` | `semantic/icon.json` | `Semantic Icon` | 0010 · `icons.md` |

Collection split: ADR 0005. Docs live in `docs/foundations/`, ADRs in `governance/decisions/`.

**Name mapping across Figma ↔ source ↔ output.** Semantic collections drop the category
prefix (ADR 0005), so the same token has three spellings:

| Figma | Source | CSS custom property |
| --- | --- | --- |
| `Semantic Space` › `stack/md` | `space.stack.md` | `--space-stack-md` |
| `Semantic Color` › `surface/canvas` | `color.surface.canvas` | `--color-surface-canvas` |

Always match a Figma variable to its code token through this mapping and the resolved
value, never by name similarity alone.

**Build guardrails** (`packages/tokens/scripts/build.mjs` → `packages/tokens/scripts/guards.mjs`, run on the
platform-neutral IR in `packages/tokens/build/ir/<brand>.json`; it fails on any of these):
- an incomplete or extra brand contract;
- a platform-tier token overriding a shared token (tiers may only add);
- a shared token aliasing a platform-tier (web- or native-only) token;
- a shared (brand-independent) token that resolves differently between brands;
- a per-brand WCAG contrast pair below its minimum (`CONTRAST_PAIRS`, keyed by token path);
- an invalid font catalog (`design/fonts/fonts.json`), or a family × weight a typography
  role uses with no face in it;
- native mappings (ADR 0016): a typography role (`text.<group>.<size>`) without a valid iOS
  anchor in `platform/native/semantic/text-scaling.json`, or an orphan anchor; an
  `elevation.*` role without an Android height in `platform/native/semantic/elevation.json`,
  or heights that don't grow with the shadow; a token type with no native mapping
  (`packages/tokens/scripts/native.mjs`); two paths mapping to one native name (`on-color`/`onColor`);
  brands with different native theme shapes.

`npm run lint` additionally runs the token-usage guard. `npm run tokens:test` compares every
generated output — web and native — with its committed snapshot.

## Workflow

### 0. Pre-flight

- Run `git status --short` and check the branch. Note pre-existing changes. If on `main`,
  propose a `feat/…` or `fix/…` branch in the proposal (don't create it before approval).
- Read `CLAUDE.md`, ADR 0011, and the ADR plus foundation doc for each category involved.

### 1. Discover the change (read-only)

Find out where the change came from: the user says, `git diff`/`git status` on
`design/tokens/` shows a code-side edit, or nothing local changed (assume a Figma-side change).

1. **Code side.** Load the token source, and the generated per-brand values from
   `packages/tokens/build/js/tokens.<brand>.js` (resolved values) or a scratchpad script that
   resolves aliases. `git diff` shows uncommitted source edits.
2. **Figma side.** Use a read-only `use_figma` call that dumps every local collection:
   collection name, modes, and for each variable its name, type, scopes, `valuesByMode`
   (with aliases resolved to the target's collection and name), description and
   `remote`. For typography and elevation, also dump Text Styles and Effect Styles with
   their bound variables. Save the dump to the scratchpad.
3. **Diff the two** through the name mapping above, per brand/mode. Classify each
   difference:
   - **New** — exists on one side only, and is wanted.
   - **Changed value** — a raw value differs (in which mode or brand).
   - **Alias change** — it points to a different token or variable.
   - **Renamed** — same value, alias and role under a new name. Confirm it's a rename by
     variable ID or binding continuity in Figma; don't infer it from the name alone.
   - **Deleted** — gone on one side.
   - **Brand-mode change** — only one brand's value changed.
   - **Metadata only** — description or Figma scopes.
4. For each changed token, record its **layer** (core / brand / semantic / component-scoped),
   **category**, and **affected modes/brands**.

If the diff contains changes the user didn't mention, list them separately. They may be
unrelated drift; don't assume they're part of this change.

### 2. Architecture check

For each change, verify the layer chain and flag (don't fix) any of these:

- A component, pattern or example consuming a Core or `brand.*` token directly (in code,
  or a Figma component bound to `Core`/`Brand` variables).
- A semantic token aliasing another semantic token where a Core alias was intended, or
  a brand-dependent value hard-coded in a semantic token instead of going through `brand.*`.
- **Duplicate semantic roles:** a new token whose role and value already exist under
  another name.
- **Unnecessary new primitives:** a new Core step with no semantic role using it, or one
  that duplicates an existing step's value.
- **Raw values where a token should exist:** a literal in a semantic token or a Figma
  variable where a Core alias fits.
- **Brand leaks:** a brand-specific value outside `brands/<brand>/`; anything that would
  make a shared token differ between brands (the build will fail); a change to the
  contract's shape.
- **Brand-specific duplication:** e.g. `button.primary.brand-b.*`.
- **Component-scoped tokens:** justified only by a real component-specific need (precedents:
  `radius.checkbox` stays square in every brand; `switch.track.background.off.*` is
  Switch-only). Promote to a shared role only when a second consumer exists.

### 3. Impact analysis

Trace each changed token **forward** through aliases to every consumer:

- **Aliases:** every semantic or brand token that resolves through it (search the source
  JSON for `{path.to.token}`), recursively.
- **Brand A / Brand B values:** before and after, per brand.
- **Code consumers:** grep the CSS custom property (`--…`) and JS token names in
  `packages/react/src/{components,patterns,examples}`, `packages/react/.storybook`, `docs/`,
  `scripts/token-usage-exceptions.json` and `scripts/design-audit/surfaces/*.json`.
- **Figma consumers:** components, styles and product frames bound to the variable. Run
  read-only `use_figma` searches for `boundVariables` referencing the variable ID, one
  call per page in parallel (per figma-use's page rules).
- **Components, patterns/templates and product examples** affected.
- **Generated outputs** that change: `css/variables.css`, `css/typography.css`,
  `css/motion-reduced-motion.css`, `css/brands/<brand>.css`, `js/tokens*.js`.
- **Breaking?** Per `governance/versioning.md`, a rename, a removal, or a scale change
  that alters layout or meaning is breaking. Adding a token is not.

Also check:
- **Contrast/accessibility:** any changed color in a `CONTRAST_PAIRS` pair, or one used as
  text/background/focus without a listed pair. Compute the ratio per brand. A new
  text/background role needs a contrast pair added.
- **Typography compatibility:** both brand families still fit the scale (line height,
  weights present in the font files, no new clipping); the Text Style still binds the
  same variables.
- **Responsive behavior:** spacing, layout or viewport changes against the breakpoints
  and the App shell / Dashboard reflow.
- **Cross-platform readiness (ADR 0014):** valid DTCG `$type`/`$value` with no CSS syntax in
  shared source — no `calc()`/`var()`/`clamp()`, no `rem`/`em`/`ms` strings, no
  `rgb()`/`rgba()` (use hex or hex8), no font fallback stacks (family identity only).
  Dimensions are px numbers, durations ms numbers, letter-spacing a fraction of font size
  with `$extensions["com.pds"].unit = "em"`. Web-only tokens go in `platform/web/{core,semantic}`;
  a shared token may never alias them. Web units (rem for spacing/font size; px for radius,
  shadow, viewport, layout, icon) are applied by the web emitter, not authored.
- **Native outputs (ADR 0016):** every semantic token is emitted to React Native, Swift and
  Kotlin, so report native impact too. A new typography role needs a `textScaling.*` anchor;
  a new elevation role needs an `elevationHeight.*` value (provisional until Phase 5); a new
  font family or weight needs a face in `design/fonts/fonts.json` (metadata only — never
  add font files); a new token type needs a mapping in `packages/tokens/scripts/native.mjs` and the
  three emitters. Native-only values go in `platform/native/semantic/`, never shared source.
  Core and `brand.*` tokens are never exposed natively.

### 4. Source of truth (Figma first)

- **Change came from Figma:** confirm it from the real data: collection, mode, resolved
  value, alias target (by variable ID, not just name), and the bindings on actual nodes.
  Don't trust a variable's name to tell you its role.
- **Change came from code:** compare it against the current Figma variables before
  proposing to propagate it either way.
- **Figma and code disagree** in a way the user didn't ask for (e.g. both sides changed,
  or code is on a value Figma never had): **stop and report the conflict** with both
  values, which side changed and when (git log, Figma evidence), and the options. Don't
  choose a source silently. `CLAUDE.md` says code wins for anything already released;
  apply that only as a recommendation for the user to confirm.

### 5. Propose, then pause

Report concisely, then **stop and wait for approval**:

1. **Detected change(s)** — token, layer, category, kind (new/changed/alias/rename/
   delete/brand-mode/metadata), affected modes/brands, origin (Figma/code).
2. **Architecture** — valid, or the flags from step 2 with recommendations.
3. **Impact** — aliases, brand values before/after, components/patterns/examples,
   generated outputs, contrast (ratios per brand), typography/responsive/cross-platform
   notes.
4. **Exact changes planned** — each source file and key, each Figma variable/style
   (collection › name › mode), and any docs (foundation doc, ADR, `CLAUDE.md`,
   `docs/design-to-code-mappings.md`, contrast pairs).
5. **Migration** — for renames/removals: the consumer list and the migration order
   (step 10).
6. **Risk** — breaking (semver impact per `governance/versioning.md`), visual changes in
   shipped components, anything that needs a `design-audit` snapshot refresh.

### 6. Apply (after approval only)

- **Token source:** edit `design/tokens/{core,brands/<brand>,semantic,platform/{web,native}/{core,semantic}}/*.json` in DTCG format
  (`$value`, `$type`, `$description`). Keep aliases rather than inlining values, and
  write a `$description` that explains the role.
- **Brands:** a `brand.*` change goes in every brand's file where it applies. A new
  contract leaf is added to **all** brands in the same change.
- **Figma (only if the approved plan includes it):** update the same variables in place.
  Set `scopes` explicitly on new variables. Set values for **every** mode of the Brand
  collection. Rebind Text/Effect Styles if typography or elevation changed. Return and
  record every touched variable/style ID.
- **Style Dictionary** (`packages/tokens/style-dictionary.config.mjs` = web emitter transforms/formats;
  `packages/tokens/scripts/build.mjs` + `packages/tokens/scripts/{ir,fonts,guards,emit-web,native,emit-react-native,emit-swift,emit-kotlin}.mjs`
  = resolve → IR → guard → emit): only
  when the change genuinely needs it, e.g. a new token type, a new output file, or a new
  `CONTRAST_PAIRS` entry for a new text/background role. Otherwise leave them alone.
- **Docs:** the category's foundation doc (token tables), the ADR if a decision changed,
  `docs/foundations/theming.md` for brand-contract changes, the `CLAUDE.md` Token
  collections row if Figma collections changed, and `docs/design-to-code-mappings.md`
  where a component's token mapping changed.
- Nothing speculative: no extra steps, roles or modes "for later".

### 7. Generated outputs

Run `npm run tokens:build`. Then confirm:
- **Web CSS:** the expected custom properties changed (diff `packages/tokens/build/css/**`),
  in the right file (shared vs `brands/<brand>.css`), and nothing else moved.
- **JS:** `js/tokens.js` and `js/tokens.<brand>.js` changed accordingly.
- **Build summary:** the brand contract count and the brand-dependent token list are as
  expected (a shared token newly showing up as brand-dependent is a red flag), and the
  contrast table passes.
- **Native outputs:** `packages/tokens/build/react-native/`, `platforms/ios/Sources/PDSTokens/`
  and `platforms/android/tokens/src/main/kotlin/com/pds/tokens/` changed only where the
  token changed (same token, same brands). `npm run tokens:build` rewrites the committed Swift
  and Kotlin sources in `platforms/` directly — review their `git diff`; they ship with the
  token change (CI fails if they're stale). Then run `npm run tokens:test`: a snapshot diff is
  expected for every web / React Native output you changed and nothing else. Web snapshots must
  not change unless the web change was approved. After review, `npm run tokens:test:update`
  and include the snapshot and `platforms/` diffs in the report.
- **Cross-platform compatibility:** the source stays portable (step 3).

Generated files are only ever produced by the build, never edited by hand.

### 8. Validation

Run in order and report pass/fail per command:

```
npm run tokens:build      # includes brand-contract, shared-consistency, contrast, font and native-mapping guards
npm run tokens:test       # snapshots (web byte-identical, native), IR ↔ native parity, guard tests
npm run typecheck         # also type-checks the generated React Native module
npm run lint              # includes scripts/check-token-usage.mjs
npm run build
npm run build-storybook
```

Also run `npm run format:check` on changed files. Run `npm run design:audit` when a changed
token is used by an audited surface (`scripts/design-audit/surfaces/*.json`, currently
Login). It reads the committed snapshot, so after a Figma-side change, refresh the
snapshot with the `design-audit` skill before trusting the result.

### 9. Parity checks

- **A. Figma variable parity.** Re-read the changed variables or styles: every mode or
  brand value and alias matches the approved plan.
- **B. Token-source parity.** The source token resolves to the same value and alias
  target as Figma, per brand, via the name mapping.
- **C. Generated-output parity.** The CSS custom property and JS value per brand equal
  the resolved source values (read them from `packages/tokens/build/**`, not from memory).
- **D. Brand A / Brand B parity.** Brand-dependent tokens differ only as intended; shared
  tokens are identical (the build checks this; confirm it in the summary). The contrast
  ratio for every affected pair is reported per brand.
- **E. Rendered behavior.** When rendered UI changes, verify it live in Storybook in both
  brands (`&globals=brand:brand-b`). Cover the affected component stories, affected
  `Examples/*` screens, and `Brands/Side by side` for brand changes. Check the changed values
  as rendered (computed style), contrast, focus visibility, text wrapping/clipping for
  typography, and reflow at the breakpoints for layout/viewport changes. Use the
  `claude-in-chrome` skill. If no browser is available, don't claim visual parity: list
  what still needs checking and end with **"Ready for manual visual review, not ready
  for commit yet."** (component-production's rule).

### 10. Breaking changes (rename / remove)

1. **Find every consumer first:** code, docs, Figma bindings, design-audit contracts,
   token-usage exceptions, contrast pairs.
2. **Propose a migration:** the new token, which consumers move, and in what order.
   Prefer a period where both names exist: keep the old token aliasing the new one, with a
   `$description` starting "Deprecated: use `<new>`". The repo has no deprecation
   mechanism yet, so the exact form (description note vs DTCG `$deprecated`) is the
   user's decision the first time it comes up. Record it in the relevant foundation doc
   once decided.
3. **Migrate consumers**, then remove the old token only when nothing references it and
   the user has approved the removal. In Figma, rename in place where it's a true rename,
   so bindings survive.
4. **Note the semver impact** for the manual changelog/version bump
   (`governance/versioning.md`; Changesets is deferred).

### 11. Report

1. **Token changes** — each token: layer, kind, before → after per brand/mode.
2. **Affected brands** — Brand A / Brand B values, brand-dependent list changes.
3. **Aliases changed.**
4. **Components / patterns / screens affected.**
5. **Figma changes** — variable/style IDs touched, or "none".
6. **Generated outputs** — which files changed and what moved.
7. **Validation** — pass/fail per command.
8. **Parity** — A–E results; E with what was actually exercised live.
9. **Visual / accessibility impact** — contrast ratios per brand, visible changes.
10. **Breaking / migration** — semver impact, deprecations, remaining consumers.
11. **Remaining blockers** — unresolved conflicts, a stale design-audit snapshot, manual
    checks still needed.
12. **Ready for commit?** — only when validation passes, parity A–D passes, and E was
    verified live (or the user confirmed it). Everything is left uncommitted.
