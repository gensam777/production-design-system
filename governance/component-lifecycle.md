# Component Lifecycle

Every component moves through these stages. The stage is tracked in the component's
Storybook doc page (once components exist) and should be obvious from the PR description.

## Stages

1. **Proposed** — a need has been identified (design or engineering). No code yet.
   Documented as a short proposal (problem, why existing components don't cover it).
2. **Alpha** — implemented behind clear "unstable" labeling. API and visual design may
   still change. Usable in real apps only with the understanding that breaking changes
   can land without a major version bump.
3. **Stable** — API is considered settled. Meets the full checklist in
   [accessibility.md](./accessibility.md). Breaking changes now require a major version
   bump per [versioning.md](./versioning.md).
4. **Deprecated** — still works, but a replacement exists and migration is documented.
   Deprecation is announced at least one minor version before removal.

## Promotion criteria (Alpha → Stable)

- Accessibility checklist passed and manually verified.
- Design-to-code mapping recorded in `docs/design-to-code-mappings.md`.
- No known open issues that would require a breaking API change.
- Reviewed by at least one other maintainer.

## Removal

Deprecated components are removed only in a major version, and only after the documented
migration window has passed.
