# design/

Platform-neutral source of truth (ADR [0013](../governance/decisions/0013-cross-platform-architecture.md),
[0017](../governance/decisions/0017-workspace-structure.md)). Data only — no platform code, no
CSS syntax, no React / Swift / Kotlin API names.

| Folder       | Contents                                                                                                    | Built / checked by                     |
| ------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `tokens/`    | DTCG token source: `core/`, `brands/<brand>/`, `semantic/`, `platform/{web,native}/` (ADR 0011, 0014, 0016) | `npm run tokens:build` (`@pds/tokens`) |
| `fonts/`     | Font asset catalog `fonts.json` + schema — metadata, not tokens, no font files (ADR 0016)                   | `npm run tokens:build`                 |
| `contracts/` | Cross-platform component contracts: `schema.json` + `components/*.contract.yaml` (ADR 0015)                 | `npm run contracts:validate`           |
