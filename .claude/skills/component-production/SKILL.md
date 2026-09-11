---
name: component-production
description: Production workflow for creating or updating a design-system component (Figma + React + Storybook + docs + governance), following the patterns established by Button, Input, and Checkbox. Use when asked to build a new component, extend an existing one, or bring one toward "stable". Automates repetitive implementation steps; pauses for human review on real architectural decisions.
---

# Component Production

This skill runs the repeatable production pipeline this repo already used for `Button`,
`Input`, and `Checkbox`: Figma architecture → React implementation → Storybook coverage →
docs → mapping → accessibility → validation → audit report. It automates the mechanical
parts of that pipeline. It does not automate design-system judgment calls — see
**Pause points** below, which are non-negotiable.

Read `CLAUDE.md` first if it isn't already in context. It is the top-level source of
truth for this repo's structure and conventions and overrides anything here if they
conflict.

## Pause points (do not decide these silently)

Stop and report back to the user — in plain terms, with the options and a recommendation
— rather than proceeding, whenever any of the following is unclear or has more than one
reasonable answer:

- The public component API (prop names, types, defaults).
- The component's state model (what's a prop vs. derived vs. native browser state).
- Accessibility semantics (which native element/role/ARIA pattern applies).
- Whether a new token is actually needed, vs. reusing an existing one or using a
  component-owned constant.
- Whether variants/nesting are necessary in Figma, vs. a flatter structure.
- Whether a piece of behavior belongs inside the component vs. composed externally by
  the consumer.
- Whether Figma and code should intentionally diverge for this component.

Do not invent an answer just to keep moving. A wrong guess here is expensive to unwind
later (breaking API change, Figma rework, a token that now has consumers). When in doubt,
present the tradeoff and stop — don't pick silently and mention it only in the final
report.

## Canonical Figma file

`CLAUDE.md`'s **Canonical Figma Source** section is the source of truth for which Figma
file to target and for any known page/component-set node IDs (Button, Checkbox, etc.) —
read it at the start of this workflow rather than assuming or reusing IDs from a previous
run of this skill. Never create or use a different file, and never duplicate a component
into another file.

If `CLAUDE.md` is missing a node reference this task needs (e.g. a component whose Figma
page hasn't been located yet), look it up via the Figma MCP tools, then update
`CLAUDE.md`'s table with what was found (or report that it couldn't be reliably located,
per **Pause points**) — don't just note it inline in this skill's own output and let
`CLAUDE.md` go stale again.

Load `figma-use`/`figma-design-to-code` skills as needed for the specific Figma
operation, and inspect the target page/component before making any change to it.

## The 14-step workflow

### 1. Inspect existing system

Read, don't assume:

- `src/components/Button/`, `src/components/Input/`, `src/components/Checkbox/` (full
  `.tsx`, `.css`, `.stories.tsx`) — the only implemented reference components.
- `docs/design-to-code-mappings.md` — the authoritative record of Figma architecture and
  prop mapping for each shipped component. This is denser and more current than any
  single component file; always read the relevant section before starting.
- `docs/foundations/*.md` for any foundation the new component touches (icons, spacing,
  typography, color, radius, elevation, motion).
- `governance/component-lifecycle.md`, `governance/accessibility.md`,
  `governance/versioning.md`, and any `governance/decisions/*.md` ADR relevant to the
  token categories involved.
