# 0017: npm workspaces, `design/` source and native package scaffolding

- **Status**: Accepted — implemented 2026-10-12 (Phase 4 of
  [0013](./0013-cross-platform-architecture.md))
- **Date**: 2026-10-12
- **Supersedes**: [0001](./0001-single-package-structure.md) for the package structure (its
  Code Connect and manual-mapping decisions still stand).
- **Related**: [0013](./0013-cross-platform-architecture.md),
  [0014](./0014-token-source-portability.md), [0015](./0015-component-contracts.md),
  [0016](./0016-native-token-mappings.md), [`docs/cross-platform/migration.md`](../../docs/cross-platform/migration.md)

## Context

Phases 1–3 made the token source portable, emitted native token outputs and added component
contracts, all inside one npm package. Phase 5 (Button on React Native, SwiftUI and Compose)
needs somewhere for those implementations to live and a way for them to consume the
generated tokens. ADR 0013 fixed the target layout and the tooling (plain npm workspaces,
nothing else). Phase 4 was approved explicitly before its original trigger (the start of
`@pds/react-native`) so Phase 5 can start on a stable structure.

## Decision

### Layout

```
design/                  platform-neutral source — no platform code
  tokens/                core/, brands/<brand>/, semantic/, platform/{web,native}/  (was src/tokens/)
  fonts/                 fonts.json + fonts.schema.json                              (was src/tokens/fonts/)
  contracts/             schema.json + components/*.contract.yaml                    (unchanged)
packages/                npm workspaces (all `private` — publishing is still deferred)
  tokens/   @pds/tokens        scripts/ (build pipeline, was scripts/build-tokens.mjs + scripts/tokens/),
                               style-dictionary.config.mjs, __tests__/, build/ (generated, gitignored)
  react/    @pds/react         src/, .storybook/, tsup.config.ts, tsconfig.json (was the repo root package)
  react-native/ @pds/react-native   reserved: re-exports @pds/tokens/react-native only
platforms/
  ios/Sources/PDSTokens/       generated Swift, committed; Sources/PDSUI/ reserved
  android/                     Gradle build: tokens/ (com.pds.tokens, generated Kotlin, committed);
                               compose/ reserved
Package.swift                  repo root (SwiftPM resolves git-URL packages from the root)
scripts/                       repo tooling that spans packages: contracts/, design-audit/,
                               check-token-usage.mjs
```

### Rules

1. **Plain npm workspaces only** — no Nx, Turborepo, pnpm or Lerna. The root package is a
   private workspace root; its scripts (`build`, `typecheck`, `tokens:*`, `storybook`, …) keep
   their names and delegate with `-w`, so every documented command still works from the root.
2. **Workspaces depend on each other by name** (`@pds/tokens`), never by relative path.
   `@pds/tokens` exposes its generated outputs through `exports`: `./css/*`, `./js/*`,
   `./react-native`, `./ir/*`.
3. **`@pds/react`'s consumer surface is unchanged**: same `exports` (`.` and `./index.css`),
   same runtime dependencies and peer dependencies, same `dist/` files. `@pds/tokens` is a
   devDependency that tsup bundles (`noExternal`), so `dist/index.css` still carries every token
   custom property for both brands. The package name becomes `@pds/react` (ADR 0013's approved
   name; the old root name `production-design-system` was never published).
4. **Generated Swift and Kotlin token sources are committed** under `platforms/` and written
   there directly by `npm run tokens:build`: SwiftPM and Gradle consumers have no Node step.
   They replace the Swift/Kotlin copies in the token snapshot directory; `npm run tokens:test`
   compares them with the in-memory build, and CI fails if `tokens:build` leaves a diff in
   `platforms/`. Web CSS/JS, the IR and the React Native module stay generated and gitignored
   (`packages/tokens/build/`), with web + RN snapshots in `packages/tokens/__tests__/__snapshots__/`.
5. **`com.pds.tokens` is a plain Kotlin/JVM module** — the generated code is pure data with no
   Android or Compose import (ADR 0016), so any Android or Compose module can depend on it.
6. **UI modules are reserved, not scaffolded as build targets**: `PDSUI`, `com.pds.compose` and
   `@pds/react-native` components arrive in Phase 5 together with the decisions they need
   (iOS/macOS deployment targets; Android Gradle plugin, compileSdk/minSdk and Compose versions;
   React Native peer-dependency range). No Gradle wrapper yet — CI provisions Gradle.
7. **Token scripts run with repo-root-relative paths** (`packages/tokens/scripts/paths.mjs`):
   entry points `chdir` to the repo root, so they behave the same from the root and from the
   workspace.

### CI

- `validate` job: unchanged commands from the root, plus "Native token sources are committed
  and current" (`git diff --exit-code -- platforms/` after `tokens:build`).
- `swift-tokens`: `swift build` of the root `Package.swift` in `swift:6.0` (tools 6.0 → Swift 6
  language mode, as before).
- `kotlin-tokens`: `gradle -p platforms/android build` (Gradle 8.10.2 via
  `gradle/actions/setup-gradle`, JDK 17).
- Chromatic: `workingDir: packages/react`.

## Consequences

- Web output is unchanged: token CSS/JS and the IR are byte-identical; `dist/` JS, CJS and
  type declarations are byte-identical; `dist/index.css` differs only in esbuild's per-file
  path comments (`/* ../tokens/build/css/variables.css */`). Generated native files changed
  only in their header comments (new emitter and source paths).
- Two token `$description`s in `design/tokens/core/color.json` still say
  `src/tokens/brands/…`. They are emitted into web CSS/JS comments, so fixing them is a web
  output change — left for a reviewed token change.
- `npm run typecheck` in `@pds/react-native` needs `npm run tokens:build` first (it type-checks
  the generated RN module through the workspace link). CI already builds tokens first.
- The Gradle build and `swift build` of the package run only in CI (no local toolchains are
  assumed).
- Paths in docs, skills and ADRs 0002–0016 were updated to the new locations so links keep
  working; ADR 0001's text is left historical.
