# Production Design System

A production-style React design system — tokens, components, and Storybook
documentation — built as a reusable template for future app projects.

## Status

Early scaffold. No components yet. See `governance/decisions/0001-single-package-structure.md`
for the current architectural decisions and what's deliberately deferred.

## Structure

One repository, plain npm workspaces (ADR 0013, 0017):

- `design/` — platform-neutral source: `tokens/` (core, brands, semantic, platform tiers),
  `fonts/` (font asset catalog), `contracts/` (cross-platform component contracts)
- `packages/tokens/` — `@pds/tokens`: token build pipeline and generated web / React Native
  outputs (`build/`, gitignored)
- `packages/react/` — `@pds/react`: React components, patterns, examples and Storybook
- `packages/react-native/` — `@pds/react-native`: React Native components (Button) and `PDSThemeProvider`
- `packages/react-native-example/` — Expo preview app for `@pds/react-native` (not a library)
- `platforms/ios/` + `Package.swift` — Swift package (`PDSTokens`; `PDSUI` reserved)
- `platforms/android/` — Gradle build (`com.pds.tokens`; `com.pds.compose` reserved)
- `docs/` — `design-to-code-mappings.md`, foundations, patterns, cross-platform docs
- `governance/` — accessibility, component lifecycle, and versioning rules, plus
  architecture decision records in `decisions/`
- `scripts/` — repo tooling: token-usage guardrail, contract validator, design audit
- `.claude/skills/` — custom Claude Code skills

## Getting started

```bash
npm install
npm run storybook       # start Storybook
npm run build           # build the library
npm run tokens:build    # regenerate token output from design/tokens source
npm run typecheck
npm run lint
```

## Source of truth

| Concern | Source of truth |
| --- | --- |
| Design intent | Figma |
| Shipped token values | `design/tokens/` |
| Component behavior/API | React (`packages/react/src/components/`) |
| Component documentation | Storybook |
| Figma ↔ component mapping | `docs/design-to-code-mappings.md` (manual) |

See `CLAUDE.md` for more detail and conventions.

CI and Chromatic are enabled for this project.