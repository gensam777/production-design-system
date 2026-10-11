# 0013: Cross-platform design-system architecture

- **Status**: Accepted. Phase 0 (docs) 2026-10-11; Phase 1 (portable token source) 2026-10-11;
  Phase 2 (native token outputs, [0016](./0016-native-token-mappings.md)) 2026-10-12. No native
  UI code yet.
- **Date**: 2026-10-11
- **Supersedes in part**: 0001 (single package, no monorepo tooling) — the single package
  stays until the trigger in [Repo evolution](#repo-evolution) is met; this ADR defines what
  replaces it and when. 0001's other decisions (no Code Connect, manual mappings) stand.
- **Related**: [0014 token portability](./0014-token-source-portability.md),
  [0015 component contracts](./0015-component-contracts.md),
  [0011 multi-brand](./0011-multi-brand-token-architecture.md),
  [0010 icons](./0010-icon-token-architecture.md),
  [`docs/cross-platform/`](../../docs/cross-platform/README.md)

## Context

The system is web-first: React + TypeScript + CSS, Storybook/Chromatic, Figma Variables, a
Core → Brand → Semantic token architecture with Brand A / Brand B, 19 components, 6 patterns,
product examples, the design-audit tool and five Claude skills. It must grow to serve:
web / web app, mobile app, tablet app, React Native, iOS (SwiftUI) and Android (Jetpack
Compose).

A readiness audit (2026-10-11) found:

- **Semantic intent ports well.** Token names and layering, the brand contract and its
  guardrails, the provider-neutral `IconName` catalog, and the per-component "Cross-platform
  contract" prose in `docs/design-to-code-mappings.md` are already platform-neutral.
- **Value encoding does not.** Several token sources are authored in CSS syntax (rem font
  sizes, em letter-spacing, `rgba()` overlays, a CSS font-family fallback stack, a `9999`
  radius trick), web-only concepts (`viewport.*`, `layout.container.maxWidth`) sit in the
  shared tiers, and the build couples resolution to CSS (contrast pairs keyed by CSS
  custom-property names). See ADR 0014.
- **Component APIs are DOM APIs.** Every component extends `*HTMLAttributes`, forwards a DOM
  ref, spreads `...rest`, and takes `ReactNode` slots. That is correct for React and must not
  leak into other platforms. See ADR 0015.

## Decision

### Core principle

**Share semantic intent, behavior contracts and tokens. Never share implementation.**
React components are not converted to Swift or Kotlin; DOM props never cross platforms.
Each platform implements a shared contract with its own native elements, interaction model
and accessibility APIs.

### Approved decisions

| Decision                  | Choice                                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| JS/TS package names       | `@pds/*` — `@pds/tokens`, `@pds/react`, `@pds/react-native`                                                                                 |
| Swift modules             | `PDSTokens` (generated tokens), `PDSUI` (SwiftUI components)                                                                                |
| Kotlin packages           | `com.pds.*` — `com.pds.tokens`, `com.pds.compose`                                                                                           |
| Component contracts       | YAML files validated by a JSON Schema (ADR 0015)                                                                                            |
| Repository                | **One repo for all platforms** — tokens, contracts and every implementation version and get guarded together                                |
| Icon artwork              | **Lucide** is the default shared artwork on every platform; providers stay swappable per platform behind the shared `IconName` catalog      |
| Brand delivery            | **Ship all brands; runtime brand selection** on every platform (a single-brand app may still pin one brand at build time and drop the rest) |
| First reference component | **Button** (Switch second)                                                                                                                  |

### What is shared vs. platform-specific

| Shared (platform-neutral source)                                             | Platform-owned                                                                    |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Semantic token names, values, brand contract, guardrails (contrast etc.)     | Units, value transforms, theme injection mechanism                                |
| Component names, enums, defaults, typed slots, semantic events               | Native element/view, event idiom, prop-naming idiom, platform-only props          |
| State model and behavior rules (loading, error priority, activation)         | Hover / pressed / focus visuals, ripple, haptics                                  |
| Accessibility **outcomes** (name, role, state, contrast, target-size policy) | Accessibility APIs, focus model, keyboard handling, minimum target values         |
| Icon catalog names and sizes                                                 | Icon asset format and provider binding                                            |
| Pattern intent and rules                                                     | Layout primitives, navigation, adaptive strategy, breakpoints / size classes      |
| Content and usage guidance                                                   | `className`, `href`, `aria-*`, `keyboardType`, `textContentType`, `hitSlop`, etc. |

Full breakdown per component, pattern, layout concept and icon:
[`docs/cross-platform/platform-boundaries.md`](../../docs/cross-platform/platform-boundaries.md).

**Rule:** a property enters a shared contract only if it means the same thing on all four
platforms (web, React Native, SwiftUI, Compose).

### Naming

| Thing                                  | Web CSS                    | Web / RN TS                        | Swift                        | Kotlin                       |
| -------------------------------------- | -------------------------- | ---------------------------------- | ---------------------------- | ---------------------------- |
| Token `color.text.link-hover`          | `--color-text-link-hover`  | `theme.color.text.linkHover`       | `theme.color.text.linkHover` | `theme.color.text.linkHover` |
| Typography role `text.body.md.regular` | `--text-body-md-regular-*` | `theme.typography.body.md.regular` | same                         | same                         |
| Numeric-leading step (`2xl`, `3xs`)    | `--space-stack-2xl`        | `xl2`, `xs3`                       | `xl2`, `xs3`                 | `xl2`, `xs3`                 |
| Enum value                             | `'primary'`                | `'primary'`                        | `.primary`                   | `ButtonVariant.Primary`      |
| Component                              | `Button`                   | `Button` (module-scoped)           | `DSButton`                   | `DsButton`                   |
| Activation event                       | `onClick`                  | `onPress`                          | `action:`                    | `onClick`                    |
| Theme type                             | — (CSS custom properties)  | `Theme`                            | `DSTheme`                    | `DsTheme`                    |

Swift and Kotlin components are **prefixed** because SwiftUI already ships `Button`,
`Toggle`, `Divider`, `Link`, `Picker` and Compose ships `Button`, `Checkbox`, `Switch`,
`Card`, `Divider`. Prefixes follow each language's acronym idiom (`DS` in Swift, `Ds` in
Kotlin). Native typography lives under `typography` (not `text`) so it never reads as
`color.text`.

