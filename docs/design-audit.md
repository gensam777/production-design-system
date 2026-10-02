# Design audit (Figma ↔ code drift)

`npm run design:audit` detects **structured design-contract drift** between the canonical
Figma file and the React implementation: token assignments, spacing, padding, radius,
typography roles, component usage and variant selections, brand mode, and known composition
properties. It **reports only**. It never edits Figma or code, never commits or pushes, never
opens PRs, and never touches Chromatic baselines.

Pixel comparison is out of scope on purpose. Chromatic already covers visual regression. This
audit answers a different question: _do Figma and code reference the same design decisions?_

**V1 scope: the Login surface only.** That means Figma `01 — Login` (`998:9`), `01b — Login ·
Error state` (`1001:1726`) and the Brand B preview `B · 01b — Login · Error state` (`1063:1926`),
against `LoginScreen`, `CenteredCardLayout` and the `Card` it composes. The Brand B preview
section has no plain `01` frame, so Brand B is audited through 01b.

## Architecture

```
 ┌──────────────── needs a Claude session with the Figma MCP ────────────────┐
 │ scripts/design-audit/figma/extract-login.js   (committed, READ-ONLY)       │
 │   run verbatim via use_figma ──► raw JSON (+ FNV-1a checksum) → scratchpad │
 └────────────────────────────────────────────────────────────────────────────┘
 ┌──────────────── local, offline & deterministic ────────────────────────────┐
 │ npm run design:audit:refresh -- <raw.json>                                 │
 │   validates JSON / schema / extractor version / node IDs / checksum        │
 │   (rejected → writes nothing, exit 2)                                      │
 │   ──► scripts/design-audit/snapshots/login.figma.json   (uncommitted)      │
 │   ──► runs design:audit + prints which Figma properties changed            │
 └────────────────────────────────────────────────────────────────────────────┘
 ┌──────────────── fully offline & deterministic (local + CI) ────────────────┐
 │ npm run design:audit                                                       │
 │   surfaces/login.json        the contract: frames, files, checks           │
 │ + snapshots/login.figma.json the committed Figma evidence                  │
 │ + src/** (CSS, JSX literals) the code evidence                             │
 │ + src/tokens/** (DTCG source, resolved per brand — no build needed)        │
 │ + known-differences.json     documented, value-pinned exceptions           │
 │   ──► terminal summary + design-audit-report.json, exit 0 / 1              │
 └────────────────────────────────────────────────────────────────────────────┘
```

**Why there's a snapshot step.** A standalone Node script cannot call the Figma MCP. The MCP is
authenticated inside the Claude session and has no API a script can use. Reading per-node
variable bindings (which variable is bound to _this_ gap, padding or fill) also requires the
Plugin API, through `use_figma`. `get_variable_defs` only returns a flat union per subtree.
So reading Figma is a deliberate, reviewable step. Everything after it is plain Node. The
extractor is versioned in the repo, so every refresh runs identical code. Ad-hoc generated
MCP code is never the canonical extractor.

| Path                                              | Purpose                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `scripts/design-audit/audit.mjs`                  | CLI for `npm run design:audit`                                           |
| `scripts/design-audit/refresh.mjs`                | CLI for `npm run design:audit:refresh` (import + audit + change summary) |
| `scripts/design-audit/snapshot.mjs`               | CLI for `npm run design:audit:snapshot -- import\|validate\|age`         |
| `scripts/design-audit/surfaces/login.json`        | Login contract (frames, code files, checks)                              |
| `scripts/design-audit/known-differences.json`     | Documented known differences                                             |
| `scripts/design-audit/figma/extract-login.js`     | Read-only Plugin API extractor (run via `use_figma`)                     |
| `scripts/design-audit/snapshots/login.figma.json` | Committed normalized Figma snapshot                                      |
| `scripts/design-audit/lib/`                       | Token resolver, CSS/JSX readers, comparators, report                     |
| `scripts/design-audit/__tests__/audit.test.mjs`   | `npm run design:audit:test` (`node:test`)                                |
| `.claude/skills/design-audit/SKILL.md`            | The Claude refresh workflow                                              |

## Commands

