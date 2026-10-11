# 0015: Cross-platform component contracts (YAML + JSON Schema)

- **Status**: Accepted (Phase 0 — rules only; no schema or contract files exist yet — Phase 3)
- **Date**: 2026-10-11
- **Related**: [0013 cross-platform architecture](./0013-cross-platform-architecture.md),
  [0010 icons](./0010-icon-token-architecture.md),
  [`docs/cross-platform/component-contracts.md`](../../docs/cross-platform/component-contracts.md)

## Context

Each component section in `docs/design-to-code-mappings.md` already has a prose
"Cross-platform contract (shared design intent, not yet implemented elsewhere)" subsection —
written by the component-production skill's step 12. Prose cannot be validated, diffed per
field, or checked against Figma variant axes and per-platform token usage.

The React public APIs are DOM APIs (`*HTMLAttributes` extension, DOM refs, `...rest`,
`className`, `aria-*`, `ReactNode` slots, `href`). They are correct for React and must not
become the shared API.

## Decision

### Format and location

- One **YAML** file per component, validated by a **JSON Schema**. YAML because native
  engineers and designers must read and edit it; a TypeScript contract would tie the shared
  layer to JS.
- Location: `design/contracts/components/<component>.contract.yaml`, schema at
  `design/contracts/schema.json` (created in Phase 3; `design/` is additive and does not move
  existing folders — that happens in Phase 4).
- File names are kebab-case (`password-input.contract.yaml`); the `component` field is
  PascalCase (`PasswordInput`), which is the shared, unprefixed name.

### What a contract contains

`component`, per-platform `status`, `anatomy`, `properties` (enums / booleans with defaults
and behavior rules), `slots` (typed), `events` (semantic), `states` (shared vs.
platform-owned), `accessibility` (outcomes), `tokens` (semantic token path per part × state),
`sizing` (visual sizes shared, hit targets platform-owned), `platform-notes`,
`intentional-differences`. Full field reference and a Button example:
[`docs/cross-platform/component-contracts.md`](../../docs/cross-platform/component-contracts.md).

### Rules

1. **Same meaning on all four platforms** or it does not go in the contract. Platform-only
   props (`className`, `href`, `type="submit"`, `keyboardType`, `hitSlop`, …) go in
   `platform-notes`.
2. **Semantic names, not idioms.** Events are named by intent (`activate`, `change`,
   `dismiss`); each platform maps them to its idiom (`onClick`, `onPress`, `action:`).
3. **Slots are typed, not `ReactNode`:** `text`, `icon` (an `IconName`, decorative unless
   stated), `action` (one interactive control with its own accessible name), `content`
   (free composition — Card body). How a platform accepts the slot is its own choice; React
   keeps `ReactNode` per ADR 0010.
4. **Hover, pressed and focus visuals are platform-owned.** The contract may name the
   _token_ for each, but never require a visual state a platform doesn't have (touch has no
   hover).
5. **Accessibility is stated as outcomes** (role, name source, states exposed, announcements),
   never as an API (`aria-busy`, `accessibilityState`).
6. **Tokens are semantic paths only.** A contract never references Core or `brand.*`.
7. **Visual size is shared, hit target is platform-owned** (web ≥ 24×24 CSS px, iOS ≥ 44×44
   pt, Android ≥ 48×48 dp), and expanding the hit target never changes the visual size.
8. **Contracts are not code generators.** They drive documentation, validation (Figma axes vs.
   enums, platform token bindings vs. `tokens:`), and review — not generated components.
9. **Divergence is explicit.** Any intentional platform difference is listed with a reason;
   an undocumented difference is drift.
10. **The contract and the React implementation must agree.** Storybook remains the
    authoritative record of web behavior; if contract and story disagree, the conflict is
    resolved in review, not left.

### Lifecycle

A contract carries a per-platform `status` (`planned`, `alpha`, `beta`, `stable`,
`not-applicable`) using `governance/component-lifecycle.md` definitions. `not-applicable` is
valid and required for web-only components (e.g. `ButtonLink`) and for components that are
deliberately not ported to a platform (e.g. `Tooltip` on phone platforms).

## Consequences

- From Phase 3 the component-production skill writes or updates the contract; the prose
  "Cross-platform contract" sections are converted incrementally and then link to the YAML.
- `docs/design-to-code-mappings.md` stays the Figma ↔ React record; the contract becomes the
  cross-platform record.
- The design audit gains contract-driven checks (Figma axes vs. enums, token bindings) as a
  later extension — not part of Phase 3's exit criterion beyond Button.
