/**
 * Do not edit directly, this file was auto-generated.
 */

export const ColorGray50 = "#f9fafb"; // Neutral primitive scale — surfaces, borders, text.
export const ColorGray100 = "#f3f4f6";
export const ColorGray200 = "#e5e7eb";
export const ColorGray300 = "#d1d5db";
export const ColorGray400 = "#9ca3af";
export const ColorGray500 = "#6b7280";
export const ColorGray600 = "#4b5563";
export const ColorGray700 = "#374151";
export const ColorGray800 = "#1f2937";
export const ColorGray900 = "#111827";
export const ColorBlue50 = "#eff6ff"; // Hue ramp (Core, shared). Brand A selects it as its primary in src/tokens/brands/brand-a — semantic tokens never alias a hue ramp directly, only brand.color.primary.*.
export const ColorBlue100 = "#dbeafe";
export const ColorBlue200 = "#bfdbfe";
export const ColorBlue300 = "#93c5fd";
export const ColorBlue400 = "#60a5fa";
export const ColorBlue500 = "#3b82f6";
export const ColorBlue600 = "#2563eb";
export const ColorBlue700 = "#1d4ed8";
export const ColorBlue800 = "#1e40af";
export const ColorBlue900 = "#1e3a8a";
export const ColorViolet50 = "#f5f3ff"; // Hue ramp (Core, shared). Brand B (fictional demo brand) selects it as its primary in src/tokens/brands/brand-b.
export const ColorViolet100 = "#ede9fe";
export const ColorViolet200 = "#ddd6fe";
export const ColorViolet300 = "#c4b5fd";
export const ColorViolet400 = "#a78bfa";
export const ColorViolet500 = "#8b5cf6";
export const ColorViolet600 = "#7c3aed";
export const ColorViolet700 = "#6d28d9";
export const ColorViolet800 = "#5b21b6";
export const ColorViolet900 = "#4c1d95";
export const ColorRed50 = "#fef2f2"; // Feedback primitive — danger/error. Reduced scale (subtle/default/emphasis only, no full ramp).
export const ColorRed100 = "#fee2e2";
export const ColorRed600 = "#dc2626";
export const ColorRed700 = "#b91c1c";
export const ColorGreen50 = "#f0fdf4"; // Feedback primitive — success. Reduced scale.
export const ColorGreen100 = "#dcfce7";
export const ColorGreen600 = "#16a34a";
export const ColorGreen700 = "#15803d";
export const ColorAmber50 = "#fffbeb"; // Feedback primitive — warning. Reduced scale.
export const ColorAmber100 = "#fef3c7";
export const ColorAmber600 = "#d97706";
export const ColorAmber700 = "#b45309";
export const ColorAmber800 = "#92400e";
export const ColorCyan50 = "#ecfeff"; // Feedback primitive — info. Distinct hue from brand blue so info doesn't read as a primary action. Reduced scale.
export const ColorCyan100 = "#cffafe";
export const ColorCyan600 = "#0891b2";
export const ColorCyan700 = "#0e7490";
export const ColorWhite = "#ffffff"; // Fixed primitive, no scale.
export const ColorBlack = "#000000"; // Fixed primitive, no scale.
export const ColorOverlaySubtle = "#0000000d"; // Alpha-blended black. Named generically (not shadow-specific) so a future surface.overlay/scrim token can reuse it — see governance/decisions/0007-elevation-token-architecture.md.
export const ColorOverlayDefault = "#00000014";
export const ColorOverlayStrong = "#0000001f";
export const ColorSurfaceCanvas = "#f9fafb"; // App page background.
export const ColorSurfaceDefault = "#ffffff"; // Default component surface (cards, panels).
export const ColorSurfaceRaised = "#ffffff"; // Elevated surfaces (modals, popovers). Differentiated from `default` by shadow/elevation, not color, until proven otherwise.
export const ColorSurfaceSunken = "#f3f4f6"; // Recessed areas (input wells, code blocks).
export const ColorSurfaceInverse = "#111827"; // Dark surface used in light mode (tooltips, dark banners).
export const ColorSurfaceDisabled = "#f3f4f6"; // Disabled component fill.
export const ColorTextPrimary = "#111827"; // 17.74:1 on surface.default. Body/heading text.
export const ColorTextSecondary = "#374151"; // 10.31:1 on surface.default. De-emphasized text.
export const ColorTextTertiary = "#6b7280"; // 4.83:1 on surface.default. Helper/placeholder text.
export const ColorTextDisabled = "#9ca3af"; // 2.54:1 on surface.default — below AA, exempt per WCAG for disabled content.
export const ColorTextInverse = "#ffffff"; // Text on surface.inverse (dark surfaces).
export const ColorTextLink = "#2563eb"; // Brandable (brand.color.primary.600). Must reach 4.5:1 on surface.default/canvas/sunken — enforced per brand by the token build (Brand A 5.17:1 on surface.default).
export const ColorTextLinkHover = "#1d4ed8"; // Brandable (brand.color.primary.700). Must reach 4.5:1 on surface.default — enforced per brand by the token build (Brand A 6.70:1).
export const ColorTextDanger = "#b91c1c"; // 6.47:1 on surface.default.
export const ColorTextSuccess = "#15803d"; // 5.02:1 on surface.default.
export const ColorTextWarning = "#92400e"; // 7.09:1 on surface.default.
export const ColorBorderSubtle = "#e5e7eb"; // Decorative/structural divider only — does not meet 3:1 non-text contrast on its own.
export const ColorBorderDefault = "#d1d5db"; // 1.47:1 on surface.default. Decorative/structural only, e.g. default resting-state input outline where the input has other affordances (fill, label). Not sufficient alone to satisfy WCAG 1.4.11 for a component whose ONLY boundary cue is its border — use border.strong for that.
export const ColorBorderStrong = "#6b7280"; // 4.83:1 on surface.default — clears the 3:1 non-text minimum. Use where a border is the sole indicator of an interactive element's boundary or state.
export const ColorBorderDanger = "#dc2626";
export const ColorBorderSuccess = "#16a34a";
export const ColorBorderWarning = "#d97706";
export const ColorActionPrimaryDefault = "#2563eb";
export const ColorActionPrimaryHover = "#1d4ed8";
export const ColorActionPrimaryActive = "#1e40af";
export const ColorActionPrimaryDisabled = "#d1d5db";
export const ColorActionPrimaryOnColor = "#ffffff"; // Shared (not brandable). Must reach 4.5:1 on action.primary.default/hover/active for every brand — enforced by the token build (Brand A 5.17:1 on default).
export const ColorActionSecondaryDefault = "#ffffff"; // Paired with border.default as an outline button; no separate fill token needed.
export const ColorActionSecondaryHover = "#f3f4f6";
export const ColorActionTertiaryHover = "#f3f4f6"; // Ghost/text button resting state has no background — 'transparent' isn't tokenized as a color. Only the hover fill needs a token.
export const ColorActionDangerDefault = "#dc2626";
export const ColorActionDangerHover = "#b91c1c";
export const ColorActionDangerOnColor = "#ffffff"; // 4.83:1 on action.danger.default.
export const ColorFeedbackSuccessSubtle = "#f0fdf4";
export const ColorFeedbackSuccessDefault = "#16a34a"; // Icon/accent use; 3.30:1 vs white meets non-text minimum only.
export const ColorFeedbackSuccessEmphasis = "#15803d";
export const ColorFeedbackSuccessOnColor = "#ffffff"; // 5.02:1 on emphasis — on-color tokens are validated against `emphasis`, not `default`.
export const ColorFeedbackWarningSubtle = "#fffbeb";
export const ColorFeedbackWarningDefault = "#d97706"; // Icon/accent use; 3.19:1 vs white meets non-text minimum only.
export const ColorFeedbackWarningEmphasis = "#b45309";
export const ColorFeedbackWarningOnColor = "#ffffff"; // 5.02:1 on emphasis.
export const ColorFeedbackDangerSubtle = "#fef2f2";
export const ColorFeedbackDangerDefault = "#dc2626";
export const ColorFeedbackDangerEmphasis = "#b91c1c";
export const ColorFeedbackDangerOnColor = "#ffffff"; // 6.47:1 on emphasis.
export const ColorFeedbackInfoSubtle = "#ecfeff";
export const ColorFeedbackInfoDefault = "#0891b2"; // Icon/accent use; 3.68:1 vs white meets non-text minimum only.
export const ColorFeedbackInfoEmphasis = "#0e7490";
export const ColorFeedbackInfoOnColor = "#ffffff"; // 5.36:1 on emphasis.
export const ColorFocusRing = "#2563eb"; // Brandable (brand.color.primary.600). Must clear the WCAG 2.4.11 3:1 minimum against surface.canvas and surface.raised — enforced per brand by the token build (Brand A 4.95:1 / 5.17:1).
export const ColorFocusRingOffset = "#f9fafb"; // Separation gap between an element and its focus ring.
export const ColorShadowSubtle = "#0000000d"; // elevation.raised shadow color.
export const ColorShadowDefault = "#00000014"; // elevation.overlay shadow color.
export const ColorShadowStrong = "#0000001f"; // elevation.modal shadow color.
export const ColorSwitchTrackBackgroundOffDefault = "#6b7280"; // Switch track fill, Off + Default. Component-scoped (not a shared `action.neutral.*` semantic family) — Switch is currently the only consumer of this neutral filled interactive surface; promote to a shared token only if a second component needs the same concept. Same primitive as `border.strong`/`text.tertiary` (4.83:1 on surface.default, clears the 3:1 non-text minimum) but not reused directly as either — those are a stroke-role and a text-role token respectively, not a fill.
export const ColorSwitchTrackBackgroundOffHover = "#4b5563"; // Switch track fill, Off + Hover. Mirrors the darken-on-hover step every `action.*` group already uses (e.g. `action.primary.default` → `.hover`).
export const ColorSwitchTrackBackgroundOffDisabled = "#d1d5db"; // Switch track fill, Off + Disabled. Same primitive as `action.primary.disabled` — Off+Disabled and On+Disabled deliberately converge on the same muted gray, matching this system's existing disabled-state convention of flattening state distinctions rather than the resting-state color.
export const SizeIconSm = 16; // Raw scale, no meaning attached. Matches Button Sm's existing icon dimension.
export const SizeIconMd = 20; // Matches Button Md's existing icon dimension.
export const SizeIconLg = 24; // Matches Button Lg's existing icon dimension.
export const MotionDurationInstant = 0;
export const MotionDurationFast = 100;
export const MotionDurationBase = 200;
export const MotionDurationSlow = 300;
export const MotionDurationSlower = 400; // Headroom — no semantic role aliases this step in V1.
export const MotionEasingStandard = [0.4, 0, 0.2, 1]; // Default for most state changes — eases in and out.
export const MotionEasingDecelerate = [0, 0, 0.2, 1]; // Starts fast, settles slow — for things entering/appearing.
export const MotionEasingAccelerate = [0.4, 0, 1, 1]; // Starts slow, speeds up — for things exiting/disappearing.
export const MotionMicro = {
  duration: 100,
  delay: "0ms",
  timingFunction: [0.4, 0, 0.2, 1],
}; // Hover, press/active, focus-ring appearance. Shared across all three for V1 — split only if a real component proves different timing is needed.
export const MotionOverlayEnter = {
  duration: 200,
  delay: "0ms",
  timingFunction: [0, 0, 0.2, 1],
}; // Menu/popover/tooltip opening.
export const MotionOverlayExit = {
  duration: 100,
  delay: "0ms",
  timingFunction: [0.4, 0, 1, 1],
}; // Menu/popover/tooltip closing. Faster than its matching enter — standard UX practice.
export const MotionModalEnter = {
  duration: 300,
  delay: "0ms",
  timingFunction: [0, 0, 0.2, 1],
}; // Dialog/modal/drawer opening.
export const MotionModalExit = {
  duration: 200,
  delay: "0ms",
  timingFunction: [0.4, 0, 1, 1],
}; // Dialog/modal/drawer closing. Faster than its matching enter — standard UX practice.
export const RadiusNone = 0; // Raw scale, no meaning attached. Explicit zero — flat/square corners.
export const RadiusSm = 4;
export const RadiusMd = 8;
export const RadiusLg = 12;
export const RadiusXl = 16;
export const RadiusMax = 9999; // Figma variable name: radius/full. Renamed to `max` in this file only — Style Dictionary merges all token files into one flat path tree (unlike Figma's collection-scoped namespacing), so this primitive can't share the exact path `radius.full` with the semantic radius.full role below, which deliberately reuses the same name as its Figma counterpart. See governance/decisions/0006-radius-token-architecture.md. Deliberately oversized so it always resolves to a full capsule/circle regardless of element size — not a real measurement.
export const RadiusFlat = 0; // Tables, dividers, code blocks — explicit square corners.
export const RadiusControl = 4; // Buttons, inputs, selects, tabs, tooltips. Brandable via brand.radius.control (Brand A 4px, Brand B 8px).
export const RadiusContainer = 12; // Cards, panels, alerts, modals, popovers, dialogs. Brandable via brand.radius.container (Brand A 12px, Brand B 16px).
export const RadiusCheckbox = 4; // Component-scoped and shared across brands (NOT brandable): the Checkbox box. Stays 4px so a 16px checkbox remains visibly square — distinct from Radio — even when a brand rounds radius.control.
export const RadiusFull = 9999; // Pills, avatars, circular icons/status dots. Aliases the `radius.max` primitive (Figma name: radius/full — see radius.max's description for why the code-side primitive name differs).
export const ShadowNoneOffsetX = 0;
export const ShadowNoneOffsetY = 0;
export const ShadowNoneBlur = 0;
export const ShadowNoneSpread = 0;
export const ShadowSmOffsetX = 0;
export const ShadowSmOffsetY = 1;
export const ShadowSmBlur = 2;
export const ShadowSmSpread = 0;
export const ShadowMdOffsetX = 0;
export const ShadowMdOffsetY = 2;
export const ShadowMdBlur = 6;
export const ShadowMdSpread = 0;
export const ShadowLgOffsetX = 0;
export const ShadowLgOffsetY = 4;
export const ShadowLgBlur = 12;
export const ShadowLgSpread = 0;
export const ShadowXlOffsetX = 0;
export const ShadowXlOffsetY = 8;
export const ShadowXlBlur = 24; // Headroom — no semantic elevation role aliases the shadow/xl step in V1.
export const ShadowXlSpread = 0;
export const SpaceNone = 0; // Hybrid 4/8px rhythm — raw scale, no meaning attached. Explicit zero, used by semantic overrides (flush/collapsed variants).
export const Space3xs = 2; // Added alongside Switch V1 — a thumb-inside-track inset needed a step below 2xs (4px). Mirrored from the Figma `space/3xs` primitive (scope: GAP).
export const Space2xs = 4;
export const SpaceXs = 8;
export const SpaceSm = 12;
export const SpaceMd = 16;
export const SpaceLg = 20;
export const SpaceXl = 24;
export const Space2xl = 32;
export const Space3xl = 40;
export const Space4xl = 48;
export const Space5xl = 64; // Largest step in this scale — no 80/96px in V1.
export const SpaceInsetNone = 0; // Explicit zero-padding override (flush variant).
export const SpaceInset3xs = 2; // Tightest inset — a thumb-inside-track type inset (e.g. Switch's thumb padding). Added alongside Switch V1; not intended for general control padding, use xs or above for that.
export const SpaceInsetXs = 4; // Badges, tags, chips.
export const SpaceInsetSm = 8; // Compact controls (small button, dense input).
export const SpaceInsetMd = 12; // Default control padding (button, input, list item).
export const SpaceInsetLg = 16; // Default card/panel padding.
export const SpaceInsetXl = 20; // Spacious card/panel.
export const SpaceInset2xl = 24; // Large surfaces (modal, drawer).
export const SpaceStackNone = 0; // Explicit zero-gap override.
export const SpaceStackXs = 4; // Icon+label stacked, tightly coupled pairs.
export const SpaceStackSm = 8; // Label → input, field → helper text.
export const SpaceStackMd = 12; // Items within a group (form fields, list items).
export const SpaceStackLg = 16; // Default spacing between components.
export const SpaceStackXl = 24; // Spacing between sub-sections within a component group.
export const SpaceStack2xl = 32; // Spacing between distinct content blocks.
export const SpaceInlineNone = 0; // Explicit zero-gap override.
export const SpaceInlineXs = 4; // Icon-to-text gap.
export const SpaceInlineSm = 8; // Tightly grouped controls (button group, tag list).
export const SpaceInlineMd = 12; // Default gap between inline elements.
export const SpaceInlineLg = 16; // Loosely grouped controls, nav items.
export const SpaceLayoutSm = 24; // Section padding, compact/mobile layout.
export const SpaceLayoutMd = 32; // Default section padding/margin.
export const SpaceLayoutLg = 40; // Generous section spacing.
export const SpaceLayoutXl = 48; // Major section separation.
export const SpaceLayout2xl = 64; // Page-level region separation.
export const FontFamilyMono = [
  "Roboto Mono",
  "SFMono-Regular",
  "Consolas",
  "monospace",
]; // Code/data typeface — inline code, IDs, tabular/numeric values.
export const FontSizeXs = "0.75rem"; // 12px. Captions/labels only — never primary reading content.
export const FontSizeSm = "0.875rem"; // 14px.
export const FontSizeMd = "1rem"; // 16px. Base body size — the floor for primary reading content.
export const FontSizeLg = "1.125rem"; // 18px.
export const FontSizeXl = "1.25rem"; // 20px.
export const FontSize2xl = "1.5rem"; // 24px.
export const FontSize3xl = "1.875rem"; // 30px.
export const FontSize4xl = "2.25rem"; // 36px. Largest step in this scale — no editorial/marketing display sizes.
export const FontWeightRegular = 400;
export const FontWeightMedium = 500;
export const FontWeightSemibold = 600;
export const FontWeightBold = 700;
export const FontLineHeightTight = 1.25; // Unitless ratio. Headings.
export const FontLineHeightNormal = 1.5; // Unitless ratio. Body/UI text — matches WCAG 1.4.8's recommended paragraph line-height.
export const FontLetterSpacingTight = "-0.01em"; // Large headings only — modest by design, never applied to body/label/caption sizes.
export const FontLetterSpacingNormal = "0em";
export const ViewportMd = 768; // Mobile-first breakpoint threshold (min-width). Raw scale value, no meaning attached — see governance/decisions/0009-responsive-token-architecture.md.
export const ViewportLg = 1024;
export const ViewportXl = 1280; // Also referenced by layout.container.maxWidth — the container cap equals the widest V1 breakpoint threshold, not a separately chosen number.
export const ElevationFlat = "none"; // Resting/inline elements — table rows, default buttons, flush surfaces. No shadow (matches the Figma Elevation/Flat Effect Style, which has an empty effects array rather than a zero-value shadow).
export const ElevationRaised = {
  offsetX: 0,
  offsetY: 1,
  blur: 2,
  spread: 0,
  color: "#0000000d",
}; // Cards, panels — subtly above canvas.
export const ElevationOverlay = {
  offsetX: 0,
  offsetY: 2,
  blur: 6,
  spread: 0,
  color: "#00000014",
}; // Dropdowns, popovers, tooltips.
export const ElevationModal = {
  offsetX: 0,
  offsetY: 4,
  blur: 12,
  spread: 0,
  color: "#0000001f",
}; // Dialogs, modals, drawers.
export const IconSm = 16; // Compact icon size used in dense controls.
export const IconMd = 20; // Default icon size used across standard controls.
export const IconLg = 24; // Larger icon size used for prominent or touch-first controls.
export const LayoutContainerMaxWidth = 1280; // Page/app-shell container cap. A single value, not one per breakpoint: CSS `max-width` is fluid (100%) below this width and capped above it — the same token produces both behaviors. Page gutters are a separate, already-existing concern — see space.layout.* (governance/decisions/0004-spacing-token-architecture.md), not duplicated here.
export const TextHeadingXlSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "2.25rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Largest heading step — hero/display headings. Semibold weight.
export const TextHeadingXlBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "2.25rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Largest heading step — hero/display headings. Bold weight.
export const TextHeadingLgSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.875rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Page title. Semibold weight.
export const TextHeadingLgBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.875rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Page title. Bold weight.
export const TextHeadingMdSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.5rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Section title. Semibold weight.
export const TextHeadingMdBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.5rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
}; // Section title. Bold weight.
export const TextHeadingSmSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.25rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Card/dialog title. Semibold weight.
export const TextHeadingSmBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.25rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Card/dialog title. Bold weight.
export const TextBodyLgRegular = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.125rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Emphasized body text — intros, lead paragraphs. Regular weight.
export const TextBodyLgMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.125rem",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Emphasized body text — intros, lead paragraphs. Medium weight.
export const TextBodyLgSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.125rem",
  fontWeight: 600,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Emphasized body text — intros, lead paragraphs. Semibold weight.
