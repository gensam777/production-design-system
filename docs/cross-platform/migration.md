# Repo evolution and migration phases

Decision record: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md).
**Current phase: 4 complete (npm workspaces, `design/` source, native package scaffolding —
[ADR 0017](../../governance/decisions/0017-workspace-structure.md)); Phase 5 in progress — decisions
made ([ADR 0018](../../governance/decisions/0018-cross-platform-button.md),
[ADR 0019](../../governance/decisions/0019-icon-catalog.md)), web Button updated; Figma alignment
and the native Buttons pending.**

## Repo evolution

**One repository for all platforms.** Plain npm workspaces since Phase 4; no other monorepo
tooling.

| Stage                | Structure                                                                                                                                                                                                                             | Trigger                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Phases 0–3           | Single package; `src/tokens/`, `src/components/`, …; generated outputs and `design/contracts/` additive                                                                                                                               | — (done)                                                 |
| Workspaces (Phase 4) | Plain **npm workspaces** — `packages/tokens` (`@pds/tokens`), `packages/react` (`@pds/react`), `packages/react-native` (reserved), `design/` source; `Package.swift` + `platforms/ios` (`PDSTokens`), `platforms/android` (`:tokens`) | Approved 2026-10-12, ahead of the RN trigger (**today**) |
| Native (Phase 5+)    | `PDSUI` target, `com.pds.compose` module, `@pds/react-native` components                                                                                                                                                              | First native reference component                         |
| Split repos          | Not planned                                                                                                                                                                                                                           | Only if independent native teams/cadences appear         |

Target layout:

```
/
├─ design/            tokens/ · contracts/ · fonts/ · icons/   (platform-neutral, no code)
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
- Build refactored: resolve → `packages/tokens/build/ir/<brand>.json` IR → guardrails (keyed by
  token path, plus a new shared-must-not-alias-web scope check) → web emitter.
- **Exit met:** web CSS/JS byte-identical; design-audit report unchanged; `tokens:build`,
  `typecheck`, `lint`, `build`, `build-storybook`, `design:audit`, `design:audit:test` green.
- Moved to Phase 2: text-scaling anchors per typography role (`platform/native/`), because
  the role → Dynamic Type mapping needs design review.
- Details: [token-portability.md](./token-portability.md#phase-1-source-changes-implemented).

### Phase 2 — Native token outputs ✅ (implemented 2026-10-12, ADR 0016)

- Text-scaling anchors per typography role (`platform/native/semantic/text-scaling.json`) and
  provisional Android elevation (`platform/native/semantic/elevation.json`).
- Font asset catalog (`design/fonts/fonts.json` + schema); per-brand manifests derived
  into the IR. Metadata only — no font files.
- Emitters over the IR: React Native TS, Swift (`PDSTokens`), Kotlin (`com.pds.tokens`) —
  semantic + component-scoped only, both brands. Output in `packages/tokens/build/`.
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
  own spinners' `action.*.on-color`). All resolved in Phase 5 (ADR 0018).
- **Not done in Phase 3:** converting the other components' prose "Cross-platform contract"
  sections (Checkbox, Radio, Radio Group, Switch, …) — incremental, via the skill.

### Phase 4 — Workspaces ✅ (implemented 2026-10-12, ADR 0017)

- Plain npm workspaces: `@pds/tokens` (build pipeline + generated web / RN outputs),
  `@pds/react` (today's components, patterns, examples, Storybook), `@pds/react-native`
  (reserved; re-exports the RN token themes). Root scripts keep their names and delegate.
- Token source → `design/tokens/`, font catalog → `design/fonts/`. Contracts unchanged.
- Root `Package.swift` (`PDSTokens`) and `platforms/android` Gradle build (`:tokens`,
  Kotlin/JVM). The generated Swift / Kotlin are now **committed sources** in `platforms/`,
  checked by `tokens:test` and a CI diff check. `PDSUI` and `com.pds.compose` reserved.
- CI: `swift build` and `gradle -p platforms/android build` replace the raw `swiftc` /
  `kotlinc` checks; Chromatic runs in `packages/react`.
- **Exit:** `@pds/react`'s public API and CSS entry unchanged ✅ (`dist/` JS/CJS/types
  byte-identical; `index.css` differs only in esbuild path comments); web token CSS/JS
  byte-identical ✅; Storybook builds (143 stories) ✅; ADR 0017 supersedes 0001's structure ✅.
  `swift build` and the Gradle build are new and run for the first time in CI.
- **Before Phase 5:** pick iOS/macOS deployment targets (`PDSUI`), Android Gradle plugin /
  compileSdk / minSdk / Compose versions and a Gradle wrapper (`com.pds.compose`), the React
  Native version + peer range and a preview/test harness (`@pds/react-native`); icon catalog
  manifest (carried from Phase 2); the Button implementation gaps and Phase 5 questions in
  its contract. **All decided in Phase 5 — ADR 0018 / 0019.**

### Phase 5 — Reference implementations (in progress)

**Done (2026-10-12):**

- Decisions — platform versions and the Button contract questions
  ([ADR 0018](../../governance/decisions/0018-cross-platform-button.md)).
- Tokens: `color.action.danger.disabled`, `motion.spinner` (+ Core `motion.duration.loop`,
  `motion.easing.linear`) — additive; existing web CSS/JS values unchanged.
- Icon catalog `design/icons/icons.json` + `npm run icons:test`
  ([ADR 0019](../../governance/decisions/0019-icon-catalog.md)).
- Button contract: questions resolved, both web gaps closed, `sizing.height: minimum`.
- Web Button: loading keeps variant colors / stays focusable / busy / blocks activation;
  disabled wins; new disabled rule; minimum height; spinner on `motion.spinner`.

**Pending:**

- Button, one pull request per platform, in this order:
  - **React Native** (`@pds/react-native`): `PDSThemeProvider` + `Button` (`children: string`,
    `variant`, `size`, `disabled`, `loading`, `leadingIcon`/`trailingIcon: IconName`, `onPress`,
    `loadingAccessibilityLabel`); `Pressable`, `hitSlop` 6/2/0 (iOS) · 8/4/0 (Android), busy +
    disabled accessibility state; Jest + React Native Testing Library; Expo example app.
  - **SwiftUI** (`PDSUI`): `DSButton` + `DSButtonStyle`, `.dsTheme(_:)`, disabled via
    `.disabled`, localized "Loading" value, hit area expanded without layout change; Swift
    Testing on a color resolver, `#Preview` grid; macOS CI job.
  - **Compose** (`com.pds.compose`): `DsButton` + `PdsTheme`, `clickable(role = Button,
indication = null)`, `stateDescription` while loading, built-in 48dp touch expansion, drawn
    focus ring; Robolectric + compose-ui-test, `@Preview` grid; Gradle wrapper, Android SDK in CI.
  - Native icon generators (SwiftUI shapes, Compose `ImageVector`s from `lucide-static`)
    land with their platform.
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
