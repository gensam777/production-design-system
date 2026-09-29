# Patterns & Templates

Reusable combinations of design-system components that solve a recurring product problem
(**patterns**) and page-level compositions (**templates**). Formalized from the Pattern
Audit of the product examples (Login, Login error, Dashboard, Dashboard mobile, Settings,
Success).

**Status: documented compositions, not public components.** Each has a guideline here, a
reference composition in `src/patterns/` (used by `src/examples/`), a Storybook story under
`Patterns/*`, and a Figma entry on the Patterns / Templates pages. None is exported from
`src/index.ts` (approved decision): a pattern graduates to a component only when repeated
use proves it needs its own stable API.

| Pattern / template             | Kind     | Guideline                                            | Reference composition                                          | Storybook                       |
| ------------------------------ | -------- | ---------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| Form validation & feedback     | Pattern  | [form-validation.md](./form-validation.md)           | — (behavior rules)                                             | `Patterns/Form validation`      |
| Action group                   | Pattern  | [action-group.md](./action-group.md)                 | `src/patterns/ActionGroup`                                     | `Patterns/Action group`         |
| Settings section & form layout | Pattern  | [settings-section.md](./settings-section.md)         | `src/patterns/SettingsSection` (`SettingsSection`, `FieldRow`) | `Patterns/Settings section`     |
| Page header                    | Pattern  | [page-header.md](./page-header.md)                   | `src/patterns/PageHeader`                                      | `Patterns/Page header`          |
| App shell                      | Template | [app-shell.md](./app-shell.md)                       | `src/patterns/AppShell`                                        | `Patterns/App shell`            |
| Centered card layout           | Template | [centered-card-layout.md](./centered-card-layout.md) | `src/patterns/CenteredCardLayout`                              | `Patterns/Centered card layout` |

Figma: patterns live on the **Patterns** page, templates on the **Templates** page of the
canonical file (see `CLAUDE.md`). Product screens built from them live on **Examples /
Playground**.