Known web debt, deliberately **not** changed here: CSS custom properties are unprefixed
(`--color-…`). A move to `--ds-` / `--pds-` is breaking and needs its own ADR.

### Repo evolution

Avoid monorepo tooling until a second consumable package actually exists.

- **Now (Phases 0–3):** stays a single package. New generated outputs and contract files are
  additive.
- **Trigger for workspaces:** the start of `@pds/react-native` (it needs its own
  `react-native` peer-dependency set). Then — and only then — plain **npm workspaces** (no
  Nx / Turborepo / pnpm).
- **Target layout** (Phase 4+):

```
/
├─ design/                     platform-neutral source of truth — no platform code
│  ├─ tokens/{core,brands,semantic,platform/{web,native}}
│  ├─ contracts/{schema.json, components/*.contract.yaml}
│  ├─ icons/{manifest.json, svg/}
│  └─ fonts/fonts.json          (font asset catalog — not tokens; per-brand manifests derived, ADR 0016)
├─ packages/                   npm workspaces
│  ├─ tokens/        @pds/tokens        build pipeline, web CSS/JS + RN TS outputs
│  ├─ react/         @pds/react         today's src/ (components, patterns, examples, Storybook)
│  └─ react-native/  @pds/react-native
├─ platforms/
│  ├─ ios/           Sources/PDSTokens, Sources/PDSUI
│  └─ android/       com.pds.tokens, com.pds.compose (Gradle modules)
├─ Package.swift               at repo root — SwiftPM resolves git-URL packages from the root
├─ docs/  governance/  scripts/  .claude/skills/
```

