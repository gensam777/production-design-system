# @pds/tokens

The token build pipeline (ADR [0014](../../governance/decisions/0014-token-source-portability.md),
[0016](../../governance/decisions/0016-native-token-mappings.md),
[0017](../../governance/decisions/0017-workspace-structure.md)): reads
[`design/tokens/`](../../design/tokens/) and [`design/fonts/fonts.json`](../../design/fonts/fonts.json),
resolves every brand into an IR, runs the guardrails, and emits every platform.

| Output                  | Location                                                   | Committed? | Consumed as                             |
| ----------------------- | ---------------------------------------------------------- | ---------- | --------------------------------------- |
| IR per brand            | `build/ir/<brand>.json`                                    | no         | `@pds/tokens/ir/*`, contracts validator |
| Web CSS / JS            | `build/css/**`, `build/js/*`                               | no         | `@pds/tokens/css/*`, `@pds/tokens/js/*` |
| React Native TS         | `build/react-native/index.ts`                              | no         | `@pds/tokens/react-native`              |
| Swift `PDSTokens`       | `platforms/ios/Sources/PDSTokens/`                         | **yes**    | root `Package.swift`                    |
| Kotlin `com.pds.tokens` | `platforms/android/tokens/src/main/kotlin/com/pds/tokens/` | **yes**    | Gradle `:tokens`                        |

From the repo root: `npm run tokens:build`, `npm run tokens:test`, `npm run tokens:test:update`
(after a reviewed output change). Never edit generated files by hand.
