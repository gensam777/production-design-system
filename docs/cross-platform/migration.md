# Repo evolution and migration phases

Decision record: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md).
**Current phase: 1 complete (portable token source + IR build); Phase 2 not started.**

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

### Phase 2 — Native token outputs

- Text-scaling anchors per typography role (`platform/native/`, design review first).
- Emitters over the IR: React Native TS, Swift (`PDSTokens`), Kotlin (`com.pds.tokens`) — semantic +
  component-scoped only, every brand.
- Icon catalog → platform-neutral manifest generating TS / Swift / Kotlin name types.
- Font asset manifests per brand.
- Snapshot tests of generated files; IR parity check in design-audit; compile-check generated
  Swift / Kotlin in CI.
- **Exit:** both brands emitted for all four targets; CI green.

### Phase 3 — Contracts

- `design/contracts/schema.json` + `button.contract.yaml`.
- component-production skill writes / updates contracts; existing prose "Cross-platform
  contract" sections converted incrementally.
- **Exit:** Button contract validates and matches Figma axes and React token usage.

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
