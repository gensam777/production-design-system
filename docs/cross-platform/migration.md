# Repo evolution and migration phases

Decision record: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md).
**Current phase: 3 complete (component contracts infrastructure + Button contract); Phase 4 not started.**

## Repo evolution

**One repository for all platforms.** No monorepo tooling until a second consumable package
exists.

| Stage                 | Structure                                                                                                                       | Trigger                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Today (Phases 0–3)    | Single package; `src/tokens/`, `src/components/`, …; new generated outputs and `design/contracts/` are additive                 | —                                                |
| Workspaces (Phase 4+) | Plain **npm workspaces** — `packages/tokens` (`@pds/tokens`), `packages/react` (`@pds/react`), `design/` source                 | `@pds/react-native` work starts                  |
| Native (Phase 5+)     | `platforms/ios` (`PDSTokens`, `PDSUI`; `Package.swift` at repo root), `platforms/android` (`com.pds.tokens`, `com.pds.compose`) | First native reference component                 |
| Split repos           | Not planned                                                                                                                     | Only if independent native teams/cadences appear |

Target layout:

```
/
├─ design/            tokens/ · contracts/ · icons/ · fonts/   (platform-neutral, no code)
├─ packages/          tokens/ (@pds/tokens) · react/ (@pds/react) · react-native/ (@pds/react-native)
├─ platforms/         ios/ (PDSTokens, PDSUI) · android/ (com.pds.tokens, com.pds.compose)
├─ Package.swift
├─ docs/ · governance/ · scripts/ · .claude/skills/
```

## Phases

### Phase 0 — Decide ✅ (committed 5d03e98)

ADRs 0013 / 0014 / 0015 and `docs/cross-platform/`. No token, code, Figma or structure
change.

### Phase 1 — Portable token source ✅ (implemented 2026-10-11)

- Applied ADR 0014 source rules: px font sizes, em-fraction letter-spacing, hex8 overlays,
  single family identities, web platform tier for viewport / layout / font fallbacks,
  `elevation.flat` as an empty shadow list, numeric transition delay, `radius.full` shape marker.
- Build refactored: resolve → `src/tokens/build/ir/<brand>.json` IR → guardrails (keyed by
  token path, plus a new shared-must-not-alias-web scope check) → web emitter.
- **Exit met:** web CSS/JS byte-identical; design-audit report unchanged; `tokens:build`,
  `typecheck`, `lint`, `build`, `build-storybook`, `design:audit`, `design:audit:test` green.
- Moved to Phase 2: text-scaling anchors per typography role (`platform/native/`), because
  the role → Dynamic Type mapping needs design review.
- Details: [token-portability.md](./token-portability.md#phase-1-source-changes-implemented).

### Phase 2 — Native token outputs ✅ (implemented 2026-10-12, ADR 0016)

- Text-scaling anchors per typography role (`platform/native/semantic/text-scaling.json`) and
  provisional Android elevation (`platform/native/semantic/elevation.json`).
- Font asset catalog (`src/tokens/fonts/fonts.json` + schema); per-brand manifests derived
  into the IR. Metadata only — no font files.
- Emitters over the IR: React Native TS, Swift (`PDSTokens`), Kotlin (`com.pds.tokens`) —
  semantic + component-scoped only, both brands. Output in `src/tokens/build/`.
- `npm run tokens:test`: snapshots of all outputs (web byte-identical), IR ↔ native parity,
  RN strict type-check, design-audit resolver ↔ IR parity, guardrail negative tests. CI
  compiles the committed Swift / Kotlin snapshots.
- **Exit:** both brands emitted for all four targets ✅; web byte-identical ✅; local checks
  green ✅. The Swift / Kotlin compile jobs are new and haven't run yet — no local toolchains,
  so they run for the first time on the next CI run.
- **Not done in Phase 2:**
  - Icon catalog → platform-neutral manifest (TS / Swift / Kotlin name types). Wasn't in the
    approved Phase 2 scope; do it before Phase 5.
  - The color-scheme axis that [multi-brand.md](./multi-brand.md) rule 9 reserves isn't in the
    native theme types yet.
- **Provisional until Phase 5:** Android elevation values, font PostScript names
  (`verified: false`), RN Android scaling behavior.

### Phase 3 — Contracts ✅ (implemented 2026-10-12, ADR 0015)

- `design/contracts/schema.json` (JSON Schema 2020-12) +
  `design/contracts/components/button.contract.yaml`.
- `npm run contracts:validate`: schema, no platform API names, semantic + shared token paths
  in every brand's IR, Figma axes ↔ enums + the committed design-audit Figma snapshots, web
  reference (enum unions, defaults, token set ↔ styles). `npm run contracts:test`: negative
  tests for every check + Button's cell-by-cell CSS parity. Both run in CI.
- component-production skill writes / updates the contract (steps 3, 12, 15).
- **Exit:** Button contract validates ✅; matches the live Figma Variant / Size / State axes
  (72 variants, re-audited 2026-10-12) ✅; matches React token usage cell by cell ✅, except
  the declared loading gap below.
- **Loading rule decided** (2026-10-12): loading blocks activation, exposes busy, keeps the
  variant's normal colors and shows the spinner; disabled stays the only visually disabled
  state. Live Figma already does this. The web Button doesn't yet (it forces native
  `disabled` while loading) — recorded as the contract's `implementation-gaps` entry,
  fixed in a later Button change.
