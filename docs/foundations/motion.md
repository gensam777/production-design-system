# Motion Foundation (V1)

Status: implemented (Figma + code). See
`governance/decisions/0008-motion-token-architecture.md` for the architectural
decisions behind this foundation.

## Primitives

Two separate raw scales in `src/tokens/primitive/motion.json` — duration and easing are
different physical dimensions, not points on one axis, so they stay separate scales
rather than one composite.

| Token (code) | Figma variable | Value |
| --- | --- | --- |
| `motion.duration.instant` | `motion/duration/instant` (TIMING) | 0ms |
| `motion.duration.fast` | `motion/duration/fast` | 100ms |
| `motion.duration.base` | `motion/duration/base` | 200ms |
| `motion.duration.slow` | `motion/duration/slow` | 300ms |
| `motion.duration.slower` | `motion/duration/slower` | 400ms |
| `motion.easing.standard` | `motion/easing/standard` (EASING) | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `motion.easing.decelerate` | `motion/easing/decelerate` | `cubic-bezier(0, 0, 0.2, 1)` |
| `motion.easing.accelerate` | `motion/easing/accelerate` | `cubic-bezier(0.4, 0, 1, 1)` |

`motion.duration.slower` is headroom — no semantic role aliases it in V1. No `linear`
easing yet — deferred until a real spinner/loop consumer exists.

## Semantic tokens

`src/tokens/semantic/motion.json` — DTCG `$type: "transition"` composites
(`{ duration, delay, timingFunction }`), aliasing primitive duration + easing.
`delay` is always the literal string `"0ms"` — V1 never needs a non-zero delay.

| Semantic | Duration | Easing | Covers |
| --- | --- | --- | --- |
| `motion.micro` | `fast` (100) | `standard` | Hover, press/active, focus-ring appearance — all share one token in V1. |
| `motion.overlay-enter` | `base` (200) | `decelerate` | Menu/popover/tooltip opening. |
| `motion.overlay-exit` | `fast` (100) | `accelerate` | Menu/popover/tooltip closing. |
| `motion.modal-enter` | `slow` (300) | `decelerate` | Dialog/modal/drawer opening. |
| `motion.modal-exit` | `base` (200) | `accelerate` | Dialog/modal/drawer closing. |

Exit is intentionally faster than its matching enter — standard UX practice.
`motion.micro` is deliberately **not** split into hover/press/focus-specific tokens —
split only if a real component later proves different timing is needed.

Not covered in V1 (no real consumer yet): page/section transitions, spinners/loops.

## Naming convention

```
Primitive:  motion.duration.<step>   e.g. motion.duration.fast
            motion.easing.<step>     e.g. motion.easing.decelerate
Semantic:   motion.<role>            e.g. motion.overlay-enter
```

**Components must consume semantic tokens only** — `motion.overlay-enter`, never
`motion.duration.base` directly.

## Code output

- **CSS** (`src/tokens/build/css/variables.css`): valid `transition` shorthand via
  Style Dictionary's built-in `transition/css/shorthand` + `cubicBezier/css` transforms
  (both present in this config since day one, dormant until now) — e.g.
  `--motion-overlay-enter: 200ms cubic-bezier(0, 0, 0.2, 1) 0ms;`. Standalone
  `--motion-duration-*` (ms) and `--motion-easing-*` (`cubic-bezier(...)`) custom
  properties are also emitted for components that prefer composing
  `transition-duration`/`transition-timing-function` longhand.
- **Durations always carry an explicit unit, including zero** (`0ms`, not `0`) — a new
  `time/duration-ms` transform ensures this; CSS `<time>` values aren't guaranteed safe
  unitless at zero the way `<length>` values are. This transform also has to run before
  the shorthand transform, which does no unit normalization of its own at all — see ADR
  0008 for what would break without it.
- **JS/TS** (`src/tokens/build/js/tokens.js`): `motion.duration.*` as plain ms numbers,
  `motion.easing.*` as raw `[x1, y1, x2, y2]` arrays, semantic roles as objects
  (`{ duration, delay, timingFunction }` — `duration`/`timingFunction` raw,
  `delay` the pre-formatted string `"0ms"`, a documented shape asymmetry, not a bug).

## Reduced-motion strategy

`src/tokens/build/css/motion-reduced-motion.css` — generated, separate file. Under
`@media (prefers-reduced-motion: reduce)`, forces **every** `--motion-*` custom
property to an effectively-instant value: all 5 primitive `--motion-duration-*` → `0ms`,
all 5 semantic `--motion-*` transition shorthands → `0ms linear 0ms`. Easing primitives
are untouched — irrelevant once duration is zero.

**Why both tiers need overriding, not just the primitive**: Style Dictionary resolves
alias references at build time, not as live CSS `var()` chains — `--motion-overlay-enter`
ships as an already-baked string with no runtime reference back to
`--motion-duration-base`. Overriding only the primitive would silently do nothing for a
component consuming the semantic shorthand directly. This is covered regardless of which
tier a component actually uses.

**No component-level special-casing required** — any component using `var(--motion-*)`
(either tier) automatically respects reduced-motion. This is the entire reason duration
was tokenized rather than hardcoded per-component.

## Future theming: remap Semantic, not Primitive

Same lever as radius (Sharp/Soft) and elevation (Flatter/Bolder) — documented only, not
implemented:

| Semantic role | Default | Snappy | Deliberate |
| --- | --- | --- | --- |
| `motion.micro` | `fast` | `instant` | `fast` |
| `motion.overlay-enter` | `base` | `fast` | `slow` |
| `motion.modal-enter` | `slow` | `base` | `slower` |

## Accessibility/usability notes

- Reduced-motion is the headline concern — covered above.
- `motion.micro` (100ms) stays fast deliberately so a keyboard user's focus ring never
  feels laggy.
- No role involves scale/rotation/parallax — only opacity/position, deliberately
  conservative for vestibular safety.
- Motion is never the sole signal of a state change — same principle as color/elevation.

## Figma prototype-binding limitation

Confirmed directly against the Plugin API types, not assumed:

- `TIMING` and `EASING` **are** real Figma Variable types — unlike shadow, motion needed
  no Effect-Style-style workaround. Both `Primitive` (duration/easing) and
  `Semantic Motion` (5 roles × 2 fields each, since Figma Variables are always scalar)
  are genuine Variables aliasing Variables.
- **Figma's `VariableScope` enum has no entry for a prototype interaction's transition
  duration/easing.** A click reaction's "Smart Animate" duration and curve are literal,
  unbound settings in Figma's Prototype panel — they cannot be bound to
  `motion.duration.*`/`motion.easing.*` Variables today.
- **`TIMING`/`EASING` variables reject scope assignment outright** — confirmed
  empirically (`"Cannot set scopes on this variable type"`), not just "no relevant
  scope exists." They default to (and cannot be changed from) `["ALL_SCOPES"]`,
  which is harmless since no property picker exists for these types anyway.
- The "Motion Specimen — V1" Figma frame includes a genuine two-frame prototype example
  with a real `ON_CLICK` → `SMART_ANIMATE` reaction using literal values matching
  `motion.overlay-enter` exactly — clearly labeled as literal, kept in sync by
  convention, not a live binding.
