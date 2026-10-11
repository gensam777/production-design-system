# Accessibility across platforms

Policy baseline: [`governance/accessibility.md`](../../governance/accessibility.md) (WCAG 2.2
AA). This document defines how that baseline applies beyond the web. Status: web
implemented; native **planned**.

## Principles

1. **Share outcomes, not APIs.** A contract states _what_ assistive technology must perceive
   (role, name, state, announcement); each platform delivers it with its own API. No
   `aria-*` in contracts.
2. **Prefer native controls and semantics** — the cross-platform version of "native element
   before ARIA". A native `Toggle` / `Switch` / RN `Switch` beats a custom-drawn control with
   traits added.
3. **Same bar on every platform:** WCAG 2.2 AA intent, plus each platform's own guidance
   (Apple HIG accessibility, Android / Material accessibility).
4. **Contrast is guaranteed by tokens.** The per-brand contrast guardrail runs on resolved
   values, so every platform inherits it. Components may not introduce unchecked color pairs.
5. **Visual size shared, target size native.** Web ≥ 24×24 CSS px (SC 2.5.8); iOS ≥ 44×44 pt;
   Android ≥ 48×48 dp. Hit areas expand without changing visuals.
6. **Respect OS settings at runtime** — text scaling, reduced motion, increased contrast, bold
   text. On native these are runtime signals, not tokens.
7. **Text must scale.** Every typography role scales with the platform's mechanism (rem +
   zoom, Dynamic Type, Android font scale, RN `allowFontScaling`). Caps
   (`maxFontSizeMultiplier`) only where layout would otherwise break, documented per
   component.
8. **Decorative by default** for icons, on every platform.
9. **Focus and keyboard are native.** Web `:focus-visible`; native focus systems for
   hardware keyboards, Full Keyboard Access, D-pad. Never imitate the web focus ring natively.
10. **Automated checks are a first pass only** — manual screen-reader checks (VoiceOver,
    TalkBack, NVDA/JAWS) remain required before "stable" on each platform.

## Equivalents

| Requirement           | Web                                                     | React Native                                                            | SwiftUI                                                       | Compose                                                         |
| --------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| Name                  | `<label for>`, `aria-label`                             | `accessibilityLabel`                                                    | `.accessibilityLabel`                                         | `contentDescription`, `semantics { }`                           |
| Role                  | native element / ARIA role                              | `accessibilityRole`                                                     | native control / `.accessibilityAddTraits`                    | `Role.Button`, `Role.Switch`, …                                 |
| State                 | `aria-checked/expanded/busy/invalid`, `disabled`        | `accessibilityState`                                                    | native, `.accessibilityValue`, traits                         | `toggleableState`, `stateDescription`, `selected`, `disabled()` |
| Label + control merge | label association                                       | `accessible` on the parent                                              | `.accessibilityElement(children: .combine)`                   | `Modifier.toggleable` on the row, `mergeDescendants`            |
| Decorative            | `aria-hidden`                                           | `accessible={false}`, `importantForAccessibility="no-hide-descendants"` | `.accessibilityHidden(true)`                                  | `contentDescription = null`, `clearAndSetSemantics {}`          |
| Error                 | `aria-invalid` + `aria-describedby`                     | hint / value + announcement                                             | `.accessibilityHint` / value                                  | `semantics { error("…") }`                                      |
| Announcement          | `role="status"` / `"alert"`                             | `AccessibilityInfo.announceForAccessibility`                            | `AccessibilityNotification.Announcement`                      | `liveRegion = LiveRegionMode.Polite`                            |
| Target size           | ≥ 24×24 px                                              | ≥ 44 pt / 48 dp (`hitSlop`)                                             | ≥ 44×44 pt (`contentShape`)                                   | ≥ 48×48 dp (`minimumInteractiveComponentSize`)                  |
| Text scaling          | rem, 200 % zoom / reflow                                | `allowFontScaling`, `maxFontSizeMultiplier`                             | Dynamic Type incl. accessibility sizes                        | `sp`, nonlinear scaling to 200 %                                |
| Reduced motion        | `prefers-reduced-motion` (token override)               | `AccessibilityInfo.isReduceMotionEnabled`                               | `\.accessibilityReduceMotion`                                 | system animator duration scale                                  |
| Focus / keyboard      | `:focus-visible`, full keyboard                         | hardware keyboard / TV focus                                            | `@FocusState`, Full Keyboard Access                           | `FocusRequester`, keyboard / D-pad                              |
| Contrast settings     | `forced-colors`                                         | —                                                                       | Increase Contrast, Differentiate Without Color                | high-contrast text                                              |
| Automated tooling     | `@storybook/addon-a11y` (axe), `eslint-plugin-jsx-a11y` | RN Testing Library a11y queries, `eslint-plugin-react-native-a11y`      | XCTest `performAccessibilityAudit()`, Accessibility Inspector | Espresso `AccessibilityChecks`, Accessibility Scanner           |

## Decisions that carry across platforms

- **Alert** has no live announcement by default on any platform (user-confirmed web decision
  applies as the shared intent).
- **Button loading** exposes a busy state and keeps its accessible name.
- **Input errors** are associated with the field and announced as an error, not only colored.
- **Tooltip** content must never be the only accessible name; on phone platforms Tooltip is
  not ported (its content becomes a hint).
- **Checkbox indeterminate** is a real third state (Compose `TriStateCheckbox` precedent; iOS
  exposes it through value text).
