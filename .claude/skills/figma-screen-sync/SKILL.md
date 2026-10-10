---
name: figma-screen-sync
description: Daily Figma → React workflow for product screens. Finds the new or updated screen on the canonical file's Examples / Playground page, classifies its target platform (web, web app, responsive web, mobile app, tablet app, unknown) and implementation intent, audits it in Figma first (tokens, Text Styles, Auto Layout, instances, raw values, Brand A/B, accessibility structure), compares it with the existing components/patterns/examples, proposes a plan and pauses, then implements it in `src/examples/` + Storybook after approval and verifies it at three parity layers. Use for "/figma-screen-sync", "sync my new Figma screen", "sync the latest Figma screen", or "implement the new screen from Figma". Not for building or changing a DS component (use component-production) or for refreshing the Login drift snapshot (use design-audit). Never commits, pushes, opens PRs, or accepts Chromatic baselines.
---

# Figma screen sync

Repeatable workflow for one job: **a new or updated product screen in Figma → an audited
React/Storybook implementation in `src/examples/`**, built for the platform the screen was
designed for. It reuses the principles of the two existing skills rather than restating
them:

- `component-production` — the 3-layer parity gate (Figma authoring → code semantic → live
  rendered), the Figma Raw-Value Guard, the pause points, and the Ready-for-commit rule.
  Read its steps 7, 14 and 16 and its **Ready-for-commit rule** if they aren't in context.
  If this sync turns out to need a new or changed component, stop and hand that part off to
  `component-production`. Don't build components inside this workflow.
- `design-audit` — read-only Figma inspection and honest drift reporting. If the screen is
  Login (`998:9` / `1001:1726`), run `npm run design:audit` in verification.

`CLAUDE.md` overrides anything here. Read its **Canonical Figma Source** table at the start
of every run; don't reuse node IDs from memory or a previous run.

## Hard rules (non-negotiable)

1. **Canonical file only:** `zE07Pl0ioDayHN2GK2set7`. Call `create_session` with that key
   before any other Figma file tool. Load `figma:figma-use` before any `use_figma` call and
   `figma:figma-design-to-code` before `get_design_context`.
2. **Read-only toward Figma until the user approves a Figma change.** Steps 1–6 never
   modify Figma: no rebinding, re-attaching, renaming, or setting a frame's Brand mode to
   "check" it. A `use_figma` call in those steps only reads.
3. **Two mandatory pauses:** after the Figma audit if it found issues (step 4), and after
   the proposal (step 6). Don't start implementing on the strength of the request
   ("sync my screen") alone. The request authorizes discovery, classification, audit and
   proposal only.
4. **Never silently fix or reinterpret the design.** Don't fix a Figma issue in code by
   "doing what was probably meant," and don't redesign the screen. Report it and ask.
5. **Reuse first.** Semantic tokens only in product code (`npm run lint` enforces no Core
   primitives, no `--brand-*`, no raw hex). No speculative tokens, components, props or
   patterns. A piece of UI that appears once is a product composition, not a component.
6. **One code path for every brand.** Never branch on brand, read `data-brand`, or duplicate
   a screen or component per brand.
7. **Stay in scope.** Only touch the files for the screen being synced (plus the docs rows
   that describe it). Don't change other example screens, shared components or tokens
   unless the approved proposal says so.
8. **Don't commit, push, open PRs, or accept Chromatic baselines.** Leave everything
   uncommitted for the user.
9. **Build for the classified platform (step 2), never a guessed one.**
   - Never assume a narrow frame is responsive web. Narrow only means narrow.
   - Mobile app screens never get desktop widths, max-width caps or web breakpoints.
   - Tablet app screens are never treated as desktop web by default.
   - Only web, web app and responsive web screens may use breakpoints (`viewport.*`
     `min-width` queries), and only where the design supports them.
   - Device chrome (status bar, Dynamic Island, home indicator, Android system bars,
     browser chrome) is reference-only. Never build it, unless the user says it's part of
     the product UI.
   - If the platform is unclear, ask one short question before implementation.

## Workflow

### 0. Pre-flight

