# Component contracts

Decision record: [ADR 0015](../../governance/decisions/0015-component-contracts.md).
Status: **implemented (Phase 3, 2026-10-12).** Schema: `design/contracts/schema.json`.
Contracts: `design/contracts/components/*.contract.yaml` — **Button** so far. Components
without a contract file keep their prose "Cross-platform contract" subsection in
`docs/design-to-code-mappings.md` until they are converted (incrementally, via the
component-production skill).

## What a contract is

The platform-neutral description of a component: its semantic API, states, behavior,
accessibility outcomes and token bindings. Every platform implements it natively. It is
**not** a React API, and it is **not** a code generator.

- Format: YAML, validated by JSON Schema (draft 2020-12).
- Location: `design/contracts/components/<kebab-name>.contract.yaml` (e.g.
  `password-input.contract.yaml`); `component:` inside is PascalCase (`PasswordInput`).
- Web (`packages/react/src/components/`) is the implemented reference. React Native, iOS and Android stay
  `planned` until Phase 5.

## Rules

1. **Same meaning on all four platforms**, or it stays out of the contract.
2. **Semantic names** — events by intent (`activate`, `change`, `dismiss`), mapped to each
   platform's idiom outside the contract (see [Platform naming](#platform-naming-of-the-same-contract)).
3. **Typed slots**, never a platform content type: `text`, `icon` (an `IconName`; decorative
   unless stated), `action` (one interactive control with its own accessible name), `content`
   (free composition).
4. **Interaction visuals are platform-owned** — hover, pressed, focus. A contract may bind
   tokens to them but never require a state a platform doesn't have.
5. **Accessibility as outcomes** (role, name source, exposed states, announcements), never
   as a platform API.
6. **Semantic, shared token paths only** — never Core, never `brand.*`, never a web-only or
   native-only token.
7. **Visual size shared; hit target platform-owned** (web ≥ 24 px, iOS ≥ 44 pt, Android
   ≥ 48 dp). Expanding the hit target never changes the visual.
8. **No platform API names anywhere** — not even in `platform-notes`. Platform-only
   capabilities (form submission, navigation look-alikes, hit-slop, …) are described by
   meaning; the API-level mapping lives in this doc and in each platform's code.
9. **Divergence is explicit** — `intentional-differences` with a reason, or it's drift.
   Unresolved mismatches go in `open-questions`, never silently resolved.
10. **Per-platform status** — `planned | alpha | beta | stable | not-applicable`
    (`governance/component-lifecycle.md`).
11. **Contract and web reference agree.** Storybook stays authoritative for web behavior;
    conflicts are resolved in review and recorded.

## Field reference

