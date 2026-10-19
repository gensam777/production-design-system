import CoreGraphics
import PDSTokens

/// The behavioral state of a button, from its inputs — contract `states.precedence`
/// (disabled > loading > default), then the platform-owned pressed / hover visuals.
struct DSButtonState: Equatable, Sendable {
    let isEnabled: Bool
    let isLoading: Bool
    let isPressed: Bool
    let isHovered: Bool

    init(isEnabled: Bool, isLoading: Bool, isPressed: Bool = false, isHovered: Bool = false) {
        self.isEnabled = isEnabled
        self.isLoading = isLoading
        self.isPressed = isPressed
        self.isHovered = isHovered
    }

    /// Loading applies only while enabled: disabled wins (label shown, no spinner, not busy).
    var showsLoading: Bool { isEnabled && isLoading }

    /// Whether the action runs when the button is activated.
    var canActivate: Bool { isEnabled && !isLoading }

    /// The container token cell. Loading uses `default` and never shows pressed / hover.
    var visualState: DSButtonVisualState {
        if !isEnabled { return .disabled }
        if isLoading { return .default }
        if isPressed { return .pressed }
        if isHovered { return .hover }
        return .default
    }
}

/// Everything a button paints, resolved from the theme for one variant × size × state.
struct DSButtonAppearance: Equatable, Sendable {
    /// `nil` = no fill (contract `none`).
    let background: DSColorValue?
    /// `nil` = the reserved 1pt border stays clear.
    let border: DSColorValue?
    /// Label and icon color.
    let foreground: DSColorValue
    let spinner: DSColorValue
    let showsSpinner: Bool
    let metrics: DSButtonMetrics

    init(theme: DSTheme, variant: DSButtonVariant, size: DSButtonSize, state: DSButtonState) {
        let t = DSButtonTokens.self
        let cell = state.visualState
        background = (t.background[variant]?[cell] ?? nil)?.resolve(in: theme)
        border = (t.borderColor[variant] ?? nil)?.resolve(in: theme)
        let label = t.labelColor[variant]!
        foreground = (cell == .disabled ? label.disabled : label.default).resolve(in: theme)
        spinner = t.spinnerColor[variant]!.resolve(in: theme)
        showsSpinner = state.showsLoading
        metrics = DSButtonMetrics(theme: theme, size: size)
    }
}

/// Unscaled size metrics (pt at the default text size). Icons and the spinner are scaled with
/// Dynamic Type by the view; the minimum height is a floor and never scales down.
struct DSButtonMetrics: Equatable, Sendable {
    let minHeight: Double
    let paddingBlock: Double
    let paddingInline: Double
    let paddingInlineIconSide: Double
    let gap: Double
    let iconSize: Double
    let spinnerSize: Double
    let radius: Double
    let typography: DSTextStyle
    let stateTransition: DSTransition
    let spinnerRotation: DSTransition

    init(theme: DSTheme, size: DSButtonSize) {
        let t = DSButtonTokens.self
        minHeight = DSButtonConstants.visualHeight[size]!
        paddingBlock = t.paddingBlock[size]!.resolve(in: theme)
        paddingInline = t.paddingInline[size]!.resolve(in: theme)
        paddingInlineIconSide = t.paddingInlineIconSide[size]!.resolve(in: theme)
        gap = t.gap[size]!.resolve(in: theme)
        iconSize = t.leadingIconSize[size]!.resolve(in: theme)
        spinnerSize = t.spinnerSize[size]!.resolve(in: theme)
        radius = t.radius.resolve(in: theme)
        typography = t.labelTypography[size]!.resolve(in: theme)
        stateTransition = t.stateTransition.resolve(in: theme)
        spinnerRotation = t.spinnerRotation.resolve(in: theme)
    }

    /// Leading / trailing inner spacing: an icon on that side reduces it one inset step.
    func paddingLeading(hasIcon: Bool) -> Double { hasIcon ? paddingInlineIconSide : paddingInline }
    func paddingTrailing(hasIcon: Bool) -> Double { hasIcon ? paddingInlineIconSide : paddingInline }
}

/// How far to extend the hit area on each axis so it reaches `minimum` (44pt on iOS) without
/// changing the button's size or the layout around it. A button already that large — e.g.
/// grown by Dynamic Type — needs none.
func hitTargetOutset(for size: CGSize, minimum: Double = DSButtonConstants.minimumHitTarget)
    -> (horizontal: CGFloat, vertical: CGFloat)
{
    (
        horizontal: max(0, (minimum - size.width) / 2).rounded(.up),
        vertical: max(0, (minimum - size.height) / 2).rounded(.up)
    )
}
