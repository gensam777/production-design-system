# Design-to-Code Mappings

This file is the manual record of how Figma components/variants map to React components
in this repo. There is no automated sync (Figma Code Connect is deliberately not used) —
this table is updated by hand whenever a component ships or a mapping changes.

## Format

| Figma component | Figma link | React component | Notes |
| --- | --- | --- | --- |
| _(none yet)_ | | | |

- **Figma component** — the component/variant name as it appears in the Figma library.
- **Figma link** — direct link to the node in the library file.
- **React component** — path to the component in `src/components/`.
- **Notes** — known deviations between design and implementation, if any.

## Guidelines

- Add a row when a component is first implemented, not when it's proposed.
- If Figma and code diverge after release, log it here and in `governance/decisions/`
  rather than silently reconciling one to match the other.
