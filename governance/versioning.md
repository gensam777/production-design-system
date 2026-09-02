# Versioning Policy

This package follows [Semantic Versioning](https://semver.org/).

## What counts as breaking

Because this is a design system, "breaking" is broader than a changed function signature:

- Removing or renaming a component, prop, or exported token.
- A visual change significant enough to alter layout or meaning in consuming apps
  (e.g. changed spacing scale, renamed/removed token, changed default size).
- Changing a component's DOM structure or semantics in a way that could break consumer
  styling overrides or accessibility behavior.

Non-breaking:

- New components, new optional props, new tokens.
- Bug fixes that bring behavior in line with documented behavior.
- Visual refinements within a component still in **Alpha** (see
  [component-lifecycle.md](./component-lifecycle.md)).

## Process

- Every PR that changes shipped code (components, tokens, public API) needs a changeset
  describing the change and its semver impact.
- Changeset tooling is deferred for now (see ADR
  [0001-single-package-structure.md](./decisions/0001-single-package-structure.md)) —
  until it's wired up, version bumps and changelog entries are done by hand in the PR
  that ships the release.
- Pre-1.0, minor versions may include breaking changes as the API stabilizes; this should
  still be called out explicitly in the changelog, not buried in a patch note.
