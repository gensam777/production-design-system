# @pds/react-native (reserved)

React Native components implementing the shared contracts in
[`design/contracts/`](../../design/contracts/) — Phase 5 (ADR
[0013](../../governance/decisions/0013-cross-platform-architecture.md),
[0017](../../governance/decisions/0017-workspace-structure.md)).

Today it only re-exports the generated, brand-aware React Native token themes
(`brandA`, `brandB`, `Theme`, …) from `@pds/tokens/react-native`, so the workspace wiring is
type-checked (`npm run typecheck`, after `npm run tokens:build`). No components, and no
`react` / `react-native` peer dependencies yet — those come with the first component.
Never import `@pds/react` (DOM components) or web CSS here.
