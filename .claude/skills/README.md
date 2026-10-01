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

Remaining candidates, not yet built: a standalone token-addition workflow, and an
accessibility-checklist pass runnable over an existing component PR independent of
authoring a new one.
