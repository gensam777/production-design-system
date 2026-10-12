# 0019: Platform-neutral icon catalog

- **Status**: Accepted — catalog and web checks implemented 2026-10-12; native artwork
  generators arrive with the first native components (Phase 5).
- **Date**: 2026-10-12
- **Related**: [0010](./0010-icon-token-architecture.md) (provider-neutral catalog, px sizes),
  [0013](./0013-cross-platform-architecture.md), [0018](./0018-cross-platform-button.md)

## Context

ADR 0010 made `IconName` (a TypeScript union) and a Lucide provider map the icon contract —
web-only. Button's contract types its icon slots as "a name from the shared icon catalog",
and React Native, SwiftUI and Compose need the same names and the same artwork without
committing icon files.

## Decision

1. **`design/icons/icons.json` is the catalog** (schema `icons.schema.json`): DS name →
   Lucide name + description, plus a provider block — `lucide`, the **exact** version, licence
   (ISC), viewBox 24, stroke 2, round caps and joins. Names stay DS names (`close`, not `x`),
   per ADR 0010.
2. **Lucide stays the artwork source on every platform**, pinned to that one version:
   - Web: `lucide-react` through `providers/lucide.ts` (unchanged).
   - React Native: `lucide-react-native` + `react-native-svg` (peer).
   - iOS / Android: SwiftUI shapes and Compose `ImageVector`s **generated as code** from
     `lucide-static` SVG paths, committed like the generated token sources, with the Lucide
     licence notice. No SF Symbols / Material Symbols fallback — different artwork would
     break "same icon everywhere".
3. **Name types per platform:** web/RN `IconName` (kebab strings); Swift `DSIcon` and Kotlin
   `DsIcon` enums whose raw value / id is the catalog name.
4. **Stroke scales with icon size**, as `lucide-react` does by default (2 at 24 → 1.33 at 16).
5. **Checks** — `npm run icons:test` (CI): schema; web `IconName` = catalog names; the Lucide
   map uses each name's Lucide component; every Lucide name exists in the installed
   `lucide-react`, whose version must equal `provider.version`. Native generators add
   "generated sources are current" checks when they land.

## Consequences

- The web `IconName` union stays hand-written (no generated web source); the test keeps it
  equal to the catalog.
- Adding an icon is one catalog entry plus each platform's mapping (the tests name what's
  missing). Upgrading Lucide is one coordinated bump across every platform package.
- RTL mirroring of directional icons is not modelled yet — add a catalog field when a
  component needs it.
