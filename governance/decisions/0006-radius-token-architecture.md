# 0006: Radius token architecture — px-only, semantic-remap theming, primitive/semantic name collision

- **Status**: Accepted
- **Date**: 2026-09-04

## Context

The Radius Foundation follows the same primitive→semantic split as color, typography,
and spacing, and was built Figma-first like spacing (0004), landing in the new
`Semantic Radius` collection (0005). Two things make it different from every prior
foundation:

1. **Radius must stay px in both source and CSS output — deliberately not scaled like
   spacing.** Radius is visual geometry (a corner's curvature), not something that
   should grow when a user increases their browser's root font size for accessibility.
   Spacing and typography both scale with rem on purpose; radius is the first foundation
   that explicitly must not.
2. **A primitive and a semantic token share the same name by design**: the primitive
   step `radius/full` (9999, an oversized value that always resolves to a full
   capsule/circle) and the semantic role `radius/full` (pills, avatars) are named
   identically in Figma. This is fine in Figma — `Primitive` and `Semantic Radius` are
   separate collections, so identical names in each don't collide. Style Dictionary has
   no equivalent per-collection namespacing: it merges every source JSON file into one
   flat token tree keyed by path, so two tokens can't share the literal path
   `radius.full`. This was caught as a build-time "token collision" + "reference could
   not be found" error when radius was first mirrored into code.

## Decision

- **Same primitive→semantic architecture as color/typography/spacing**: primitives
  (`src/tokens/primitive/radius.json`) and semantics
  (`src/tokens/semantic/radius.json`, alias-only, no raw duplicated values).
- **Six primitives**: `radius.none` (0), `radius.sm` (4), `radius.md` (8), `radius.lg`
  (12), `radius.xl` (16), and one renamed exception — see below. `radius.md`/`radius.xl`
  are headroom, not yet aliased by any semantic role, same "unused primitive is fine"
  precedent as color's full gray/blue ramp and spacing's `space.md`/`space.xl`.
- **Four semantic roles**: `radius.flat` → `radius.none` (tables, dividers, code
  blocks), `radius.control` → `radius.sm` (buttons, inputs, checkboxes, tags),
  `radius.container` → `radius.lg` (cards, panels, modals, popovers), `radius.full` →
  the oversized-value primitive (pills, avatars, circular elements).
- **The code-only primitive/semantic name collision is resolved by renaming the
  primitive to `radius.max` in code, not by renaming anything in Figma or changing the
  semantic role's name.** Figma's `Primitive` collection still has a variable literally
  named `radius/full` (unchanged, not touched by this decision) — only the *code* path
  differs. Reasoning for resolving it this direction rather than the reverse:
  - The semantic tier is what components actually consume (the established
    "components consume semantic tokens only" rule, true since color/0002) — keeping
    its name (`radius.full`) identical to Figma matters more than the primitive tier's,
    since the primitive is never referenced directly from component code.
  - `max` is arguably a *better* primitive-tier name on its own merits: primitives are
    supposed to carry no meaning ("a primitive doesn't know it means X" — 0002), but
    `full` already implies a design intent ("fully rounded corners"), which is really a
    semantic-layer idea. `max` — "the largest value in the scale" — is a more neutral,
    magnitude-only name, consistent with how every other primitive step in every
    foundation is named (a position in a scale, not a design meaning).
  - This is a one-token, code-only divergence (5 of 6 primitives, and all 4 semantic
    roles, keep identical names to Figma) — not a structural change to the whole
    foundation's naming convention.
- **Px-only, no rem, for both source and CSS output.** Values are bare-number
  `$type: "dimension"` tokens exactly like spacing's shape, but the existing
  `size/px-to-rem` transform (0004) is scoped away from radius
  (`token.path[0] === 'space'` check added to its filter) and a new `size/radius-px`
  transform formats radius as an explicit `"Npx"` string before the built-in `size/rem`
  transform runs — same pre-format-then-passthrough mechanism `size/px-to-rem` already
  uses for spacing, and typography's pre-formatted rem strings before that. Without this,
  radius would have been silently swept into the same rem conversion as spacing (both
  are bare-number `dimension` tokens) — caught during the audit before mirroring Radius
  into code, not after.
- **Theming strategy: remap Semantic, not Primitive.** Per the approved proposal, future
  Sharp/Soft/brand variants are expressed by repointing which primitive each semantic
  role aliases (`radius.control` → `radius.none` for Sharp, → `radius.md` for Soft),
  never by mutating the primitive scale itself — same one-file-change property color's
  brand-hue swap already has. **Documented here as the intended future mechanism only —
  no Sharp/Soft Figma modes and no code theme files exist yet.** When they're built:
  Figma gets `Sharp`/`Soft` modes added to the `Semantic Radius` collection (parallel to
  how dark mode is planned to extend `Semantic Color`, per 0002), and code likely gets a
  `src/tokens/themes/` override file, mirroring the same deferred pattern documented for
  dark mode.

## Consequences

- Anyone reading `src/tokens/primitive/radius.json` and expecting `radius.full` to exist
  there will find `radius.max` instead, with a `$description` explaining why — this is
  the one token path in the entire system where code and Figma primitive names diverge.
  Should not be treated as a precedent to casually rename other tokens; it was forced by
  a genuine structural collision, not a stylistic preference.
- The `size/radius-px` transform is a reusable pattern for any future px-only,
  never-scales-with-root-font-size token category (e.g. border width, if ever added) —
  reuse it rather than re-deriving the pre-format-then-passthrough trick a third time.
- Anyone adding a new semantic role to any future foundation should check for a name
  collision against that foundation's own primitive scale before assuming the two tiers
  can freely share names in code, even though Figma's collections make it look free.