- `src/tokens/{primitive,semantic}/*.json` for the actual current token values (never
  trust a doc's numbers over the token source).

### 2. Identify closest reference component

Do not design from scratch. Map the request to the nearest existing pattern and state the
mapping explicitly before proceeding:

| New component | Reference | Why |
| --- | --- | --- |
| Radio | Checkbox | Same selection-control shape: native input, label association, flat variant set, no nested Content layer. |
| Textarea | Input | Same field shell: label, support text, error state, sizes. |
| Select | Input + existing interaction patterns | Field shell reused; selection/listbox behavior is new and must be called out as new, not inherited. |
| Icon Button | Button + Icon foundation | Reuses Button's variant/size/state/token structure; accessible name handling is new (icon-only → requires `aria-label`, not `children`). |
| Anything else | Whichever shipped component shares the most structural similarity (field vs. control vs. action) | State the reasoning, don't just assert it. |

If nothing is genuinely close, say so — that itself is a pause point ("this introduces a
new component shape, not a variation of an existing one").

### 3. Define component contract

Before writing any code, write down (and get alignment on, per **Pause points**):

- Public props: name, type, default, and whether it's real state vs. derived vs. passed
  straight through to the native element.
- Which native HTML element this wraps, and which native attributes pass through
  unmodified (`...rest` spread) vs. are intentionally restricted (e.g. Checkbox omits
  `type` via `Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>`; Input omits the
  native `size` attribute to reclaim that prop name for the design-system size).
- What is explicitly **not** a prop because it's already native/CSS behavior — this repo
  consistently keeps Hover/Pressed/Focus-visible out of the API (native `:hover`,
  `:active`, `:focus-visible`), keeps Disabled as the native `disabled` attribute (never
  a bespoke `aria-disabled` unless a pause-point discussion decides otherwise), and
  derives icon-adjacent layout from `Boolean(leadingIcon)`/`Boolean(trailingIcon)` rather
  than exposing an `iconLayout` prop.

### 4. Audit token needs

Follow `primitive → semantic → component usage`:

- Use an existing semantic token first. Check `src/tokens/semantic/*.json` before
  assuming something is missing.
- Do not hardcode a value when an appropriate semantic token exists.
- Do not create a speculative token "just in case." A component-owned constant is
  acceptable where no foundation token is justified — this repo's established precedent
  is fixed control heights (32/40/48px) and fixed control sizes (Checkbox's 16×16 box,
  24×24 hit area), which are documented as intentionally *not* tokenized.
- If a new token genuinely seems needed, stop and report: what it is, why no existing
  token covers it, and the blast radius (which other components/tokens reference the
  same primitive, what breaks or needs review if this is added). This is a pause point,
  not something to add silently.
- If a token gap is discovered but doesn't block the task (e.g. no dedicated `active`
  token for a variant, matching the documented gaps for Button's Secondary/Tertiary/
  Danger), report the gap and follow the established precedent (reuse Hover) rather than
  inventing a new token to fill it.

### 5. Define Figma architecture

Before building anything in Figma, define and write down:

- Anatomy (what visual parts exist).
- Variants (which axes are genuinely orthogonal vs. which can be derived/composed).
- States (map to native CSS states where possible — see step 3).
- Sizes.
- Component properties (what a designer can actually set per instance).
- Optional content (icons, labels, support text) and how "shown/hidden" is decided.
- Resizing behavior (Auto Layout fill/hug rules).

Decide flat vs. nested using the established precedent, not a default preference:

- **Flat component set** when the state model is simple and there's no orthogonal
  combinatorial concern to factor out (Checkbox: Selection × Interaction, 12 variants,
  no nested Content).
- **Nested (outer + Content)** only when an axis like icon layout would otherwise
  multiply every other axis (Button: Variant × Size × State outer, with a separate
  Size × Icon Layout × Tone Content component nested inside — this replaced an earlier
  flat 288-variant approach that was explicitly rejected as unmaintainable).

Avoid unnecessary variant explosion — if a flat set would stay under roughly Checkbox's
scale (~12 variants), prefer flat; if crossing an icon-layout-shaped axis would multiply
an outer set past Button's original 288-variant problem, nest.

This step ends with an explicit "flat vs. nested, and why" statement — a pause point if
it's not obviously covered by an existing precedent.

### 6. Build/update Figma

Load the `figma-use` skill (mandatory before any `use_figma` call) and, if generating a
larger composed view, `figma-generate-library`/`figma-generate-design` as appropriate.

- Inspect the existing Button/Input/Checkbox component sets in the canonical file first
  for naming and structure conventions before adding anything new.
- Preserve: Auto Layout, semantic token bindings (bind to variables, never hardcode a
  resolved color/spacing value on a new node), predictable resizing, component
  properties, and accessibility-relevant visual states (focus ring, disabled treatment).
- If using a nested Content instance, name it `content` exactly — this is load-bearing
  for override preservation across variant switches (see the Button section of
  `docs/design-to-code-mappings.md` for what breaks if this is skipped), and re-assert
  the name after any scripted `setProperties()`/`removeOverrides()` call, since both can
  silently revert it.
- Build the documentation using the established template: **Main Component Frame** plus
  **independent documentation frames**, using the reusable Documentation Header, muted
  secondary descriptions, specimen containers, and Do/Don't cards where useful. Include
  only the sections that are actually relevant to this component — typically a subset of
  Anatomy, Variants/Selection, Sizes, Interaction States, Content, Usage Guidance,
  Accessibility, Token Mapping, Figma ↔ Code, Cross-platform Notes, Implementation Notes.
  Don't pad with empty sections.

### 7. Build/update React implementation

TypeScript, matching the exact conventions all three shipped components follow:

- `forwardRef` to the underlying native element; set `.displayName`.
- Extend the relevant native `*HTMLAttributes<...>` type and spread `...rest` onto the
  native element so untyped/less-common native attributes still pass through. Only
  `Omit` a native attribute when it genuinely collides with a design-system prop name
  (document why, inline, the way `Input.tsx` and `Checkbox.tsx` do).
- Native HTML semantics first — real `<button>`, `<input>`, `<label>` — never a styled
  `<div>` standing in for an interactive control.
- Derive layout/state from prop presence rather than adding a redundant boolean prop
  (e.g. `hasLeadingIcon = Boolean(leadingIcon)`, not a separate `hasIcon` prop).
- Icon slots stay provider-neutral (`ReactNode`), never importing `lucide-react` or
  `Icon` directly inside a reusable component, unless the component owns one specific
  semantic icon itself (Checkbox's internal check/dash SVG marks are the precedent for
  that exception — owned, not provider-swappable, and documented as such).
- Hover/Pressed/Focus-visible stay CSS-only (`:hover`, `:active`, `:focus-visible`);
  Disabled stays the native `disabled` attribute/`:disabled` pseudo-class.
- `useId()` for generated ids (label association, `aria-describedby` targets), always
  deferring to a caller-supplied `id` when present.
- Avoid abstractions the task doesn't need — no speculative variant props, no generic
  "config object" props, no premature composition helpers.
- CSS: reuse existing semantic tokens as CSS custom properties (matching the
  `var(--token-name)` pattern in `Button.css`/`Input.css`/`Checkbox.css`); reduced-motion
  handling belongs in `src/tokens/build/css/motion-reduced-motion.css`'s pattern if the
  component animates anything non-essential.
- File layout: `src/components/<ComponentName>/{<ComponentName>.tsx,.css,.stories.tsx,index.ts}`,
  exported from `src/index.ts`.

### 8. Build Storybook coverage

Match the structure established in `Checkbox.stories.tsx` (and Button's/Input's
equivalents):

- `title: 'Components/<Name>'`, `component`, `argTypes` for every real prop,
  `parameters.docs.description.component` summarizing the V1 contract in the same voice
  as the existing three.
- A `Playground` story with live controls (wrap in local state where the component is
  interactive/controlled, per the `Checkbox` `Playground` pattern — remount on relevant
  arg changes so it stays a real, clickable control rather than a static one).
- Stories per: variant/selection, size, interaction state (calling out which are
  hover/focus-visible-only and must be exercised manually, not simulated), content
  combinations (with/without icon, with/without label), disabled, error/validation (if
  applicable), loading (if applicable), wrapping/resizing (e.g. long label), keyboard/
  focus, and any real edge case surfaced during implementation.
- Storybook-only controls (e.g. a story-local toggle used purely to demo a state) must
  never leak into the component's actual public API.

### 9. Update documentation

- Add/update the component's entry under `docs/foundations/` only if it introduces or
  changes a foundation-level concept (rare for a component; most component docs live in
  the mapping file and Storybook, not `docs/foundations/`).
- If the component reaches "Stable" per `governance/component-lifecycle.md`, note that
  explicitly in the report — do not silently promote it; promotion criteria (accessibility
  checklist passed and manually verified, mapping recorded, no open API-breaking issues,
  reviewed by another maintainer) require human confirmation.

### 10. Update Figma ↔ code mapping

Update `docs/design-to-code-mappings.md` by hand — there is no automated sync
(deliberately; see ADR 0001). Follow the exact structure Button/Input/Checkbox already
use for their sections:

- Add a row to the top-level table (Figma component, Figma link, React component, notes).
- Add a full subsection: Figma architecture (flat or nested, variant axes, counts, what
  each layer owns), Prop mapping table (Figma property → React prop → notes, explicitly
  marking **not a prop** where a Figma axis has no code equivalent, and why), Size parity
  table if applicable, Color tokens by state table, a Token gaps subsection if any exist,
  an Accessibility subsection (implemented-and-spot-checked, never claimed as a
  certified audit), and a Cross-platform contract subsection (see step 11).
- Clearly distinguish: Figma authoring properties, Figma-internal-only properties (never
  designer-facing), the React public API, and native/CSS-derived states. Do not force a
  1:1 mapping where the platforms genuinely differ — document the difference and why,
  the way Button's Focus-visible implementation difference is documented.
- Only add a row when the component is actually implemented, not when merely proposed
  (per the file's own guideline).

### 11. Document the cross-platform contract

Add a subsection (matching Checkbox's "Cross-platform contract" section) describing what
should be shared across future Web React / React Native / SwiftUI / Jetpack Compose
implementations: intent, state model, hierarchy, tokens, and the accessibility contract.
Do not claim shared implementation code — only Web React exists today. Call out anything
platform-owned (exact focus/ripple/press treatment, platform-native interaction-target
sizing) explicitly as platform-owned, not shared.

### 12. Run accessibility checks

Evaluate against `governance/accessibility.md`'s checklist for every component:

- Correct native semantic element.
- Keyboard interaction and logical tab order.
- Visible `:focus-visible` indicator.
- Accessible name (and what supplies it — visible label, `aria-label`, etc.).
- Disabled behavior (native attribute, removed from tab order).
- ARIA only where a native semantic doesn't already cover it.
- Labels/descriptions correctly associated (`htmlFor`/`id`, `aria-describedby`).
- State announcement (e.g. `aria-invalid`, `aria-busy`, native `:indeterminate` —
  prefer a real native/DOM state over a synthesized ARIA one when both exist, matching
  Checkbox's choice to rely on native indeterminate semantics rather than
  `aria-checked="mixed"`).
- Hit target size where relevant (Checkbox's 24×24 minimum hit area over a 16×16 visual
  box is the established pattern for small controls).

`eslint-plugin-jsx-a11y` and `@storybook/addon-a11y` are the automated first pass, not
the whole check — run them, but do not claim WCAG 2.2 AA conformance from automated
results alone. Explicitly list what still needs manual verification (screen-reader
spot-check, 200% zoom/reflow, full AA sweep) rather than omitting it.

### 13. Run validation

Run whatever applies to the change:

```
npm run tokens:build
npm run typecheck
npm run lint
npm run build
npm run build-storybook
```

Only run tests if an established test runner actually exists in the repo at the time
(none does as of this skill's writing — Vitest/Testing Library are deferred per ADR
0001; don't invent a test command). Report every command's pass/fail, not just a summary.

### 14. Produce final audit report, then stop

Do not run `git add`/`git commit`/`git push`. End the turn after the report below and
let the user review and commit.

## Final report format

Always end with a report structured exactly as:

1. **Component architecture** — flat vs. nested, reference component used, key
   structural decisions.
2. **Files changed** — full list, grouped by Figma (nodes/components touched) and code
   (created/modified files).
3. **Token usage** — which existing tokens were consumed, by category.
4. **New tokens/constants** — any new token or component-owned constant added, with
   justification; "none" if none.
5. **Figma changes** — what was built/changed, node/component names, documentation
   frames added.
6. **Public API** — the final prop table.
7. **Storybook coverage** — list of stories added/updated.
8. **Accessibility findings** — checklist results plus anything still requiring manual
   verification.
9. **Figma ↔ code mapping** — confirmation `docs/design-to-code-mappings.md` was updated,
   with a link to the new/changed section.
10. **Intentional platform differences** — anything where Figma and code, or web vs.
    other platforms, deliberately diverge.
11. **Validation results** — pass/fail per command from step 13.
12. **Manual checks still required** — anything a human still needs to do (screen-reader
    testing, design review, etc.).
13. **Ready for commit?** — a direct yes/no, with reasons if no.

## Quality bar

Optimize for production maintainability, consistency with the existing system,
accessibility, scalability, cross-platform readiness, and minimal unnecessary complexity
— not for speed. This skill exists to make repeated component production faster without
skipping any of the real design-system practice above. If a step in this workflow would
be skipped to go faster, that is itself a pause point, not a shortcut to take silently.