- `git status --short` and the current branch. Note pre-existing changes so you can tell
  them apart from yours. If on `main`, propose a `feat/...` branch in the step-6 proposal
  (don't create it before approval).
- Read `CLAUDE.md` (Canonical Figma Source table), `docs/patterns/README.md`, and the list of
  `src/examples/*` and `src/patterns/*`.

### 1. Discover the screen

Goal: find the screen without asking the user to describe it.

1. `get_metadata` on the **Examples / Playground** page (`180:11`; re-verify the ID if it
   fails) to list its top-level frames with names and IDs.
2. Compare against the frames already recorded in `CLAUDE.md`'s "Product examples" row and
   the screens in `src/examples/`. A frame is a **candidate** when:
   - it isn't in that row (new), or
   - the user named it, or
   - it's a recorded frame the user says changed. Figma metadata doesn't expose edit dates,
     so "updated" can't be detected reliably on its own. For Login, `npm run design:audit`
     (after a `design-audit` snapshot refresh) can show drift.
   Node IDs grow roughly with creation order, so the highest-ID unrecorded frame is usually
   the newest. That's a tiebreaker hint, not proof.
3. Ignore non-screen frames: doc/annotation frames, the "Brand B preview" section,
   scratch or hidden frames.
4. **Exactly one candidate:** state it (name, node ID, size) and continue. **Several or
   none:** list them with IDs and a `get_screenshot` thumbnail each, and ask which one. This
   is the only reason to ask in this step. A breakpoint pair (e.g. `02` and `02b · Mobile`)
   or a state pair (`01` and `01b · Error`) counts as one screen with variants.

### 2. Classify platform and implementation intent

Before auditing or planning, decide what the screen was designed for. The platform drives
the audit's responsive check (step 3), template reuse (step 5), the layout approach
(steps 6–7) and the viewports verified (step 8).

**Platforms:**

| Platform | Means | Layout consequence |
| --- | --- | --- |
| **Web** | Public or content pages in a browser (marketing, docs, articles). | Page container, `layout.container.maxWidth`; breakpoints if the design has them. |
| **Web app** | Product UI in a browser (sign-in, dashboards, settings), with a single designed width. | Existing web templates (App shell, Centered card layout) and their built-in responsive behavior. No new breakpoints unless the design shows them. |
| **Responsive web** | A web or web app screen designed at more than one breakpoint (e.g. `02 Dashboard` + `02b · Mobile (375)`). Record the base (web / web app) too. | Mobile-first `viewport.*` `min-width` queries, one per designed breakpoint. |
| **Mobile app** | A native phone app screen. | Fluid to the device viewport, with the Figma width as the reference only. No max-width cap, no breakpoints, no desktop layout. |
| **Tablet app** | A native tablet app screen. | Fluid to the tablet viewport, portrait and/or landscape as designed. Not the web App shell and not a desktop layout by default. A content max-width only if Figma shows one. |
| **Unknown** | The signals conflict or are too weak. | Ask (see below). |

**Infer it from the evidence, not from width alone.** Read these signals and weigh them
together:

| Signal | Points to app | Points to web |
| --- | --- | --- |
| Frame dimensions | Phone sizes (≈360–430 × 640–932, e.g. 375×812, 393×852, 402×874, 430×932) or tablet sizes (744×1133, 820×1180, 834×1194, 1024×1366, or landscape) | Desktop widths (1280, 1440, 1920) |
| Device chrome | iOS status bar or Dynamic Island, home indicator, Android status/navigation bar (often remote instances from an OS UI kit) | Browser chrome (URL bar, tabs). No chrome is not evidence for either. |
| Naming | "App", "iOS", "Android", "iPad", "Tablet", a device name | "Web", "Desktop", "Page", or a breakpoint suffix such as `· Mobile (375)` on a sibling of a desktop frame |
| Surrounding examples | A standalone narrow frame with no desktop sibling | A desktop frame plus narrow sibling(s) with the same content means responsive web |
| Layout structure | Full-bleed content, safe-area spacing, actions anchored to the bottom, large titles, 4-column grid | Centered fixed-width container, max-width, sidebars, 12-column grid |
| Responsive behavior | One fixed device size, with Fill sizing inside it | Several breakpoint frames, or a desktop frame whose children reflow |
| Navigation patterns | Bottom tab bar, navigation bar with a back chevron, sheets, modal stacks | Top nav, sidebar or App shell, links to URLs, breadcrumbs, footer |

Current examples, as a reference for calibration (re-verify against `CLAUDE.md`):
- **Web app:** 01 Login / 01b, 03 Settings tabs, 04 Success (1440, no chrome, web templates).
- **Responsive web:** 02 Dashboard + 02b Dashboard · Mobile (375) (web-app base).
- **Mobile app:** Mobile Login `1119:740` (393×852, iOS status bar and home indicator, no
  desktop sibling, cardless full-bleed layout).

**If the platform is unclear** (conflicting signals, or Unknown), ask **one short question**
with your best guess first, e.g. *"Is `1119:740` a mobile app screen or the 375 breakpoint
of a responsive web page? I think mobile app (iOS chrome, no desktop sibling)."* You may ask
it together with the step-4 issue report or the step-6 proposal, so it doesn't add a pause.
Never implement before it's answered.

**Implementation intent is recorded separately from design intent.** The platform says
what the design targets; it doesn't decide what gets built now. Record all three:

- **Design target:** the classified platform (e.g. Mobile app).
- **Current implementation:** what this skill builds. In this repo that's always a
  **React/Storybook reference** in `src/examples/`, including for app screens.
- **Future implementation:** the intended production stack if known (e.g. React Native,
  SwiftUI, Compose, or the same React web app). Otherwise "not decided". Native outputs
  are deferred in `CLAUDE.md`. Don't build anything native and don't add native tokens.
  Do note anything in the reference that won't translate (e.g. hover-only affordances,
  web-only semantics) so the future build doesn't copy it blindly.