| Field                     | Required | Content                                                                                                                       |
| ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `schema-version`          | yes      | `1`                                                                                                                           |
| `component`               | yes      | Shared PascalCase name (`Button`). Swift/Kotlin add `DS` / `Ds` in code only.                                                 |
| `summary`                 | yes      | One-paragraph intent — what it is for and what it is not for                                                                 |
| `status`                  | yes      | `web`, `react-native`, `ios`, `android` → lifecycle status                                                                    |
| `anatomy`                 | yes      | Part name → description. Parts are the first-level keys of `tokens`; every slot is also a part                                |
| `properties`              | yes      | `type: enum` (`values` map value → meaning, `default`) or `type: boolean` (`default`); optional `behavior` (rule id → rule)    |
| `slots`                   | no       | `type` (`text` / `icon` / `action` / `content`), `required`, `decorative` (icon slots only, required there)                   |
| `events`                  | no       | Semantic event → `description`, `payload` (`none` or field → meaning), `suppressed-when` (shared states)                       |
| `states`                  | yes      | `shared` (must include `default`; `tokens-from` reuses another state's cells), `platform-owned` (hover/pressed/focus/dragged), `precedence` |
| `accessibility`           | yes      | `role`, `name` (`source` slot + `rule`), `exposed-states`, `announcements`, `outcomes`                                        |
| `tokens`                  | yes      | part → property → (enum value \| state)\* → semantic token path, or `none`. A state missing from a state map = unchanged from `default` |
| `component-constants`     | no       | Values that are deliberately not tokens (`px` / `ms`), `token-gap: true` where a token should exist                          |
| `sizing`                  | no       | `property` + `visual-height` per value; `width`; `hit-target` (`policy: platform-owned`, per-platform `minimum`)             |
| `figma`                   | no       | `file-key`, `component-set`, `node-id`, `verified`, `variant-count`, `axes` (→ property or states), `component-properties` (→ slots), `figma-only` |
| `references`              | no       | Repo paths per platform (`source`, `styles`, `stories`) + `docs`. `web` is checked while web is alpha/beta/stable            |
| `platform-notes`          | no       | Per platform: `base` (what it is built on, in words) + `notes`                                                                |
| `intentional-differences` | no       | `{ id, platforms, difference, reason }` — platforms may include `figma`                                                       |
| `implementation-gaps`     | no       | `{ id, platform, contract, current, raised }` — decided behavior an implemented platform doesn't do yet; tests expect the gap while listed and fail once it's closed but still listed |
| `open-questions`          | no       | `{ id, question, affects, blocks, raised }` — mismatches found and reported, not resolved                                    |

Naming inside a contract: parts, properties, slots, events, states and enum values are
camelCase identifiers; schema keys, token property names, behavior ids and constant names are
kebab-case.

## Validation

```
npm run contracts:validate   # every contract — exit 1 on any error
npm run contracts:test       # negative tests for every check + Button cell-by-cell CSS parity
```

Both run in CI. `contracts:validate` (`scripts/contracts/validate.mjs`) runs, per contract:

| Check           | What it proves                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `yaml`          | Parses; no duplicate keys, no merge keys                                                                                                                                         |
| `schema`        | Matches `design/contracts/schema.json`                                                                                                                                           |
| `platform-api`  | No web or native API names anywhere in the file (`className`, `href`, `aria-*`, `ReactNode`, `type="submit"`, `onClick`/`onPress`, `accessibilityLabel`, `Modifier`, …)         |
| `references`    | Defaults are enum values; slots and token parts are anatomy parts; token selector keys are enum values or states; `tokens-from`, `suppressed-when`, `precedence`, sizing keys resolve |
| `tokens`        | Every token path exists in **every** brand's resolved IR and is `semantic` + `shared` (resolved in memory — no token build needed)                                              |
| `figma`         | Each axis maps 1:1 onto a property's enum values (or covers every shared state); `variant-count` = product of axis sizes; every instance of the set in the committed design-audit Figma snapshots uses known axes/values |
| `web-reference` | While web is alpha/beta/stable: files exist; each enum has a matching `<Component><Prop>` union type; literal defaults match; the token set the styles reference equals the token set the contract binds (both directions) |

The validator compares token **sets**; `contracts:test` pins Button's token **cells**
(variant × state, size) against `Button.css`. It reads Figma only through the committed
design-audit snapshot — refresh that snapshot (design-audit skill) to check live Figma.

## Button — the reference contract

[`design/contracts/components/button.contract.yaml`](../../design/contracts/components/button.contract.yaml)
— web `alpha`, other platforms `planned`. Summary:

- **Properties:** `variant` (primary / secondary / tertiary / danger, default primary),
  `size` (sm / md / lg, default md), `disabled`, `loading` (blocks activation, keeps the
  variant's normal colors — never the disabled colors — preserves size, spinner only, keeps
  the name, exposes busy).
- **Slots:** `label` (text, required, the accessible name), `leadingIcon` / `trailingIcon`
  (icon, decorative; presence reduces that side's inset one step).
- **Event:** `activate`, payload none, suppressed while disabled or loading.
- **States:** shared default / disabled / loading (loading uses the default cells; disabled
  is the only visually disabled state); platform-owned hover / pressed / focus.
  **Precedence disabled > loading > default:** disabled + loading is disabled (not busy,
  label shown, cannot activate); loading alone is busy, cannot activate, stays focusable.
- **Tokens:** `action.*` / `surface.disabled` backgrounds, `border.*`, `text.*` /
  `action.*.on-color` label colors per variant × state; `radius.control`; `space.inset.*` /
  `space.inline.*` per size; `text.label.{sm,md,lg}.medium`; `icon.{sm,md,lg}`;
  `motion.micro`; `radius.full` spinner; `focus.ring` / `focus.ring-offset`.
- **Sizing:** visual height 32 / 40 / 48 (component constants); hit target platform-owned.
- **Figma:** re-audited against live Figma 2026-10-12 (axes, 72 variants, bindings).
- **Implementation gaps (web):** the web Button still turns on native `disabled` while
  loading (disabled colors, not focusable); with disabled + loading it shows the spinner and
  reports busy.
- **Phase 5 implementation questions:** Disabled cells differ between Figma and code
  (secondary / tertiary / danger), fixed height vs. text scaling, Figma text-style /
  icon-size binding gaps, spinner thickness and motion token, Figma On-color binding
  inconsistency.

## Adding or updating a contract

1. Copy the Button contract's shape; name the file `<kebab-name>.contract.yaml`.
2. Fill it from the Figma component set and the web implementation — never invent a
   property the web reference and Figma don't both have; record mismatches in
   `open-questions`.
3. `npm run contracts:validate` until clean, then `npm run contracts:test`.
4. Replace the component's prose "Cross-platform contract" subsection in
   `docs/design-to-code-mappings.md` with a link to the file.

## Platform naming of the same contract

The contract never contains these names; this table is the documented mapping.

| Contract             | Web (React)               | React Native            | SwiftUI                    | Compose                           |
| -------------------- | ------------------------- | ----------------------- | -------------------------- | --------------------------------- |
| `component: Button`  | `Button`                  | `Button`                | `DSButton`                 | `DsButton`                        |
| `variant: primary`   | `variant="primary"`       | `variant="primary"`     | `variant: .primary`        | `variant = ButtonVariant.Primary` |
| `events.activate`    | `onClick`                 | `onPress`               | `action:`                  | `onClick`                         |
| `slots.label` (text) | `children`                | `children` / `label`    | `title` / label view       | `text` / content lambda           |
| `slots.leadingIcon`  | `leadingIcon` (ReactNode) | `leadingIcon: IconName` | `leadingIcon: DSIconName?` | `leadingIcon: DsIconName?`        |
| `disabled`           | native `disabled`         | `disabled`              | `.disabled(_:)`            | `enabled = !disabled`             |
| busy (loading)       | `aria-busy`               | `accessibilityState`    | accessibility value        | `stateDescription`                |
