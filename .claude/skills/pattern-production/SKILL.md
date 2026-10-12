---
name: pattern-production
description: Production workflow for reusable design-system patterns and templates — compositions of existing components that solve a repeated layout/composition problem (auth layouts, app shells, settings sections, toolbars/filters, form layouts, empty states, confirmation layouts, dashboard sections). Discovers the Figma pattern/template and the repo, demands evidence of reuse, classifies the pattern and its target platform, audits Figma first, compares with existing patterns/components, proposes and pauses, then implements it in `packages/react/src/patterns/` with Storybook stories and `docs/patterns/` guidance after approval and verifies it. Use for "/pattern-production", "sync this pattern", "create this reusable pattern", "update this pattern". Not for single components (component-production), one-off product screens (figma-screen-sync) or token architecture (token-production). Never commits, pushes, opens PRs, or accepts Chromatic baselines.
---

# Pattern production

This skill owns **reusable compositions**: patterns and templates built from existing DS
components, documented in `docs/patterns/`, implemented as reference compositions in
`packages/react/src/patterns/`, shown under `Patterns/*` in Storybook, and drawn on the Figma
**Patterns** (`150:83`) and **Templates** (`150:84`) pages. It makes creating or updating
one a repeatable pipeline: discover → validity → classify → Figma audit → repo comparison →
propose and pause → implement → stories and docs → verify → report.

`CLAUDE.md` overrides anything here. Read it first, then `docs/patterns/README.md` and the
guideline for every existing pattern that's related.

**This repo's pattern status (approved decision):** patterns are documented compositions,
**not public components**. They are not exported from `packages/react/src/index.ts`; they're exported
only from `packages/react/src/patterns/index.ts` for use by `packages/react/src/examples/` and stories. A pattern
graduates to a real component only when repeated use proves it needs its own stable API.
That graduation is a `component-production` task, not this skill's.

**Hand off when needed:**
- **Token issue** (missing or misused token, new semantic role) → `token-production`.
- **Component architecture** (a component's API, variants or structure must change, or a
  pattern should become a component) → `component-production`.
- **Product screen implementation** (applying the pattern to a screen in `packages/react/src/examples/`)
  → `figma-screen-sync`. Exception: migrating existing examples to an updated pattern is in
  scope when the approved proposal lists it.
- **Drift/parity check** of an audited surface → `design-audit`.

## Hard rules (non-negotiable)

1. **Canonical Figma file only:** `zE07Pl0ioDayHN2GK2set7`. Call `create_session` first.
   Load `figma:figma-use` before any `use_figma` call and `figma:figma-design-to-code`
   before `get_design_context`.
2. **Read-only until approval.** Steps 1–5 change nothing in Figma or the repo.
3. **Two mandatory pauses:** after the Figma audit if it found issues (step 4), and after
   the proposal (step 6). A request like "create this pattern" authorizes discovery,
   classification, audit and the proposal only.
4. **No pattern without reuse evidence** (step 2). A composition used once stays in
   `packages/react/src/examples/`. Promoting it anyway is the user's explicit decision, recorded in the
   pattern's doc.
5. **Never silently fix Figma**, and never "fix" a Figma problem in code by guessing what
   was meant. Report it and ask.
6. **Composition over new APIs.** Reuse existing components unchanged. Prefer `children`
   and slots over props. Don't turn every layout difference into a prop, and don't add
   speculative variants. Each prop needs a current consumer.
7. **Semantic tokens only** (enforced by `npm run lint`): no Core primitives, no
   `--brand-*`, no raw hex. No pattern-specific tokens unless step 4/5 justifies them, and
   then they go through `token-production`.
8. **One code path for every brand.** Never branch on brand or duplicate a pattern per
   brand.
9. **Build for the classified platform.** Never assume web behavior for an app pattern:
   no web breakpoints, desktop widths or App shell for mobile/tablet app patterns. Device
   chrome is reference-only.
10. **Stay in scope.** Don't change unrelated patterns, components, tokens or screens.
11. **Don't commit, push, open PRs, or accept Chromatic baselines.**

## Repo conventions for patterns

- **Code:** `packages/react/src/patterns/<Name>/<Name>.tsx`, `<Name>.css`, `<Name>.stories.tsx`, exported
  from `packages/react/src/patterns/index.ts` (never from `packages/react/src/index.ts`). A behavior-only pattern may be
  stories plus a doc with no component (precedent: `FormValidation`).
