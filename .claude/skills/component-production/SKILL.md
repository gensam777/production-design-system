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

## The 3-layer Figma ↔ code parity gate (mandatory, non-negotiable)

A component is not "done" because it looks right in a screenshot and the build passes.
This repo has hit real bugs at every one of the following layers — a Figma text node
bound to nothing but numerically close to the right value (Card), and a CSS technique
that passed static review twice but still leaked visible content in a live browser
(Accordion). Each layer catches a different failure mode; skipping any one of them
because an earlier layer looked clean is itself the mistake that let those bugs through.

| Layer | Checks | Workflow step | Blocks |
| --- | --- | --- | --- |
| 1. Figma authoring parity | Is the *Figma* component itself actually token-bound, not just numerically close? | Step 7 | Starting React implementation |
| 2. Code semantic parity | Does *code* reference the exact same token Figma is bound to — not an approximation? | Step 14 | "Ready for commit" |
| 3. Live rendered parity | Does the component *actually render/behave* correctly in a running browser — not just in source? | Step 16 | "Ready for commit" |

No component may be reported "ready for commit" until all three layers pass. See the
**Ready-for-commit rule** at the end of this document for the exact conditions and the
required fallback phrasing when Layer 3 can't be completed.

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
- Whether a raw (unbound) Figma value represents an intentional design decision or an
  authoring gap where an existing semantic token should have been used instead — see the
  **Figma Raw-Value Guard** in step 7. Do not silently treat a raw Figma value as
  canonical just because it renders correctly today.

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

## The 17-step workflow

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

### 7. Figma authoring parity gate — Layer 1 (mandatory — blocks step 8)

**Do not start React implementation until this gate passes.** A screenshot that looks
numerically close to the right typography, color, or spacing is not the same as the
Figma node actually being bound to the token that produces that value — Card's title/
body text rendered at a size that looked plausible while its `textStyleId` was empty the
whole time, with only the fill color actually bound. Catching that requires inspecting
the live node's real bindings, not eyeballing the canvas.

Using the Figma MCP tools (`get_variable_defs`, or `use_figma` reading
`node.textStyleId` / `node.boundVariables` / `node.fills` / `node.strokes` /
`node.effects` / `node.fontName` directly — never inferred from a screenshot or a Figma
doc-page description), verify on the actual built component:

- **Typography** uses the intended Text Style, or the individual typography variables
  are bound — not a raw `fontSize`/`fontName`/`lineHeight`/`letterSpacing` literal.
- **Colors** are bound to semantic color variables wherever a semantic role applies.
- **Spacing** (padding, gaps/`itemSpacing`) is bound to semantic spacing variables.
- **Radius, elevation (Effect Style), icon size, motion, and layout** values are bound
  wherever a semantic token exists for that role.
- No accidental raw value exists where the design system already has a semantic token
  for that exact role. A value that happens to numerically match a token's resolved
  output is not the same as being bound to it — it drifts silently the next time the
  token changes, invisibly, until a rebrand or a second consumer surfaces it.
- Component properties/variants are exactly the ones planned in step 5 — no missing or
  extra axis.
- Auto Layout / resizing behaves as intended (hug/fill on the right nodes, no
  accidentally-fixed width/height where the plan called for flexible).
- Every planned state (hover, focus-visible, disabled, error, selected, expanded, etc.)
  has a complete, correctly-bound visual — not just the default state.

**Figma Raw-Value Guard.** If a Figma text/color/spacing/radius/effect/etc. value is raw
(unbound — checked via `textStyleId`/`boundVariables`, never via appearance) but an
existing design-system token appears to represent the same semantic role:

- **Flag it.** Do not silently treat the raw value as canonical just because it renders
  correctly today (see the Pause points entry for this).
- **Compare it against the established foundation** — how the same role is used
  elsewhere in the system (another shipped component, the relevant
  `docs/foundations/*.md` page) — to find the token that should apply.
