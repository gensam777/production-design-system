# Repo evolution and migration phases

Decision record: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md).
**Current phase: 0 (complete when ADRs 0013–0015 are accepted).**

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

### Phase 0 — Decide ✅ (this change)

ADRs 0013 / 0014 / 0015 and `docs/cross-platform/`. No token, code, Figma or structure
change.

### Phase 1 — Portable token source

- Apply ADR 0014 source rules: px font sizes, structured letter-spacing, hex-alpha overlays,
  single brand family name, web platform tier for viewport / layout / font fallbacks.
- Refactor `scripts/build-tokens.mjs`: resolve + guard → `resolved/<brand>.json` IR →
  emitters. Contrast pairs keyed by token path.
- Add text-scaling anchors per typography role (`platform/native/`).
- **Exit:** web CSS/JS output byte-identical (or reviewed diff); Storybook and Chromatic
  unchanged; `npm run lint`, `typecheck`, `design:audit` green.
- Owner skill: token-production.

### Phase 2 — Native token outputs

- Emitters: React Native TS, Swift (`PDSTokens`), Kotlin (`com.pds.tokens`) — semantic +
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