- **Code style:**
  - classes `ds-pattern-<name>__<element>`;
  - a header comment in both `.tsx` and `.css` saying "pattern, not a DS component", what
    it matches in Figma, and the tokens used;
  - props documented with JSDoc, including the reason behind any composition constant.
- **Stories:** `title: 'Patterns/<Readable name>'`.
- **Docs:** `docs/patterns/<kebab-name>.md` with **Problem**, **Anatomy** (templates),
  **Rules**, the pattern's own layout section if needed, **Accessibility**, **Tokens** and
  **Implementation** (React path, consumers, Storybook title, Figma location). Add a row
  to the table in `docs/patterns/README.md`.
- **Figma:** patterns go on the **Patterns** page as a doc frame; templates go on the
  **Templates** page as a doc frame plus specimens. Record new frames in the `CLAUDE.md`
  Patterns/Templates rows.
- **Responsive:** page-level layout uses viewport `@media` queries; layout inside a
  container (e.g. inside a Card) uses container queries
  (`docs/foundations/responsive.md`; precedent: `FieldRow`). Breakpoint and width values
  that aren't tokens are documented composition constants (precedent: 400/440px card
  widths, 30rem `FieldRow`).

## Workflow

### 0. Pre-flight

- Run `git status --short` and check the branch. Note pre-existing changes. If on `main`,
  propose a `feat/…` branch in the proposal.
- Read `CLAUDE.md`, `docs/patterns/README.md`, the related pattern guidelines, and
  `packages/react/src/patterns/index.ts`.

### 1. Discover (read-only)

1. **Find the subject.** Use the frame or pattern the user named. Otherwise run
   `get_metadata` on the Patterns (`150:83`) and Templates (`150:84`) pages and compare
   with the `CLAUDE.md` rows and `docs/patterns/README.md`: unrecorded frames are new, and
   recorded ones the user says changed are updates. If several candidates are possible,
   list them with IDs and a thumbnail each and ask which one.
2. **Determine:** what was created or changed, its **purpose** (the repeated problem it
   solves), **where it's used** (Figma instances and frames, existing `packages/react/src/examples/`
   screens, other patterns), the **components it composes**, and what it owns versus
   what consumers pass in.
3. **Reusable or one-off?** Look for the same composition in other product frames on
   Examples / Playground and in `packages/react/src/examples/`. Note each occurrence with its node ID or
   file path.

### 2. Pattern validity

A pattern must:
- **solve a repeated layout or composition problem**, not just look tidy;
- **be used, or have a concrete planned use, in ≥2 screens or flows**. A use only counts as
  planned if the user or an existing design says so;
- **compose existing components** rather than reimplementing them;
- **leave product content to consumers:** titles, copy, data, actions and destinations
  arrive through props or `children`. It owns only structure, spacing and behavior rules.

Flag **over-abstraction**:
- one consumer;
- props that exist for a single screen's quirk;
- a "pattern" that is really one component with extra markup;
- configuration that recreates the screen ("`showX`, `showY`, `variant=screenA`");
- a wrapper whose only job is to pass props through.

Not reusable enough → classify it as such (step 3) and recommend leaving it in
`packages/react/src/examples/`.

### 3. Classify

**Pattern kind** (pick one):

| Kind | Examples here or typical |
| --- | --- |
| Layout pattern | Settings section / `FieldRow`, dashboard sections |
| Navigation pattern | Page header, tab/section navigation, toolbars |
| Form pattern | Form layout, Action group |
| Feedback/state pattern | Form validation & feedback, empty states, confirmation |
| Data-display pattern | Stat rows, lists/tables, activity feeds |
| Workflow pattern | Multi-step flows, wizards, review-and-confirm |
| Template | Page-level frame: App shell, Centered card layout, auth layouts |
| Not reusable enough yet | Stays in `packages/react/src/examples/` |

**Target platform:**

| Platform | Meaning for the pattern |
| --- | --- |
| Web / Web app | Browser layout. Can sit in the App shell; container cap; templates' responsive behavior. |
| Responsive web | Designed at more than one breakpoint. Mobile-first viewport or container queries per designed breakpoint. |
| Mobile app | Native phone composition. Fluid to the viewport, no breakpoints, no desktop widths, no web App shell. |
| Tablet app | Native tablet composition, per designed orientation. Not desktop web by default. |
| Cross-platform concept | Structure and behavior rules that hold on every platform (e.g. "one domain = one save scope", where form errors go). Document the rules platform-neutrally; the React reference is one realization. |
| Unknown | Ask one short question with your best guess before implementation. You can include it in the issue report or the proposal. |