- **Pause and report before writing any code.** Present the raw value, the candidate
  token, and a recommendation for whether Figma is the outlier (fix the binding) or the
  raw value is genuinely intentional (document why, the same way a component-owned
  constant is documented in step 4).
- This is the same resolution question step 14's parity audit asks — this guard just
  asks it a full step earlier, before an unbound Figma value has a chance to be
  faithfully "matched" into code as if it were correct.

### 8. Build/update React implementation

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

### 9. Build Storybook coverage

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

### 10. Update documentation

- Add/update the component's entry under `docs/foundations/` only if it introduces or
  changes a foundation-level concept (rare for a component; most component docs live in
  the mapping file and Storybook, not `docs/foundations/`).
- If the component reaches "Stable" per `governance/component-lifecycle.md`, note that
  explicitly in the report — do not silently promote it; promotion criteria (accessibility
  checklist passed and manually verified, mapping recorded, no open API-breaking issues,
  reviewed by another maintainer) require human confirmation.

### 11. Update Figma ↔ code mapping

Update `docs/design-to-code-mappings.md` by hand — there is no automated sync
(deliberately; see ADR 0001). Follow the exact structure Button/Input/Checkbox already
use for their sections:

- Add a row to the top-level table (Figma component, Figma link, React component, notes).
- Add a full subsection: Figma architecture (flat or nested, variant axes, counts, what
  each layer owns), Prop mapping table (Figma property → React prop → notes, explicitly
  marking **not a prop** where a Figma axis has no code equivalent, and why), Size parity
  table if applicable, Color tokens by state table, a Token gaps subsection if any exist,
  an Accessibility subsection (implemented-and-spot-checked, never claimed as a
  certified audit), and a Cross-platform contract subsection (see step 12).
- Clearly distinguish: Figma authoring properties, Figma-internal-only properties (never
  designer-facing), the React public API, and native/CSS-derived states. Do not force a
  1:1 mapping where the platforms genuinely differ — document the difference and why,
  the way Button's Focus-visible implementation difference is documented.