- **State precedence decided** (2026-10-12): disabled > loading > default. Disabled + loading
  is disabled (not busy, label shown, cannot activate); loading alone keeps variant colors,
  shows the spinner, is busy, cannot activate and stays focusable. Web gap: with both set it
  shows the spinner and reports busy — second `implementation-gaps` entry.
- **Phase 5 implementation questions** (contract `open-questions`, all `blocks: phase-5`):
  Disabled cells differ between Figma and code for secondary / tertiary / danger; fixed
  visual height vs. text scaling; Figma text-style / icon-size binding gaps; spinner
  thickness and motion token; Figma's On-color binding inconsistency (`text/inverse` vs its
  own spinners' `action.*.on-color`).
- **Not done in Phase 3:** converting the other components' prose "Cross-platform contract"
  sections (Checkbox, Radio, Radio Group, Switch, …) — incremental, via the skill.

### Phase 4 — Workspaces

- npm workspaces; move token source to `design/tokens`, React to `packages/react`.
- Scaffold `Package.swift` and Gradle modules (no components yet).
- **Exit:** `@pds/react`'s public API and CSS entry unchanged for consumers; new ADR
  superseding the rest of 0001.

### Phase 5 — Reference implementations

- Button: React Native → SwiftUI → Compose, each with previews, platform accessibility
  audit, token parity check against the IR.
- Switch second.
- **Exit:** contract checks pass on every platform; MobileLogin-equivalent screen renders
  natively in both brands.

### Phase 6 — Tooling and skills

- Platform-port skill (implements a contract on one platform).
- Native visual regression: swift-snapshot-testing, Paparazzi / Roborazzi, Storybook for
  React Native.
- Per-platform columns in `governance/accessibility.md` checklist and
  `governance/component-lifecycle.md`.
- macOS / Android CI jobs with path filters.

### Phase 7 — Native patterns

Form validation and Settings section natively, after at least three native components exist.

## Tooling evolution summary

| Tool             | Change                                                                                                                                                            | Phase |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Style Dictionary | Kept; build split into resolve → IR → emitters; custom formats for typography, shadow, theme objects                                                              | 1–2   |
| Storybook        | Stays the web behavior record; native uses `#Preview` / `@Preview` (+ optional Storybook for RN)                                                                  | 5     |
| Chromatic        | Web only; native snapshot tools instead                                                                                                                           | 6     |
| CI               | Generated-output snapshots (2); compile checks (2); native jobs only when native packages exist (5–6)                                                             | 2–6   |
| design-audit     | Figma side unchanged; add IR token parity (2), contract checks (3+), native readers later                                                                         | 2+    |
| Skills           | token-production (portability checks), component-production (contracts), figma-screen-sync (route mobile/tablet app to the right target), new platform-port skill | 1–6   |
