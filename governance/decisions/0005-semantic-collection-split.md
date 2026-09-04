# 0005: Semantic collection split — concern-specific Figma collections

- **Status**: Accepted
- **Date**: 2026-09-04

## Context

Color, typography (partially — see 0003), and spacing semantics all lived in a single
`Semantic` Figma Variable collection with one mode each (`Light`). This worked while
every semantic system shared the same mode lifecycle, but it doesn't scale: color will
eventually need `Light`/`Dark`/brand modes, spacing may want `Default`/`Compact`/
`Spacious`, and radius (0006) may want `Default`/`Sharp`/`Soft` — all on different
timelines. A single `Semantic` collection forces every variable in it to share the same
mode set, so adding a mode for one concern (e.g. Dark for color) would add an unwanted,
unused mode to every other concern's variables too.

## Decision

- **Split the single `Semantic` collection into one collection per concern**:
  `Semantic Color` (renamed from the original `Semantic`, 51 variables, `Light` mode
  preserved), `Semantic Space` (new, 24 variables, `Default` mode), and `Semantic Radius`
  (new, created alongside 0006, `Default` mode — `Sharp`/`Soft` documented as future
  modes, not created yet).
- **`Primitive` stays a single shared collection** across `color/*`, `font/*`, `space/*`,
  `radius/*` — primitives don't need independent mode lifecycles the way semantics do;
  they're raw scales, not role-based systems that evolve per-concern.
- **Variable names inside each split collection dropped their category prefix**
  (`color/surface/canvas` → `surface/canvas`, `space/inset/md` → `inset/md`) — the prefix
  was needed when everything shared one `Semantic` collection (for scalable organization
  within it); it's redundant once the collection name itself carries the category.
  Primitive names keep their category prefix (`color/gray/500`, `space/md`) since that
  collection still holds multiple categories together.
- **No native Figma "move variable to another collection" API exists**
  (`Variable.variableCollectionId` is read-only) — the split was executed as
  recreate-in-new-collection + repoint-live-bindings + delete-original, not a move. For
  color, no recreation was needed (the original `Semantic` collection was renamed in
  place, keeping all 51 variables' IDs/values/aliases/scopes untouched — a pure rename).
  For space, all 24 variables got new IDs; every one of the 45 live node bindings in the
  "Spacing Specimen — V1" frame was explicitly repointed to the new variables (verified
  zero stale bindings) before the 24 originals were deleted.

## Consequences

- **Code required zero restructuring for this split.** `src/tokens/semantic/color.json`
  and `src/tokens/semantic/spacing.json` were already separate files per foundation —
  code never had a single monolithic "Semantic" token tree to begin with. Token path
  naming (`color.surface.canvas`, `space.inset.md`) is unaffected; the Figma-side split
  just brings Figma's structure in line with what code already had. This was confirmed
  by direct audit when 0006 (Radius) was mirrored into code.
- Two docs needed correction after this decision: `docs/foundations/color.md` and
  `docs/foundations/spacing.md`'s "Figma Variables" sections still described the old
  single `Semantic` collection and (for spacing) the old `space/`-prefixed names.
  Corrected alongside this ADR.
- Any future foundation needing its own semantic mode lifecycle (dark mode for color,
  compact/spacious for spacing, sharp/soft for radius) now has a dedicated collection to
  add modes to, without touching any other concern's variables.
- `figma.variables.getLocalVariableCollectionsAsync()` calls anywhere in future Figma
  scripting must look up collections by their new names (`Semantic Color`,
  `Semantic Space`, `Semantic Radius`), not `Semantic`.