Infer the platform from the frames' dimensions, device chrome, naming, sibling frames,
layout structure and navigation patterns, the same signals as `figma-screen-sync` step 2.
A narrow frame is not automatically responsive web. The existing patterns are all
**web / web app**; don't reuse them for an app pattern just because the content looks
similar.

### 4. Figma audit (read-only)

Inspect the real nodes (`get_variable_defs`, read-only `use_figma` reading
`boundVariables`, `textStyleId`, `effectStyleId`, layout properties, `mainComponent` and
`componentProperties`), not screenshots alone. Check each item and record node ID + name:

- **Semantic tokens:** colors, spacing, radius, elevation and icon size bound to
  **Semantic** variables, not `Core`/`Brand` directly. A raw value that numerically
  matches a token is still a finding (component-production's Raw-Value Guard).
- **Text Styles** on every text node.
- **Auto Layout** throughout. Gaps and padding are bound, sizing (hug/fill/fixed) matches
  intent, and there's no absolute positioning or spacer shapes.
- **Component instances and variants** are from the canonical sets (see the `CLAUDE.md`
  table), with valid variant combinations and properties set through exposed properties.
- **Detached instances** or local copies that replicate a DS component.
- **Slots and content:** content consumers vary (title, body, actions) uses slots or
  instance properties, not hard-coded product copy baked into the pattern.
- **Responsive/adaptive intent** for the classified platform: specimens per breakpoint or
  width, Fill vs fixed, max-widths, reflow. For app platforms: fluid inside the device
  frame, with orientations for tablet.
- **Brand A / B:** no Brand mode pinned, except on preview specimens; no brand-specific
  raw values; a Brand B specimen or preview if the pattern has brand-sensitive parts
  (radius, font, primary).
- **Accessibility structure:** landmark/heading intent, label placement, reading order
  matching layer order, focus order, touch targets for app platforms.
- **Pattern-specific variables:** any variable scoped to this pattern only. It's justified
  only if no semantic role fits and it represents a real recurring role. Otherwise it's a
  finding for `token-production`.

If anything is found, **stop**: report each issue (node, current state, expected
token/component/variant, recommendation, whether it blocks) and ask how to proceed. Don't
fix it. If the audit is clean, say so in one line.

### 5. Repo comparison

- **Existing pattern already solving it?** Check `packages/react/src/patterns/*` and `docs/patterns/*`.
  If one does, the right move is usually to extend that pattern (or document a variant
  of its usage), not to add a sibling.
- **Components to reuse:** confirm each needed variant and state already exists (props
  and stories).
- **Component API change needed?** Only if the pattern genuinely can't be composed today.
  That part goes to `component-production`. Don't patch a component inside this skill.
- **New token justified?** Only per step 4. Hand it to `token-production`. A one-pattern
  composition constant is documented in CSS and the doc, not tokenized.
- **Pattern or example?** It belongs in `packages/react/src/patterns/` only if step 2 passed. Otherwise
  it stays in (or moves back to) `packages/react/src/examples/`.
- **Consumers to migrate:** existing examples that hand-roll this composition, and
  whether migrating them belongs in this change.

### 6. Propose, then pause

Report concisely, then **stop and wait for approval**:

1. **Pattern detected** — name, Figma node IDs, created vs updated.
2. **Reuse evidence** — each occurrence (frame ID or file path), or why it's planned.
3. **Classification** — kind + target platform, with the deciding signals.
4. **Figma issues** — "none" or the resolved list.
5. **Components reused** — with the props and variants used.
6. **Genuinely missing** — component, API or token gaps, and which skill handles each.
7. **API proposal** — props table (name, type, default, why it exists), what goes in
   `children`/slots, and what the pattern deliberately does *not* own.
8. **Responsive/adaptive approach** — per platform: viewport vs container queries,
   composition constants, orientations.
9. **Accessibility** — landmarks, headings, labelling (e.g. `aria-labelledby`), focus
   order, live regions, keyboard behavior.
10. **Brand A/B** — semantic-only confirmation and what to watch in Brand B.
11. **Files expected to change** — new and modified paths (pattern, stories, doc,
    `docs/patterns/README.md`, `packages/react/src/patterns/index.ts`, `CLAUDE.md` rows, migrated
    examples if approved), plus Figma doc frames if any are to be added.

### 7. Implement (after approval only)

- Build exactly the approved plan under `packages/react/src/patterns/<Name>/`, export it from
  `packages/react/src/patterns/index.ts`, and follow the conventions above.
- Reuse existing components unchanged; semantic tokens only; one code path for every
  brand.
- Keep product copy and data out of the pattern: they come from props and `children`.
  Defaults are limited to structural choices.
- No speculative variants or props. If a new need appears mid-implementation, stop and
  ask.
- Platform-correct layout (hard rule 9). Use a container query for layout inside a
  container, a viewport query only for page-level templates on web platforms, and none
  for app patterns.
- Real semantics: landmarks only where a template owns the page (`<main>`, `<nav>`,
  `<header>`), heading levels passed in or documented, native elements over ARIA.
- Migrate consumers only if the approved proposal includes it, and keep their behavior
  identical.
- If Figma changes were approved (e.g. a doc frame or specimens on the Patterns or
  Templates page), make them with `figma-use`. Use DS instances and semantic bindings
  only, and record the new node IDs.

### 8. Storybook and docs

**Stories** (`Patterns/<Readable name>`):
- a canonical example using realistic but generic content;
- one story per relevant state or variant: empty or filled, error, loading, long
  content and wrapping, the minimum and maximum consumer content;
- a story per designed breakpoint or orientation:
  - for viewport-query templates, use the nested-`<iframe>` technique (precedent:
    `Examples/Dashboard` → Mobile) and forward the brand global;
  - for container-query patterns, use a narrow wrapper;
- docs descriptions with usage notes and the Figma frame each story matches.

**Guideline** (`docs/patterns/<kebab-name>.md`): Problem, Anatomy, Rules, plus:
- **Do / Don't** — concrete pairs.
- **When NOT to use** — the closest alternative pattern, component or plain composition
  instead.
- **Platform scope** — the classified platform(s); what changes, or isn't supported, on
  others.
- **Known constraints** — composition constants, content limits, unsupported
  combinations.
- Accessibility, Tokens, Implementation (React, consumers, Storybook, Figma).

Add the row to `docs/patterns/README.md` and the frame IDs to `CLAUDE.md` (Patterns or
Templates row, with today's date).

### 9. Verify

**Build validation**, in order, reporting pass/fail per command:

```
npm run tokens:build
npm run typecheck
npm run lint
npm run build
npm run build-storybook
```

Also run `npm run format:check` on changed files. Run `npm run design:audit` if a migrated
consumer is an audited surface (currently Login).

Then:
- **A. Figma parity.** Every Figma-side finding is resolved or accepted. The pattern's
  structure (order, grouping, slots) matches the Figma pattern frame.
- **B. Semantic token parity.** For each binding: Figma variable → token source →
  generated CSS custom property → the pattern's CSS. Each must be an exact match, a
  component-owned value, or a documented composition constant.
- **C. Live Storybook behavior.** Open each `Patterns/*` story and any migrated example
  (`claude-in-chrome`, `iframe.html?id=<story-id>&viewMode=story`). Check rendered spacing
  and typography (computed style), wrapping with long content, and console errors and
  warnings. Scope DOM queries to `#storybook-root`.
- **D. Brand A / Brand B.** Every story in both brands (`&globals=brand:brand-b`):
  nothing clips, wraps badly or loses contrast.
- **E. Responsive/adaptive states** for the classified platform:
  - web: each breakpoint, plus just below and above each threshold, and container-query
    widths;
  - app: reference size, smallest and largest device width, and orientations;
  - always: no horizontal overflow.
- **F. Keyboard, focus and accessibility basics:**
  - Tab order matches visual order, and the focus ring is visible;
  - landmarks and headings are as documented, and form or labelled regions are named;
  - live regions behave, and touch targets are adequate for app platforms;
  - the a11y addon / axe report has zero violations.

Describe what was actually exercised. If no live browser is available, don't claim C–F:
list what remains and end with **"Ready for manual visual review, not ready for commit
yet."** (component-production's rule).

### 10. Report

1. **Pattern created/updated** — name, kind, platform, Figma node IDs.
2. **Reuse evidence** — the consumers (current and planned).
3. **Files changed** — exact paths, created vs modified (cross-check `git status`).
4. **Components reused.**
5. **New APIs/tokens** — props added (with justification), any token handed off to
   `token-production`, or "none".
6. **Validation** — pass/fail per command.
7. **Parity and verification** — A–F results, with what was exercised live per brand and
   width.
8. **Remaining blockers** — unresolved Figma issues, hand-offs pending in other skills,
   consumers not yet migrated, manual checks (screen reader, real device, design review).
9. **Ready for commit?** — only when validation passes, A–B pass, and C–F were verified
   live (or the user confirmed them). Everything is left uncommitted.
