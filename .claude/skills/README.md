# Claude Skills

- [`component-production`](./component-production/SKILL.md) — production workflow for
  creating/updating a design-system component (Figma + React + Storybook + docs +
  governance), based on the patterns established by `Button`, `Input`, and `Checkbox`.
  Added once real component-authoring workflows existed to automate (see
  `governance/decisions/0001-single-package-structure.md`, which deferred this until
  that point).

- [`design-audit`](./design-audit/SKILL.md) — refreshes the committed Figma snapshot for the
  Figma ↔ code drift audit (runs the committed read-only extractor via the Figma MCP,
  validates + imports the snapshot, runs `npm run design:audit`) and reports PASS / DRIFT /
  KNOWN_DIFFERENCE / ERROR. Detection only — no Figma/code edits, no commits. See
  `docs/design-audit.md`.

- [`figma-screen-sync`](./figma-screen-sync/SKILL.md) — daily Figma → React workflow for
  product screens: discovers the new/updated screen on Examples / Playground, classifies
  its target platform (web, web app, responsive web, mobile app, tablet app) and
  implementation intent, audits it in
  Figma first (stops on token/instance/Brand A-B issues), proposes a reuse-first plan and
  pauses, then implements it in `src/examples/` + Storybook after approval and verifies it
  at all three parity layers. No commits.

- [`token-production`](./token-production/SKILL.md) — owns token and Figma-variable
  architecture changes (Core / Brand A-B / semantic / component-scoped; color,
  typography, spacing, radius, elevation, motion, breakpoints/layout, icon size): discovers
  the change in Figma and/or `src/tokens/`, checks the Core → Brand → Semantic → Component
  layering, reports impact (aliases, brands, consumers, generated outputs, contrast,
  breaking changes) and pauses on conflicts and before applying; then updates source (and
  Figma if approved), regenerates outputs and verifies parity. No commits.

- [`pattern-production`](./pattern-production/SKILL.md) — owns reusable compositions
  (patterns and templates in `src/patterns/` + `docs/patterns/` + `Patterns/*` stories +
  the Figma Patterns/Templates pages): requires evidence of reuse, classifies the pattern
  kind and target platform, audits Figma first, prefers composition over new APIs,
  proposes and pauses, then implements with stories, usage/do-don't/when-not-to-use docs,
  and verifies parity, both brands, responsive/adaptive states and accessibility. Hands
  off to component-production, token-production, figma-screen-sync and design-audit.
  No commits.

Remaining candidate, not yet built: an accessibility-checklist pass runnable over an
existing component PR independent of authoring a new one.
