---
name: design-audit
description: Refresh the committed Figma snapshot for the Figma ↔ code design-drift audit and report the result. Runs the committed read-only extractor via the Figma MCP, validates and writes the normalized snapshot, runs `npm run design:audit`, and reports PASS / DRIFT / KNOWN_DIFFERENCE / ERROR. Use when asked to "run the design audit", "refresh the Login snapshot", "check Figma drift", or "check whether Figma changed". Detection and reporting only. Never modifies Figma or production code, never commits, pushes, or opens PRs.
---

# Design audit: snapshot refresh and report

This skill is the only step of the design audit that needs a Claude session: reading live Figma
through the Figma MCP. Everything after that (`npm run design:audit:refresh`, which validates,
writes the snapshot and runs `npm run design:audit`) is offline and deterministic. The full architecture, statuses,
contract format and limitations are in `docs/design-audit.md`. Read it if it isn't already in
context. `CLAUDE.md` overrides anything here.

**V1 scope: the Login surface only** (`scripts/design-audit/surfaces/login.json`). Don't
expand to other surfaces unless the user explicitly asks. Adding a surface is its own task
(see "Adding a surface" in `docs/design-audit.md`).

## Hard rules (non-negotiable)

1. **Read-only toward Figma.** The only `use_figma` call is the committed extractor
   `scripts/design-audit/figma/extract-login.js`, run **verbatim**: Read the file and pass its
   entire contents as `code`. Don't edit, trim, "fix" or wrap it, and don't substitute ad-hoc
   generated Plugin API code. If the extractor fails or needs a change, stop and report. A
   change to the extractor is a separate, reviewed code change: bump `EXTRACTOR.version` and
   `figma.extractor.version` in the contract together. Load the `figma:figma-use` skill before
   the call, as `use_figma` requires.
2. **Never modify design or production code during an audit.** Don't change anything under
   `src/`, the token JSON, stories, docs, or Figma, even when the audit finds DRIFT. Fixing
   drift is a separate, human-approved task.
3. **The only files this workflow writes** are `scripts/design-audit/snapshots/login.figma.json`
   (written by `npm run design:audit:refresh`, never by hand) and the gitignored
   `design-audit-report.json`.
   Put the raw extractor output in the session scratchpad, never in the repo.
4. **Don't commit, push, open PRs, or accept Chromatic baselines.** Leave the refreshed
   snapshot as an uncommitted change for the user to review.
5. **Don't touch `known-differences.json` to make the audit pass.** Recording a known
   difference is a human decision (it needs a real reason and scope). You may _propose_ an
   entry in the report.
6. **Never hand-edit the snapshot or the raw output.** If the refresh rejects it (checksum, schema, node IDs,
   extractor version), fix the cause and re-run the extractor. Don't patch the JSON.

## Workflow

1. **Pre-flight.** Run `git status --short` and note anything already modified so you can tell
   it apart from this workflow's changes. Confirm the canonical file key in the contract
   (`figma.fileKey`) matches `CLAUDE.md` (`zE07Pl0ioDayHN2GK2set7`).
2. **Inspect live Figma.** Read `scripts/design-audit/figma/extract-login.js` in full and call
   `use_figma` with `fileKey` from the contract, `code` = the exact file contents, and
   `skillNames: "figma-use"`. Expect one JSON object back containing `schemaVersion`,
   `extractor`, `capturedAt`, `checksum` and `frames`.
   - If the result looks truncated (no closing braces, or a "truncated" marker), don't try to
     reconstruct it. Report it as a known limitation (see `docs/design-audit.md`, Limitations).
   - If a frame comes back with `error: "node not found"`, report it. Node IDs may have
     changed, and re-verifying them with `get_metadata` is a contract change to propose, not
     to make silently.
3. **Save the raw output.** Write the returned JSON **exactly as returned** to the scratchpad,
   e.g. `<scratchpad>/login.raw.json`. Don't reformat, reorder or edit it. The checksum
   covers `frames`.
4. **Refresh: validate, write, audit, summarize — one command.**
   `npm run design:audit:refresh -- <scratchpad>/login.raw.json`.
   This validates the JSON, schema, extractor name/version (against the contract **and** the
   committed extractor file), canonical file key, node IDs and checksum; writes the committed
   snapshot path; runs `design:audit` for the surface; and prints which Figma properties
   changed versus the previous snapshot plus the PASS / DRIFT / KNOWN_DIFFERENCE / ERROR counts.
   Exit codes:
   - `2`: the raw output was rejected and **nothing was written**. Report the reasons and stop.
   - `1`: the audit found DRIFT or ERROR. That's an expected outcome, not a tooling failure.
   - `0`: every check is PASS or KNOWN_DIFFERENCE.
5. **Confirm the evidence.** `git status --short` and `git diff --stat`: the snapshot must be the
   only tracked file changed by this workflow. Use the refresh command's change list (not the
   raw `git diff`, which also shows `capturedAt`/`checksum` churn) for "what changed in Figma".
   With `core.autocrlf`, git may list the snapshot as modified when only line endings changed;
   an empty `git diff` means Figma didn't change.

## Report format

Report back with:

- **Snapshot.** `capturedAt`, checksum, extractor version, and whether it changed versus the
  committed snapshot (and which properties).
- **Summary counts** for PASS / DRIFT / KNOWN_DIFFERENCE / ERROR.
- **Every non-PASS row**: check, frame(s), Figma value/token, code value/token, notes. For
  KNOWN_DIFFERENCE include the entry id and its reason.
- **For each DRIFT**, the likely direction, if the evidence shows it. For example, the
  snapshot changed while the code didn't, which suggests a Figma-side edit. Then name the
  options: update code to match Figma, update Figma, or record a known difference with a
  reason. **Don't pick one or act on it.**
- **For each ERROR**, the cause and the fix (stale or orphaned known difference, missing node,
  extractor version bump, and so on).
- **Files changed**: only the snapshot, uncommitted. Remind the user it's left for their
  review.

Never claim live Figma matches code beyond what this run's snapshot shows, and never say that
CI checks live Figma (it only checks the committed snapshot).