export const TextBodyLgBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1.125rem",
  fontWeight: 700,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Emphasized body text — intros, lead paragraphs. Bold weight.
export const TextBodyMdRegular = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Default body/UI text. Regular weight.
export const TextBodyMdMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Default body/UI text. Medium weight.
export const TextBodyMdSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 600,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Default body/UI text. Semibold weight.
export const TextBodyMdBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 700,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Default body/UI text. Bold weight.
export const TextBodySmRegular = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Secondary/dense UI text. Regular weight.
export const TextBodySmMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Secondary/dense UI text. Medium weight.
export const TextBodySmSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 600,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Secondary/dense UI text. Semibold weight.
export const TextBodySmBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 700,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Secondary/dense UI text. Bold weight.
export const TextLabelLgMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — larger UI text contexts. Medium weight.
export const TextLabelLgSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — larger UI text contexts. Semibold weight.
export const TextLabelLgBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "1rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — larger UI text contexts. Bold weight.
export const TextLabelMdMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — default size. Medium weight.
export const TextLabelMdSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — default size. Semibold weight.
export const TextLabelMdBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — default size. Bold weight.
export const TextLabelSmMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.75rem",
  fontWeight: 500,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — compact UI. Medium weight.
export const TextLabelSmSemibold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.75rem",
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — compact UI. Semibold weight.
export const TextLabelSmBold = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.75rem",
  fontWeight: 700,
  lineHeight: 1.25,
  letterSpacing: "0em",
}; // Form labels, buttons, tabs — compact UI. Bold weight.
export const TextCaptionMdRegular = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Helper text, metadata, timestamps — default size. Regular weight.
export const TextCaptionMdMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Helper text, metadata, timestamps — default size. Medium weight.
export const TextCaptionSmRegular = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.75rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Helper text, metadata, timestamps — compact. Regular weight.
export const TextCaptionSmMedium = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  fontSize: "0.75rem",
  fontWeight: 500,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Helper text, metadata, timestamps — compact. Medium weight.
export const TextCodeMdRegular = {
  fontFamily: ["Roboto Mono", "SFMono-Regular", "Consolas", "monospace"],
  fontSize: "0.875rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Inline code, IDs — default size. Regular weight.
export const TextCodeSmRegular = {
  fontFamily: ["Roboto Mono", "SFMono-Regular", "Consolas", "monospace"],
  fontSize: "0.75rem",
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: "0em",
}; // Inline code, IDs — compact. Regular weight.