### 3. Audit Figma first (read-only)

Inspect the actual nodes, never a screenshot alone. Use `get_screenshot` for the overall
picture, `get_design_context` for structure, `get_variable_defs` for the bound variables,
and read-only `use_figma` for what those don't expose (`boundVariables`, `textStyleId`,
`fillStyleId`/`effectStyleId`, `layoutMode`/`itemSpacing`/padding/`layoutSizing*`,
`mainComponent` and `componentProperties` on instances, `explicitVariableModes`). Walk the
whole tree, including instance overrides.

Check every category and record findings with node ID and name:

| Category | What to check |
| --- | --- |
| Tokens | Every color, spacing, radius, border width, elevation, icon size bound to a **Semantic** variable. Flag bindings to `Core` or `Brand` collections directly, and raw (unbound) values. Apply component-production's Raw-Value Guard: a raw value that matches a token numerically is still a finding. |
| Wrong semantic token | Bound, but to the wrong role (e.g. `text/secondary` on a heading, `border/subtle` where siblings use `border/default`). Compare with how the same role appears on the existing example screens and in `docs/foundations/`. |
| Typography | Text nodes use a DS Text Style (`textStyleId` set), not raw font/size/line-height. |
| Auto Layout | Frames use Auto Layout; spacing comes from `itemSpacing`/padding bound to spacing variables, not absolute positioning or spacer rectangles; hug/fill/fixed sizing matches the intent. Device chrome laid out absolutely on an app frame is expected, not a finding. |
| Instances | Every DS-looking element is an instance of the canonical component set (see `CLAUDE.md` table), with a valid variant combination and properties set through the exposed properties, not detached or overridden into a different look. Flag **detached instances** (frames named like DS components, or groups that replicate one) and instances of local copies or other files. Remote OS-kit chrome instances are reference-only, not findings. |
| Property setup | Variant/property values that contradict each other or the content (e.g. `State=Disabled` with an enabled-looking override, an icon boolean on but no icon, Card content placed outside its `Content` slot). |
| Responsive / platform intent | Checked against the step-2 platform. **Web / web app / responsive web:** breakpoint frames, Fill vs fixed widths, max-widths, and what reflows or hides between them. With only one width, mobile behavior follows the existing templates; say so in the proposal. **Mobile / tablet app:** Fill sizing inside the device frame (so it stays fluid), safe-area spacing, portrait/landscape frames for tablet. Flag anything that contradicts the platform, e.g. a desktop-style fixed container inside an app frame. |
| Brand A / B | Nothing pins the frame to one brand (`explicitVariableModes` on the Brand collection only belongs on the "Brand B preview" section). No brand-specific values (primary hex, brand font, brand radius) written as raw values that would break in the other brand. No elements that exist only for one brand. |
| Accessibility structure | Heading levels/order, a single page `h1`, every input has a visible label, error/help text placement, icon-only controls, text contrast of any non-token color, logical reading order matching layer order, focus order implied by layout. For app platforms, also touch-target size (WCAG 2.5.8 minimum 24×24; platform guidance 44pt iOS / 48dp Android). |

Then classify every meaningful piece of UI into one of:

- **Existing component** — maps to a component in `src/components/` (name it and its props).
- **Existing pattern/template** — matches something in `src/patterns/` / `docs/patterns/`.
  The current templates (App shell, Centered card layout) are **web** templates. Don't apply
  them to an app screen just because the content looks similar.
- **Product composition** — screen-specific layout of the above. This is the default.
- **Missing component candidate** — only when it is reusable *and* not expressible with
  existing components/patterns *and* there's evidence of repetition (it appears in more
  than one screen, or the user says it will). Something that appears once is a product
  composition, even if it looks component-shaped.
- **Device chrome** — reference-only, not built (hard rule 9).

### 4. Stop on Figma issues