```sh
npm run design:audit                                   # all surfaces, writes design-audit-report.json
npm run design:audit -- --surface login                # one surface
npm run design:audit -- --surface login --snapshot <file>   # audit another snapshot (fixtures)
npm run design:audit -- --no-json                      # terminal only
npm run design:audit:test                              # audit logic tests
npm run design:audit:snapshot -- validate              # validate the committed snapshot
npm run design:audit:snapshot -- import <raw.json>     # validate + write snapshot only
npm run design:audit:snapshot -- age --max-days 14     # warn if the snapshot is stale (always exit 0)
npm run design:audit:refresh -- <raw.json>             # (refresh workflow) validate + write + audit + change summary
```

The exit code is `0` when every check is PASS or KNOWN_DIFFERENCE, and `1` on any DRIFT or
ERROR. `design-audit-report.json` is gitignored. CI uploads it as an artifact.

## Statuses

| Status             | Meaning                                                                                                                                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PASS`             | Figma and code agree. For token checks this means **both** the same token identity (`Semantic Space/stack/md` ⇔ `--space-stack-md`) **and** the same resolved value in that frame's brand. A Figma variable whose value drifted from the code token is DRIFT even though the names match. |
| `DRIFT`            | They disagree, and no known difference records exactly this disagreement. A raw value in code where Figma binds a token is DRIFT even when the pixels match, and so is an unbound value in Figma.                                                                                         |
| `KNOWN_DIFFERENCE` | They disagree in exactly the way an entry in `known-differences.json` records (same check, frame, Figma value and code value). Always printed with its reason and doc link, never hidden.                                                                                                 |
| `ERROR`            | The check couldn't be evaluated: invalid, truncated or stale-extractor snapshot; missing Figma role, CSS selector or token; non-literal JSX value; a **stale** known difference (Figma and code now agree); or an **orphaned** one (its check doesn't exist).                             |

Each result row (terminal and JSON) carries: surface, check / property, frame, scope (frame ·
brand), status, Figma value/token, code value/token, notes, and the known difference if one
applied. The terminal collapses frames that share an identical result.

## Contract format (`surfaces/<surface>.json`)

- `figma`: canonical `fileKey`, the extractor's `name`/`version`/`file`, and the snapshot path.
- `frames`: snapshot key → `nodeId`, `label`, code `brand` (`brand-a`/`brand-b`) and
  `codeState` (the screen props the frame represents, e.g. `{ "error": true }` for 01b).
- `files`: aliases for the code files checks read.
- `components`: Figma component-set name → React component name.
- `checks[]`: `id`, `property`, `compare`, `figma` (path(s) into the frame's roles, or `$field`
  for frame-level data), `code` (one of `css`, `cssFromProp`, `prop`, `text`, `match`,
  `typography`), optional `map` (Figma enum → CSS value), `frames`, `notes`.

Comparators:

| Comparator       | Compares                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `token`          | Token identity, then resolved value in the frame's brand                                  |
| `px`             | Pixel value                                                                               |
| `enum`           | Mapped value, case-insensitive                                                            |
| `text`           | Exact copy                                                                                |
| `typography`     | Text style role ⇔ `--text-<role>-*` on all five properties, plus resolved family and size |
| `componentOrder` | Component order, honouring `{flag && <X/>}` guards against `codeState`                    |
| `brandMode`      | Effective Figma Brand mode ⇔ the frame's code brand                                       |

Add a check only when it's evidence-backed: the property must be bound or explicitly set in
Figma and expressed as a literal or a token in code.

## Known differences

Each entry in `scripts/design-audit/known-differences.json` must have `id`, `surface`,
`check`, `figma` and `code` (the **exact** displayed values it accepts), `scope`, `reason`, and
optionally `frames` and `doc`. If either side changes, the entry stops matching and the check
reports DRIFT, with a note that a known difference exists for different values. If the two
sides come to agree, the entry is reported as a stale ERROR until it is removed. Exceptions
can't silently outlive their reason. This follows the same model as
`scripts/token-usage-exceptions.json`.

### Known differences (Login)

| Id                   | Check            | Figma                                                     | Code                                | Why                                                                                                                                                                                                                                                                                      |
| -------------------- | ---------------- | --------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login-form-element` | `form-structure` | Fields sit directly in the Card's flat `Content` slot     | Fields wrapped in a native `<form>` | Platform difference. A real form needs `<form>` (submit on Enter, `onSubmit`, form semantics). Spacing stays identical: both the card's `compact` gap and the form gap are `space.stack.md`, audited by `card-content-gap` and `form-gap` (see `docs/patterns/centered-card-layout.md`). |
| `login-row-wrap`     | `row-wrap`       | `NO_WRAP`                                                 | `flex-wrap: wrap`                   | Code-only responsive behavior. The remember-me / forgot-password row wraps instead of colliding on narrow cards or long (localized) copy. The fixed 440px Figma frames never wrap, so Figma can't express it.                                                                            |
| `login-row-wrap-gap` | `row-gap`        | `inset/none` (0px), items pushed apart by `SPACE_BETWEEN` | `stack.sm` / `inline.md`            | Follows from `login-row-wrap`. The gap only takes effect once the row wraps.                                                                                                                                                                                                             |

