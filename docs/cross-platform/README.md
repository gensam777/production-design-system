# Cross-platform architecture

Status: **Phase 5 — reference implementations in progress.** Components exist on web (React +
TypeScript + CSS, `@pds/react`) and, for Button, on React Native (`@pds/react-native`, with the
Expo preview app `@pds/react-native-example`). The repo is a set of plain npm workspaces
(`@pds/tokens`, `@pds/react`, `@pds/react-native`, `@pds/react-native-example`) with
platform-neutral source in `design/` and native
packages in `platforms/` (ADR [0017](../../governance/decisions/0017-workspace-structure.md)).
The token build emits React Native, Swift (`PDSTokens`, a Swift package at the repo root) and
Kotlin (`com.pds.tokens`, a Gradle module) token outputs for both brands, and Button has a
validated cross-platform contract (`design/contracts/components/button.contract.yaml`);
there's no SwiftUI or Compose UI code yet. Decisions: [ADR 0013](../../governance/decisions/0013-cross-platform-architecture.md)
(architecture), [ADR 0014](../../governance/decisions/0014-token-source-portability.md)
(token source), [ADR 0016](../../governance/decisions/0016-native-token-mappings.md) (native
token mappings), [ADR 0015](../../governance/decisions/0015-component-contracts.md) (contracts).

## Target platforms

| Platform               | Implementation                                                                          | Package / module                    |
| ---------------------- | --------------------------------------------------------------------------------------- | ----------------------------------- |
| Web / web app          | React + TypeScript + CSS (exists)                                                       | `@pds/react` (`packages/react`)     |
| Mobile app, tablet app | Delivered by one of the three native stacks below — a form factor, not a separate stack | —                                   |
| React Native           | React Native components (Button alpha; preview: `@pds/react-native-example`)            | `@pds/react-native`                 |
| iOS / iPadOS           | SwiftUI (planned)                                                                       | `PDSUI`, `PDSTokens`                |
| Android                | Jetpack Compose (planned)                                                               | `com.pds.compose`, `com.pds.tokens` |

Tokens for every platform come from one source (`design/tokens/`), built by `@pds/tokens`:
`@pds/tokens` CSS/JS and React Native themes, `PDSTokens` (`platforms/ios`),
`com.pds.tokens` (`platforms/android`).

## The principle

**Share semantic intent, behavior contracts and tokens. Never share implementation.**

- React components are not converted to Swift or Kotlin.
- DOM props (`className`, `href`, `aria-*`, `...rest`, HTML attribute types) never cross
  platforms.
- Every platform keeps its native elements, interaction model and accessibility APIs.

## Documents

| Doc                                                | Covers                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [platform-boundaries.md](./platform-boundaries.md) | What is shared vs. platform-specific — components, patterns, layout, icons          |
| [token-portability.md](./token-portability.md)     | Token portability rules, per-platform transforms, typography mapping, output shapes |
| [component-contracts.md](./component-contracts.md) | Contract rules, field reference, validation, Button contract                        |
| [multi-brand.md](./multi-brand.md)                 | How Brand A / Brand B propagate to every platform                                   |
| [accessibility.md](./accessibility.md)             | Shared accessibility principles and per-platform equivalents                        |
| [migration.md](./migration.md)                     | Repo evolution plan and migration phases 0–7                                        |

## Approved decisions (2026-10-11)

- `@pds/*` for JS/TS packages; `PDSUI` / `PDSTokens` for Swift; `com.pds.*` for Kotlin.
- YAML + JSON Schema for component contracts.
- All platforms in this one repository.
- Lucide is the default shared icon artwork.
- All brands ship on every platform; brand selection is runtime.
- Button is the first cross-platform reference component (Switch second).
