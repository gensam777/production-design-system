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

Remaining candidates, not yet built: a standalone token-addition workflow, and an
accessibility-checklist pass runnable over an existing component PR independent of
authoring a new one.