## What CI does and does not prove

CI runs `npm run design:audit:test` and `npm run design:audit` on every push and PR. The audit
runs against the **committed** snapshot.

- **It does catch code-side drift.** Examples: a changed token or a hard-coded value in Login
  CSS, a different `width` or `compact` prop, a renamed selector, a component removed or
  reordered, changed copy, or a token value change in `src/tokens` that no longer matches the
  values Figma had.
- **It does not know whether live Figma changed after the last snapshot refresh.** It never
  contacts Figma. A Figma-side change shows up only after someone refreshes the snapshot
  (`.claude/skills/design-audit/SKILL.md`) and commits it. The snapshot's `capturedAt` is
  printed on every run so its age is visible.
- **It warns when the snapshot is stale.** A CI step (`design:audit:snapshot -- age --max-days
14`) adds a GitHub warning annotation when the committed snapshot is more than 14 days old.
  It is a warning only and never fails CI; the audit still runs normally.

## Refreshing the snapshot

Use the `design-audit` Claude skill (`.claude/skills/design-audit/SKILL.md`). It runs the
committed extractor verbatim through `use_figma`, saves the raw output to the session
scratchpad, then runs `npm run design:audit:refresh -- <raw.json>`. That command validates the
raw output (an invalid or truncated payload writes nothing), writes the snapshot, runs the
audit and prints which Figma properties changed. The skill then reports.

Reading live Figma is the only step that needs Claude: an npm script cannot reach the
session-authenticated Figma MCP, and GitHub Actions has no Figma credential. It does not commit, push or open PRs. If the refresh
reveals DRIFT, fixing it (in Figma or in code) is a separate, human-approved task.

## Limitations

- **Snapshot freshness.** See the CI section above. The audit is only as current as the
  committed snapshot.
- **Transfer through the session.** The extractor's output comes back through the MCP tool
  result and is saved to disk by Claude. The FNV-1a checksum makes truncation or
  mis-transcription fail the import, so it can't slip into the snapshot. The Login payload is
  about 18 KB, close to the size a single tool result can return. A bigger surface should get
  its own extractor (one per surface) or extract frames in separate runs.
- **Narrow code readers.** The readers are deliberately narrow. CSS is read per exact selector
  (at-rule-scoped declarations are ignored). JSX is read for literal props, static text and
  element order only. Anything dynamic is reported as ERROR, never guessed.
- **Responsive intent** is only audited where both sides can represent it. Figma has no compact
  Login frame, so mobile layout isn't audited. The card's fixed 440px is compared with the code's
  `max-width`, which is the documented responsive intent.
- **Not covered here:** visual or pixel regressions (Chromatic), interaction and accessibility
  behavior (Storybook and `governance/accessibility.md`), and surfaces other than Login (V1).

## Adding a surface (later)

1. Write `scripts/design-audit/figma/extract-<surface>.js`, a read-only extractor modelled on
   the Login one, and extend the read-only guardrail test to cover it.
2. Write `scripts/design-audit/surfaces/<surface>.json` with only evidence-backed checks.
3. Refresh its snapshot with the skill, review the first DRIFTs, and record genuine platform
   differences (with reasons) in `known-differences.json`.