- Only add a row when the component is actually implemented, not when merely proposed
  (per the file's own guideline).
- If step 7 or step 16 surfaced a real bug fix (a Figma raw-value correction, a runtime
  rendering bug), document it honestly here — including a superseded first attempt, if
  one happened (see Accordion's two-pass collapse-technique history for the precedent).
  Never quietly overwrite a wrong prior claim without a record of what changed and why.

### 12. Document the cross-platform contract

Add a subsection (matching Checkbox's "Cross-platform contract" section) describing what
should be shared across future Web React / React Native / SwiftUI / Jetpack Compose
implementations: intent, state model, hierarchy, tokens, and the accessibility contract.
Do not claim shared implementation code — only Web React exists today. Call out anything
platform-owned (exact focus/ripple/press treatment, platform-native interaction-target
sizing) explicitly as platform-owned, not shared.

### 13. Run accessibility checks

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
- Landmark roles (e.g. `role="region"`) are added only where a specific piece of content
  genuinely warrants one — never applied by default to every instance of a repeating
  pattern (e.g. every panel in an Accordion), which creates landmark noise for
  screen-reader users navigating by landmark instead of helping them.

`eslint-plugin-jsx-a11y` and `@storybook/addon-a11y` are the automated first pass, not
the whole check — run them, but do not claim WCAG 2.2 AA conformance from automated
results alone. Explicitly list what still needs manual verification (screen-reader
spot-check, 200% zoom/reflow, full AA sweep) rather than omitting it.

### 14. Code semantic parity audit — Layer 2 (mandatory — blocks "ready for commit")

A component is **not** ready for commit just because it looks right and the build passes.
Every Figma-bound property must resolve to the *exact same* generated token in code — not
a nearby one, not an approximation. This is Layer 2 of the 3-layer parity gate: Layer 1
(step 7) already confirmed the Figma side itself is properly token-bound; this layer
confirms code reproduces those exact bindings. It is required for every component this
skill touches, not just ones where a visual bug was reported. Skipping it (or doing it
only when something already looks broken) is itself a violation of this rule — token
drift is often invisible until a rebrand, a dark-mode pass, or a second consumer surfaces
it, which is exactly why it can't be optional.

**Required parity flow, for every bound property:**

```
Figma semantic token → token source (src/tokens/{primitive,semantic}/*.json)
                     → generated platform token (src/tokens/build/**, e.g. a CSS custom
                       property or the JS token export)
                     → component implementation (the actual property/class/style rule)
```

**Scope — audit every category that applies to the component, not just the one that
prompted the task:** color, typography, spacing, radius, border, focus, icon size,
motion, elevation/shadow, layout, and responsive values where applicable. A component
that only visibly uses color and spacing can still have a silent typography or motion
mismatch — check the category, not just what's visible in a screenshot.

**How to inspect Figma bindings — do not eyeball a screenshot or a Figma doc-page
description.** Use the Figma MCP tools (`get_variable_defs`, or `use_figma` reading
`node.boundVariables`/`node.fills`/`node.strokes`/`node.effects`/`node.fontName`/etc.
directly) to read the actual bound variable on the actual node, the same way the Radio/
RadioGroup token-parity audit did — resolve the variable to its name and value, don't
infer it from what the property "looks like" it should be.

**Rules while auditing:**

- **Do not approximate.** If Figma binds `border.strong`, code must use
  `--color-border-strong`, never `--color-border-default` or `--color-border-subtle`
  because it "looks close enough."
- **Do not substitute a different-but-similar or visually similar semantic token.**
  `text.caption.sm.regular` and `text.caption.md.regular` are different tokens with
  different resolved values (12px vs. 14px) even though they share a role name —
  matching the *role* isn't enough, the exact token must match. (This is the exact class
  of bug the Radio Group audit found: `caption.md` in code against a Figma node actually
  bound to `caption.sm`.)
- **Do not hardcode a value when the Figma property is token-bound**, even if the
  hardcoded number is numerically correct today — it silently drifts the next time the
  token's value changes.
- **Do not silently change the semantic role** a value plays (e.g. reusing a token whose
  documented purpose is "icon/accent use" for body text just because its resolved color
  happens to look right) — a token's semantic role is part of what has to match, not
  just its rendered output.
- **Do not silently create platform drift** — a mismatch is either fixed or explicitly
  documented as an intentional platform difference (see below). It is never just left.

**Produce a parity table** with exactly these columns, one row per audited property:

| Figma property | Figma token | Resolved value | Generated code token | Current code usage | Status | Intentional difference |
| --- | --- | --- | --- | --- | --- | --- |

`Status` is one of: `Match`, `Mismatch (fixed)`, `Mismatch (Figma corrected)`,
`Component constant (no token)`, or `Platform difference (documented)`.

**Resolving a mismatch — decide which side is canonical, don't just patch code
reflexively:**

- Compare against how the same token/role is used elsewhere in the system (other shipped
  components, the relevant `docs/foundations/*.md` page) to determine which side drifted.
  If Figma disagrees with itself across components (e.g. one component's label is bound
  correctly and another's isn't), the *foundation* is canonical, not whichever component
  was built first — see the Checkbox/Radio label-token fix as the precedent (Button and
  Input had it right; Checkbox and Radio were the outliers; Figma was corrected to match
  the foundation, not the other way around).
- If code is the outlier, fix code to reference the correct generated token.
- If Figma is the outlier, fix the Figma binding directly (with the user's authorization
  if the task's instructions restrict Figma edits that turn) and say so in the report —
  don't leave code silently diverging from a Figma mistake to "match" it.

**Two narrow exceptions — do not treat these as mismatches:**

- **Component-owned constants.** If Figma itself intentionally uses a fixed, non-
  tokenized value (e.g. Checkbox/Radio's 24×24 hit target, Button/Input's 32/40/48px
  control heights), code may use the same literal component-level constant. Do **not**
  invent a new foundation token just to eliminate a literal that Figma never tokenized in
  the first place — that violates the "no speculative tokens" rule in step 4.
- **Platform differences with no literal equivalent.** If a Figma concept has no
  corresponding CSS/native concept (Figma's `lineHeight: AUTO`, a Figma-only Interaction/
  State documentation axis, a Figma `Show label`-style boolean with no prop equivalent),
  do not force a fake 1:1 mapping. Document the semantic intent instead, the way Button's
  Focus-visible implementation difference is already documented in
  `docs/design-to-code-mappings.md`.

This audit's findings fold into the Final report's **Token parity audit** item — every
mismatch found must show as fixed or explicitly documented as intentional before this
component can be marked ready for commit (see the Ready-for-commit rule).

### 15. Run validation

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

Passing this step confirms the component *builds*. It does not confirm it *renders or
behaves correctly* — that's Layer 3, next.

### 16. Live rendered parity gate — Layer 3 (mandatory — blocks "ready for commit")

Static source inspection (steps 7 and 14) and a passing build (step 15) are necessary but
not sufficient. A component can have perfect Figma bindings and perfect token references
in code and still render or behave wrong at runtime — CSS interactions, browser layout
algorithms, and JS timing don't show up in a source diff or a successful build. This
happened for real: Accordion's collapsed panel passed every static token/binding check
while still leaking visible content in a live browser, twice — the bug was in how a CSS
technique resolved at runtime, not in any token reference or build error.

**Before any component is reported "ready for commit," require a live Storybook or
manual-browser review** for any component whose rendering or behavior can plausibly
differ between static source and a running browser — in practice, nearly every
interactive or animated component. Check, as applicable:

- Typography rendering (the actual measured text, not just the CSS rule that produced it)
- Spacing and dimensions as rendered, not just as declared
- Alignment
- Focus (a visible ring, the correct element receives it, tab order is logical)
- Hover
- Disabled
- Text wrapping
- Open/closed (or expanded/collapsed, selected/unselected) state
- Animation — does it actually play, in the right direction, at the right speed
- Overflow/clipping — especially any state that's supposed to render nothing
- Browser-native behavior (native `<select>`, `<details>`, form controls, etc.)
- Overlay/floating positioning where applicable (flip/shift/collision handling)

**Runtime Behavior Guard.** For components with runtime state or layout behavior, audit
the specific failure modes for that component's actual behavior model — not a generic
checklist applied by rote. Examples this repo has already hit (not an exhaustive list —
reason from the real component, the way these were reasoned from):

| Component shape | What to specifically verify live |
| --- | --- |
| Accordion (or any disclosure) | Collapsed panel shows **zero** visible content and contributes **zero** visible layout space — not just "hidden text," actually reclaimed height. Open/close animation plays correctly in both directions. Disabled and `allowMultiple` behave correctly together with the collapse mechanism. |
| Tooltip (or any floating overlay) | Shows on hover **and** keyboard focus, not just one. Viewport collision handling (flip/shift) actually repositions it near an edge. Dismisses on Escape/blur. |
| Tabs (or any tablist) | Arrow-key navigation moves focus and switches the panel per the chosen activation model. Keyboard and click both select the right panel. Roving tabindex is correct (only the selected tab is a tab stop). |
| Select (or any native-control wrapper) | The closed control's rendered appearance matches Figma — native chrome doesn't always take styling the way a static mock assumes. Native behavior (keyboard, mobile picker) is preserved, not fought or reimplemented. |
| Switch (or any thumb/track control) | Thumb aligns correctly at rest in both states and slides smoothly between them — optical-alignment bugs are easy to miss in a static screenshot and only show up rendered. |

**If Claude cannot access a live browser** (no connected browser-automation tooling — the
common case in this environment):

- Do **not** claim visual or behavioral parity is complete.
- Explicitly name what still needs checking (from the list above, scoped to this
  component) rather than a vague "manual review recommended."
- Do **not** report "ready for commit." Say instead, verbatim: **"Ready for manual visual
  review, not ready for commit yet."** Use this exact phrasing, not a softer paraphrase,
  so the report is unambiguous about what has and hasn't been confirmed.
- A static source review, a Figma screenshot comparison, or a successful
  `build`/`build-storybook` command is never a substitute for this layer — they check
  different things (steps 7, 14, and 15 respectively) and none of them execute the
  component's actual runtime behavior in a browser.
- If browser-automation tooling *is* available and used, say so explicitly and describe
  what was actually exercised (which states were triggered, what was observed) rather
  than asserting "verified" without detail.

### 17. Produce final audit report, then stop

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
   frames added, and the outcome of the step 7 Figma authoring parity gate (any raw-value
   findings and how they were resolved).
6. **Public API** — the final prop table.
7. **Storybook coverage** — list of stories added/updated.
8. **Accessibility findings** — checklist results plus anything still requiring manual
   verification.
9. **Token parity audit (Layer 2)** — the full parity table from step 14 (every audited
   category: color, typography, spacing, radius, border, focus, icon size, motion,
   elevation/shadow, layout, responsive where applicable), every mismatch's resolution,
   and which side (Figma or code) was corrected for each.
10. **Figma ↔ code mapping** — confirmation `docs/design-to-code-mappings.md` was
    updated, with a link to the new/changed section.
11. **Intentional platform differences** — anything where Figma and code, or web vs.
    other platforms, deliberately diverge (including any from the parity audit).
12. **Validation results** — pass/fail per command from step 15.
13. **Live rendered parity (Layer 3)** — what was actually checked in a live browser and
    what was observed, per step 16; or, if no live-browser access was available, the
    explicit list of what still needs checking. Never silently omit this item.
14. **Manual checks still required** — anything a human still needs to do (screen-reader
    testing, design review, live visual/behavioral confirmation, etc.).
15. **Ready for commit?** — see the Ready-for-commit rule below; never a bare yes/no
    without checking all four conditions.

## Ready-for-commit rule

A component is only "ready for commit" when **all four** of the following hold:

1. **Figma authoring parity passes** (step 7, Layer 1) — the Figma component itself is
   properly token-bound, with any raw-value findings resolved and reported, not
   silently propagated.
2. **Code semantic parity passes** (step 14, Layer 2) — every parity-table row is
   `Match`, a fixed/corrected mismatch, a documented component constant, or a documented
   platform difference. An open, unfixed token mismatch means this is never ready for
   commit, even if everything else passes.
3. **Build validation passes** (step 15) — `tokens:build`, `typecheck`, `lint`, `build`,
   and `build-storybook` all succeed.
4. **Live rendered parity has been confirmed** (step 16, Layer 3) — either Claude
   verified it directly against a running browser (state exactly what was exercised), or
   the user has explicitly confirmed the live Storybook result themselves.

If condition 4 cannot be met because no live-browser access is available, the report's
final line must be, verbatim: **"Ready for manual visual review, not ready for commit
yet."** Do not report "ready for commit: yes" on the strength of static review and a
passing build alone — that is exactly the gap that let a token-binding bug (Card) and a
runtime rendering bug (Accordion, twice) ship past this skill's own audit before this
rule existed.

## Quality bar

Optimize for production maintainability, consistency with the existing system,
accessibility, scalability, cross-platform readiness, and minimal unnecessary complexity
— not for speed. This skill exists to make repeated component production faster without
skipping any of the real design-system practice above. If a step in this workflow would
be skipped to go faster, that is itself a pause point, not a shortcut to take silently —
the 3-layer parity gate above is the least skippable part of this document.
