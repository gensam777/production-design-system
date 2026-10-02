# 0012: Design-audit live-Figma refresh stays semi-automatic

- **Status**: Accepted
- **Date**: 2026-10-02
- **Context docs**: [`docs/design-audit.md`](../../docs/design-audit.md),
  [`.claude/skills/design-audit/SKILL.md`](../../.claude/skills/design-audit/SKILL.md)

## Context

The design audit (`npm run design:audit`) compares code against a **committed** normalized
Figma snapshot. CI runs it on every PR and warns when the snapshot is more than 14 days old.
Refreshing the snapshot from live Figma needs the `design-audit` Claude skill: it runs the
committed read-only extractor (`scripts/design-audit/figma/extract-login.js`) through the
Figma MCP `use_figma` tool, then `npm run design:audit:refresh` validates, writes and audits.

We evaluated whether Figma changes could be detected **unattended** instead: Figma webhooks,
REST API polling, GitHub Actions with a Figma credential, and a scheduled Claude cloud agent
with a connected Figma integration.

What the extractor reads, and whether it's available outside the Plugin API (checked against
Figma's developer docs on 2026-10-02; account: Full seat on a Professional team):

| Snapshot data                                     | Plugin API (MCP)              | REST API on our plan                                                                                   |
| ------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Auto-layout sizing, wrap, alignment, gap, padding | Yes                           | Yes                                                                                                    |
| Bound variable per field / paint                  | Yes                           | Variable **ID** only (`boundVariables` → `{ type, id }`)                                               |
| Variable and collection **names**                 | Yes (`getVariableByIdAsync`)  | **No.** Needs the Variables REST API: "you must have a Full seat in an Enterprise org"                 |
| Brand mode name, explicit vs inherited            | Yes (`resolvedVariableModes`) | `explicitVariableModes` gives IDs only; no resolved/inherited modes; mode names need the Variables API |
| Component set name, component properties          | Yes                           | `componentId` + `componentProperties` documented                                                       |
| Text style, font family/style/size                | Yes                           | Yes (style IDs, `TypeStyle`)                                                                           |
| Card `Content` slot (`type: "SLOT"`)              | Yes                           | **Not documented** in the REST node types; the audited roles are found through this slot               |

## Decision

**The semi-automatic workflow stays the production approach.** A person asks Claude to
refresh; the skill runs the committed extractor through the authenticated Figma MCP; the
deterministic `design:audit:refresh` validates, writes and audits; the snapshot change is
reviewed and committed by a human. CI keeps auditing the committed snapshot and warning on
age. No unattended monitoring, Figma credentials, scheduled workflows or webhooks are added.

### Why Figma webhooks are insufficient

A webhook answers "the file was saved", not "an audited property changed". `FILE_UPDATE`
carries only the event type, file key and name, a passcode, a timestamp and the webhook ID,
and fires within 30 minutes of editing inactivity. No payload (`FILE_UPDATE`,
`FILE_VERSION_UPDATE`, `LIBRARY_PUBLISH`) says which nodes or properties changed. The file
holds every component page and the docs frames, so most saves never touch the Login frames.
Acting on a webhook would still need a safe way to extract the audited properties
afterwards, which only the MCP extractor provides today. It would also add a public relay
endpoint (GitHub Actions can't receive webhooks directly) and a long-lived secret.

### Why REST / GitHub Actions can't reproduce the snapshot

Without Enterprise, REST returns variable IDs but not the variable names, collection names or
Brand mode names that the audit compares (`Semantic Space/stack/sm` ⇔ `--space-stack-md`,
Brand A/B). It doesn't resolve inherited modes, and SLOT nodes aren't documented, so the
card's content roles may not be reachable. A REST extractor would therefore be a second,
weaker source of truth with its own format and a parity burden against the MCP extractor.
We rejected the hybrid (REST + a committed variable-ID → name map) because it misses
variable renames, value changes in non-default modes and slot contents, so a pass would not
mean "Figma matches". A visibly stale snapshot is safer than a fresh-looking partial one.

### Why the Claude + Figma MCP skill stays the canonical live-Figma path

It is the only path that reads every audited property, using the exact versioned extractor
that produced the committed snapshot. The extractor's read-only guardrail is tested,
validation rejects truncated or edited output without writing anything, and a person is
present for every live read and reviews every snapshot change.

### Security and maintenance reasons not to add Figma credentials yet

- A Figma personal access token reads **every file the account can access**, not just this
  one. Since April 2025 tokens expire after at most 90 days, so automation would need a
  rotation process, or it silently stops.
- A webhook adds a public endpoint, passcode handling and a secret on a third-party host.
- A scheduled cloud agent would run `use_figma` unattended, and `use_figma` executes arbitrary
  Plugin API code that can **write** to Figma. There is no read-only mode. Text inside the
  Figma file would also reach an unsupervised agent (prompt-injection risk), and the agent
  would need repo access. Scheduled-agent access to a Figma connector is also unverified.
- Each option adds infrastructure to maintain (relay, rotation, second extractor, agent
  config) for a design surface that changes rarely and already has a one-command refresh.

## Revisit when

Reopen this decision when any one of these becomes true:

1. **Enterprise access to the Variables REST API.** Variable names, collections and modes
   become readable over REST. Also confirm REST exposes slot contents. A REST extractor at
   parity could then run in scheduled GitHub Actions with a rotated read-only token.
2. **Verified read-only, non-interactive Figma MCP access**: token or service login usable from
   CI, or a read-only Plugin API execution mode. That allows the committed extractor in
   GitHub Actions without an interactive login or write capability.
3. **Verified scheduled Claude agent support for the Figma connector, with read-only
   restrictions.** Then the smallest design is a scheduled agent that runs the existing skill
   and opens an issue on drift.
4. **Design-change volume grows** (for example several designers editing audited frames often)
   so that the 14-day staleness warning plus manual refresh no longer keeps the snapshot
   meaningful.

## Consequences

- Live Figma drift is detected only when someone runs the skill. The CI age warning and the
  `capturedAt` printed on every audit keep that limit visible.
- Nothing new to rotate, host or monitor; no Figma secret in the repo or CI.
- Volume-based reconsideration (condition 4) is a judgment call; record the trigger when it
  is invoked.
