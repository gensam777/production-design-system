# platforms/android

Gradle build for the Kotlin / Android side of the design system (ADR
[0013](../../governance/decisions/0013-cross-platform-architecture.md),
[0017](../../governance/decisions/0017-workspace-structure.md)).

| Module     | Package           | Path       | Status                                                                                                                      |
| ---------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `:tokens`  | `com.pds.tokens`  | `tokens/`  | **Generated** Kotlin (`src/main/kotlin/com/pds/tokens/`) by `npm run tokens:build` — do not edit. Plain Kotlin/JVM library. |
| `compose/` | `com.pds.compose` | `compose/` | Reserved for Jetpack Compose components (Phase 5). Not in `settings.gradle.kts` yet.                                        |

Build: `gradle -p platforms/android build` (Gradle 8.x, JDK 17). No Gradle wrapper is
committed yet — CI provides Gradle; add the wrapper with the Compose module in Phase 5.
`npm run tokens:test` fails if the committed Kotlin differs from what the build generates.