If step 3 found any of: raw values where a token exists, a wrong semantic token, a
detached instance that should be a real one, an invalid property setup, missing
bindings/Text Styles, inconsistent Brand A/B structure, or layout that contradicts the
classified platform, **stop here.** Report:

- each issue: node name + ID, what's there, what the system expects (candidate token /
  component / variant), and a recommendation (fix in Figma, or intentional and why it might
  be);
- whether it blocks implementation or could be implemented around once decided.

Then ask the user how to proceed (for example: they fix Figma and you re-audit; you fix it
in Figma with their approval; or it's intentional and documented). Don't fix anything,
including "obvious" one-liners, and don't implement code against the faulty values.

If the audit is clean, say so in one line and continue.

### 5. Compare with the repo

Read before deciding:

- the existing `src/examples/*` screens (they are the house style for screen code,
  stories and CSS), and any example the new screen resembles, preferring examples of
  the **same platform**;
- the `src/components/*` and `src/patterns/*` used in the classification, including
  their props and stories, to confirm the needed variant/state is already supported;
- `docs/design-to-code-mappings.md` for each component involved;
- `src/tokens/semantic/*.json` for every Figma variable found, to confirm the matching
  semantic token exists;
- `docs/foundations/responsive.md` for any web platform that will use breakpoints.

Decide:

- **Reuse:** which components and patterns cover the screen as-is, for this platform.
- **API change:** only if the screen genuinely can't be built with the current API. A
  needed API change is a component change and goes through `component-production`, not
  this skill. Say so in the proposal.
- **New token:** only if Figma is bound to a semantic variable that has no code
  counterpart (a sync gap to report) or a real new semantic role exists across more than
  this screen. Otherwise none. A screen-specific layout value with no semantic role
  (e.g. a max-width on a web screen) is a screen-local CSS value with a short comment,
  matching how the existing examples do it. Never add a platform-specific token (e.g. a
  safe-area or device-width token) for one screen.

### 6. Propose, then pause

Report concisely, then **stop and wait for approval**:

1. **Screen detected** — name, node ID(s), breakpoints/states included.
2. **Platform and intent** — design target (with the deciding signals), current
   implementation, future implementation. Include the one platform question here if
   it's still open.
3. **Figma issues** — "none" or the resolved list from step 4.
4. **Reuse** — components (with props/variants) and patterns/templates.
5. **Genuinely missing** — component/API/token gaps with justification, or "nothing".
6. **Layout / responsive approach**, per platform:
   - **Web / web app:** templates' built-in behavior, container cap.
   - **Responsive web:** which `viewport.*` breakpoints map to which frames.
   - **Mobile / tablet app:** fluid to the viewport, with the reference size and the
     viewport range to verify. No caps, no breakpoints.
7. **Accessibility** — landmarks, heading structure, labels, form semantics, live/error
   messaging, keyboard/focus order, touch targets for app platforms.
8. **Brand A/B** — confirmation that it is semantic-token only and anything to watch in
   Brand B (radius, font metrics, longer text, primary contrast).
9. **Files expected to change** — exact paths, new vs modified.

Typical file set for a new screen, following the existing examples:
`src/examples/<Screen>/{<Screen>Screen.tsx,<Screen>Screen.css,<Screen>Screen.stories.tsx,index.ts}`,
plus the `CLAUDE.md` "Product examples" row (new frame ID, platform). Add a
`docs/design-to-code-mappings.md` entry only if the existing examples have one.

### 7. Implement (after approval only)

- Implement exactly the approved plan. If something new comes up mid-implementation that
  changes the plan (a missing prop, a token gap, a Figma ambiguity), stop and ask; don't
  widen the scope silently.
- Match the existing examples: file layout, naming, `ds-example-<screen>__<element>` class
  names, a header comment saying it's an example composition (and its platform), story
  `title` (`Examples/<Screen>`), `layout: 'fullscreen'`, a docs description naming the
  Figma frame(s) it matches and the platform, and one story per meaningful
  state/breakpoint the Figma frames show.
- **Platform-specific layout:**
  - **Web / web app:** reuse the web templates. Use `layout.container.maxWidth` or a
    documented screen-local cap only where Figma shows one.
  - **Responsive web:** mobile-first CSS with `@media (min-width: …)` on `viewport.*`
    values, one per designed breakpoint. Add a fixed-width story per extra breakpoint
    using the nested-`<iframe>` technique from `Examples/Dashboard` → Mobile (a wrapper
    `<div>` doesn't trigger `@media`).
  - **Mobile app:** fill the viewport (`min-height: 100dvh` with a `100vh` fallback, full
    width). No `max-width`, no `@media` breakpoints, no desktop layout. Add a
    "Reference (<w>px)" story that renders the screen in an `<iframe>` at the Figma
    frame's size, forwarding the brand global (precedent: `Examples/Mobile Login`).
  - **Tablet app:** same as mobile app, at the tablet reference size(s). Add a story per
    designed orientation. No web App shell or desktop layout unless the design shows it.
  - Don't build device chrome. Don't add safe-area handling unless Figma specifies it;
    if it seems needed, mention it as a remaining difference instead.
- CSS uses semantic custom properties only (`var(--color-…)`, `var(--space-…)`, the
  `--text-*` typography roles from `css/typography.css`). No Core primitives, no
  `--brand-*`, no hex. Prefer the components' own typography over restyling text.
  `viewport.*` primitives are allowed only inside `@media` queries for web platforms
  (per `docs/foundations/responsive.md`).
- Real semantics: `<main>`, `<header>`, `<nav>`, `<form>`, headings in order, labels via the
  components' props. No ARIA where a native element covers it.
- Never hand-edit `src/tokens/build/`. If a token change was approved, edit the source JSON
  and run `npm run tokens:build`.
- Update the `CLAUDE.md` "Product examples" row with the new frame ID, its platform, and
  today's date.

### 8. Verify

**Build validation**, in order, and report pass/fail per command with any error output:

```
npm run tokens:build
npm run typecheck
npm run lint
npm run build
npm run build-storybook
```

Also run `npm run format:check` on the changed files, and `npm run design:audit` if the
screen is Login.

Then the three parity layers (component-production's gate, applied to a screen):

- **A. Figma authoring parity.** The Figma-side findings from step 3 are resolved (or
  explicitly accepted by the user). If Figma changed during the session, re-read the
  bindings; don't assume.
- **B. Code/token semantic parity.** A table, per element and category (color, typography,
  spacing, radius, border, elevation, icon size, layout/responsive): Figma variable →
  token source → generated CSS custom property → the CSS rule/prop in the screen. Every row
  must be an exact match, a component-owned value, or a documented screen-local layout
  value. No "close enough" substitutions.
- **C. Live Storybook/browser verification.** Start Storybook (`npm run storybook`, in the
  background) and use the `claude-in-chrome` skill. Open the story's iframe
  (`http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`, adding
  `&globals=brand:brand-b` for Brand B) and check:
  - the viewports for the classified platform:
    - **Web / web app:** desktop (1440) plus the narrow behavior the templates give
      (375).
    - **Responsive web:** each designed breakpoint, plus just below and just above each
      `viewport.*` threshold.
    - **Mobile app:** the Figma reference size, plus the smallest and largest supported
      phone widths (320 and 430). No desktop check: wide-screen rendering is out of scope.
    - **Tablet app:** the reference size in each designed orientation, plus the
      smallest/largest tablet widths (744 and 1024/1366).
    - In every case, no horizontal overflow.
  - Brand A and Brand B (nothing breaks, clips or loses contrast; radius/font change only
    through tokens);
  - interactive states the screen has: hover, focus-visible (keyboard Tab through the
    page, check the order), disabled, error/validation, tab switching, form submit/cancel;
  - console errors and warnings (`read_console_messages`);
  - accessibility basics: the Storybook a11y panel / addon results, one `h1`, labelled
    controls, visible focus, and touch-target sizes for app platforms. Scope DOM queries
    to `#storybook-root`, because Storybook's iframe has its own hidden `h1`s.
  - a side-by-side against `get_screenshot` of the Figma frame(s), ignoring device
    chrome.
  Describe what was actually exercised and observed. If no browser is available, don't
  claim live parity. List what still needs checking and end the report with
  component-production's verbatim line: **"Ready for manual visual review, not ready for
  commit yet."**

Stop Storybook when finished.

### 9. Report

1. **Figma screen implemented** — frame name(s) and node ID(s).
2. **Platform and intent** — design target, current implementation, future
   implementation.
3. **Files changed** — exact paths, created vs modified (cross-check with `git status`).
4. **Reused** — components and patterns.
5. **New component/token/API** — each with justification, or "none".
6. **Parity** — A (Figma authoring), B (the semantic parity table), C (what was exercised
   live, per brand and viewport).
7. **Validation** — pass/fail per command.
8. **Remaining differences/blockers** — intentional differences, unresolved Figma issues,
   things that won't translate to the future implementation, manual checks still needed
   (e.g. screen-reader pass, real-device check, design review).
9. **Ready for commit?** — per component-production's Ready-for-commit rule. Everything is
   left uncommitted for the user; no commit, push, PR, or Chromatic baseline acceptance.
