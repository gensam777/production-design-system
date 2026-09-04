# 0008: Motion token architecture — DTCG transition composites, dedicated reduced-motion output

- **Status**: Accepted
- **Date**: 2026-09-05

## Context

The Motion Foundation follows the same Figma-first process as spacing, radius, and
elevation. Unlike elevation (no shadow-type Figma Variable, forcing an Effect-Style
workaround — 0007), motion is architecturally the *easiest* foundation mirrored so
far: `TIMING` and `EASING` are real Figma `VariableResolvedDataType`s, so both the
primitive and semantic tiers are plain Variables aliasing Variables, same as
color/space/radius. The interesting problems in this foundation were on the code side.

## Decision

- **Primitives are two separate scalar scales**, `motion.duration.*` (`$type: "duration"`)
  and `motion.easing.*` (`$type: "cubicBezier"`) — matching the established rule that
  primitives are always scalar, and matching Figma's `TIMING`/`EASING` split exactly
  (a semantic "role" needs two Figma Variables, not one composite, since Figma
  Variables are always scalar too).
- **Semantic roles are DTCG `$type: "transition"` composites**
  (`{ duration, delay, timingFunction }`), aliasing a primitive duration and a primitive
  easing per role, `delay` hardcoded to the literal string `"0ms"` (no primitive exists
  for it — V1 never uses a non-zero delay, so one wasn't built speculatively). This
  activates two more previously-dormant built-in Style Dictionary transforms:
  `cubicBezier/css` (present in this config since the very first commit) and
  `transition/css/shorthand` — same "the built-in tooling was already anticipating
  this" pattern as elevation's `shadow/css/shorthand` (0007).
- **`$type: "duration"`, not the built-in `time/seconds` transform's `$type: "time"`.**
  Style Dictionary's own `time/seconds` transform converts to *seconds*, dividing by
  1000 — the opposite of this project's explicit requirement that durations output as
  milliseconds. Using a distinct `$type` means motion's isolation from
  spacing/radius/shadow was actually *simpler* than radius's or shadow's: those needed
  an explicit `token.path[0]` scope check because they shared `$type: "dimension"` with
  spacing. Motion's types (`duration`, `cubicBezier`, `transition`) don't collide with
  `dimension` at all, so no `path[0]` check was needed — filtering on `$type` alone is
  sufficient and automatic.
- **A new `time/duration-ms` transform** (same pre-format-before-the-built-in-shorthand-
  runs pattern as `size/radius-px`/`size/shadow-px`) converts bare-number durations to an
  explicit `"Nms"` string before `transition/css/shorthand` runs. This one's built-in
  counterpart is worse than shadow's: `transition/css/shorthand` does *zero* unit
  normalization at all (shadow's at least preserves a unit if one is already present) —
  it just string-interpolates the raw value. Without this transform, generated CSS would
  have a completely unitless duration in the `transition` shorthand.
  Always emits a unit even for `0` (`"0ms"`, not `"0"`) — CSS `<time>` values are not
  guaranteed unitless-zero-safe the way `<length>` values are.
- **Reduced-motion required a dedicated output file
  (`src/tokens/build/css/motion-reduced-motion.css`), not just a primitive-value
  override**, because of a subtlety specific to how Style Dictionary resolves aliases:
  references (`{motion.duration.base}` inside `motion.overlay-enter`) are resolved at
  **build time**, not preserved as live `var(--motion-duration-base)` chains in the
  generated CSS. The semantic `--motion-overlay-enter` custom property ships as a fully
  baked string (`"200ms cubic-bezier(...) 0ms"`) with no runtime reference back to the
  primitive at all. So overriding only `--motion-duration-*` under
  `prefers-reduced-motion: reduce` would do nothing for any component consuming the
  semantic shorthand directly. The new `css/reduced-motion` format zeroes **both**
  tiers — all 5 primitive `--motion-duration-*` vars to `0ms`, all 5 semantic
  `--motion-*` transition vars to `0ms linear 0ms` — so reduced-motion works correctly
  regardless of which tier a given component actually consumes. Easing primitives are
  deliberately left untouched: at `0ms` duration, a timing-function curve has no visible
  effect, so there's nothing to override.
- **No component special-casing required.** Because every duration/transition value is
  a token, one `@media (prefers-reduced-motion: reduce)` block (this new file) covers
  every current and future consumer automatically, as long as components use
  `var(--motion-*)` rather than a hardcoded value — this was the entire point of
  tokenizing duration in the first place (see the original architecture proposal).
- **No page-transition, spinner, or `linear` easing tokens** — none had a real consumer
  requested; deferred deliberately, matching the "no token without a real consumer" rule.

## Consequences

- `MotionMicro`/`MotionOverlayEnter`/etc. in the JS output have a minor internal shape
  asymmetry worth knowing about: `duration` and `timingFunction` are raw values (number,
  array) since the `js` platform has no shorthand-stringifying transform, but `delay` is
  the pre-formatted string `"0ms"` (hardcoded at the source level, not transformed) —
  intentional, not a bug, same kind of documented asymmetry as elevation's
  `elevation.flat` (0007).
- Any future foundation needing a non-zero, variable delay would need an actual
  `motion.delay.*` primitive scale and a `time/duration-ms`-style transform applied to
  it too — not built now, since V1 has no real use for a non-zero delay.
- Components should default to consuming the semantic transition shorthand
  (`transition: opacity var(--motion-overlay-enter);`) for simplicity, but either
  consumption pattern (shorthand or longhand `transition-duration`/
  `transition-timing-function` built from the primitives) is correctly covered by the
  reduced-motion override — this was verified deliberately, not assumed.
- Matches the Figma-side finding from V1 implementation: Figma actively rejects setting
  `.scopes` on `TIMING`/`EASING` variables (throws `"Cannot set scopes on this variable
  type"`) — unrelated to code, but recorded here for anyone cross-referencing the two
  implementations.