Splitting native into separate repositories is revisited only if separate native teams with
independent release cadences appear.

### Migration phases

| Phase                            | Scope                                                                                                                                                                        | Exit criterion                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **0. Decide** (this ADR)         | ADRs 0013–0015, `docs/cross-platform/`                                                                                                                                       | Accepted. No code, token, Figma or structure change.                                                  |
| **1. Portable token source**     | Apply ADR 0014's source rules; refactor the build into resolve + guard → resolved IR → per-platform emit; contrast keyed by token path                                       | Generated web CSS/JS **byte-identical** to before (or a reviewed diff); Storybook/Chromatic unchanged |
| **2. Native token outputs**      | RN TS, Swift (`PDSTokens`), Kotlin (`com.pds.tokens`) emitters; generated-output snapshot tests; IR parity check in design-audit; compile-check generated Swift/Kotlin in CI | Both brands emitted for all four targets; CI green                                                    |
| **3. Contracts**                 | JSON Schema + Button contract (ADR 0015); convert existing "Cross-platform contract" prose incrementally; component-production skill writes contracts                        | Button contract validates and matches Figma axes + React token usage                                  |
| **4. Workspaces**                | npm workspaces; `design/` extracted; `@pds/tokens`, `@pds/react`; `Package.swift` + Gradle scaffolding                                                                       | Web package public API unchanged for consumers                                                        |
| **5. Reference implementations** | Button in React Native, SwiftUI, Compose (previews, platform a11y audits, token parity); then Switch                                                                         | Contract checks pass on every platform                                                                |
| **6. Tooling and skills**        | Platform-port skill, native snapshot testing (swift-snapshot-testing, Paparazzi/Roborazzi, RN Storybook), per-platform accessibility checklist columns                       | —                                                                                                     |
| **7. Native patterns**           | Form validation and Settings section natively, after ≥ 3 native components exist                                                                                             | —                                                                                                     |

Phases 1–3 contain **no native component code**. Phase 1 is a refactor that can be verified
against today's generated output.

### Why Button first

Button forces every hard cross-platform question early: brandable radius
(`radius.control`), the `action.*` color families across states, label typography (Dynamic
Type / sp scaling), hover → pressed mapping on touch, the Sm 32px visual height vs. 44pt /
48dp touch targets (visual shared, hit target platform-owned), loading semantics, the
decorative icon slot (exercises the icon pipeline) and press motion. Switch follows because
it tests the opposite case — wrapping a native control instead of drawing a custom one.

## Consequences

- Every new component (component-production skill) will, from Phase 3, ship a contract file
  in addition to its React implementation. Until then the existing "Cross-platform contract"
  prose sections stay the record.
- Tokens that only make sense on the web (`viewport.*`, `layout.container.maxWidth`, CSS font
  fallbacks) move to a web platform tier in Phase 1 — they stop being part of the shared
  contract.
- Storybook stays the authoritative **web** behavior record. Native "stories" are SwiftUI
  `#Preview` / Compose `@Preview` (and optionally Storybook for React Native). Chromatic stays
  web-only.
- macOS / Android CI runners are added only when native packages exist (Phase 2 compile
  checks can run on Linux for Kotlin; Swift type-checking needs macOS or a Swift toolchain
  image).
- The design audit's Figma snapshot is already platform-neutral; its code-side readers
  (`lib/css.mjs`, `lib/jsx.mjs`) are web-only. A token-parity layer against the resolved IR is
  added in Phase 2; native component readers come later, per surface.
- Light/Dark (still deferred) must fit a Brand × ColorScheme theme shape — native theme types
  are designed with that axis from the start (ADR 0014, multi-brand rules).
