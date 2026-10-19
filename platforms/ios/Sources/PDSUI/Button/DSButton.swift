import PDSTokens
import SwiftUI

/// Production Button — the SwiftUI implementation of
/// design/contracts/components/button.contract.yaml (ADR 0018).
///
/// ```swift
/// DSButton("Save changes", leadingIcon: .check, isLoading: isSaving) { save() }
/// DSButton("Delete", variant: .danger, size: .sm) { delete() }
///     .disabled(!canDelete)
/// ```
///
/// - Brand comes from the environment (`.dsTheme(_:)`); the button never knows which brand.
/// - Disabled is SwiftUI's own `.disabled(_:)`: the action never runs, VoiceOver reports
///   "dimmed". Disabled wins over `isLoading` — label shown, no spinner, not busy.
/// - `isLoading`: only the spinner shows (size unchanged), variant colors are kept, the action
///   is blocked, the button stays focusable and enabled, and VoiceOver reads "Loading" as its
///   value (iOS has no busy trait). The name stays the label.
/// - The label scales with Dynamic Type and wraps instead of truncating; 32 / 40 / 48 are
///   minimum heights. Icons and the spinner scale with the label.
/// - The hit area reaches 44 × 44pt without changing the button's size or layout.
public struct DSButton: View {
    private let title: Text
    private let variant: DSButtonVariant
    private let size: DSButtonSize
    private let leadingIcon: DSIconName?
    private let trailingIcon: DSIconName?
    private let isLoading: Bool
    private let action: () -> Void

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.dsTheme) private var theme

    /// - Parameters:
    ///   - titleKey: Short, verb-first action text (localized). Also the accessible name.
    ///   - variant: Visual emphasis. Defaults to `.primary`.
    ///   - size: Visual size. Defaults to `.md`.
    ///   - leadingIcon: Decorative catalog icon before the label.
    ///   - trailingIcon: Decorative catalog icon after the label.
    ///   - isLoading: The action was triggered and its result is pending.
    ///   - action: Runs on activation (touch, keyboard, Switch Control, Voice Control, VoiceOver).
    public init(
        _ titleKey: LocalizedStringKey,
        variant: DSButtonVariant = .primary,
        size: DSButtonSize = .md,
        leadingIcon: DSIconName? = nil,
        trailingIcon: DSIconName? = nil,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            title: Text(titleKey), variant: variant, size: size, leadingIcon: leadingIcon,
            trailingIcon: trailingIcon, isLoading: isLoading, action: action)
    }

    /// A button with a verbatim (already localized) title.
    @_disfavoredOverload
    public init<Title: StringProtocol>(
        _ title: Title,
        variant: DSButtonVariant = .primary,
        size: DSButtonSize = .md,
        leadingIcon: DSIconName? = nil,
        trailingIcon: DSIconName? = nil,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.init(
            title: Text(title), variant: variant, size: size, leadingIcon: leadingIcon,
            trailingIcon: trailingIcon, isLoading: isLoading, action: action)
    }

    private init(
        title: Text, variant: DSButtonVariant, size: DSButtonSize, leadingIcon: DSIconName?,
        trailingIcon: DSIconName?, isLoading: Bool, action: @escaping () -> Void
    ) {
        self.title = title
        self.variant = variant
        self.size = size
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.isLoading = isLoading
        self.action = action
    }

    public var body: some View {
        let state = DSButtonState(isEnabled: isEnabled, isLoading: isLoading)
        Button {
            // Loading is not disabled (it stays focusable and isn't reported as dimmed), so
            // activation is blocked here. Disabled never reaches this: SwiftUI blocks it.
            guard state.canActivate else { return }
            action()
        } label: {
            title
        }
        .buttonStyle(
            DSButtonStyle(
                theme: theme, variant: variant, size: size, leadingIcon: leadingIcon,
                trailingIcon: trailingIcon, isLoading: state.showsLoading)
        )
        .modifier(DSBusyAccessibility(isBusy: state.showsLoading))
    }
}

/// Busy, the iOS way: no busy trait exists, so the state is a localized accessibility value
/// (contract `accessibility.exposed-states.busy`). Never applied together with disabled.
private struct DSBusyAccessibility: ViewModifier {
    let isBusy: Bool

    func body(content: Content) -> some View {
        if isBusy {
            content.accessibilityValue(Text("Loading", bundle: .module))
        } else {
            content
        }
    }
}

/// The contract's visuals as a `ButtonStyle`. Internal: the public API is `DSButton`, so the
/// label is always contract text, never arbitrary content.
struct DSButtonStyle: ButtonStyle {
    let theme: DSTheme
    let variant: DSButtonVariant
    let size: DSButtonSize
    let leadingIcon: DSIconName?
    let trailingIcon: DSIconName?
    let isLoading: Bool

    func makeBody(configuration: Configuration) -> some View {
        DSButtonBody(
            configuration: configuration, theme: theme, variant: variant, size: size,
            leadingIcon: leadingIcon, trailingIcon: trailingIcon, isLoading: isLoading)
    }
}

private struct DSButtonBody: View {
    let configuration: ButtonStyleConfiguration
    let theme: DSTheme
    let variant: DSButtonVariant
    let size: DSButtonSize
    let leadingIcon: DSIconName?
    let trailingIcon: DSIconName?
    let isLoading: Bool

    @Environment(\.isEnabled) private var isEnabled
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var isHovered = false
    @State private var measuredSize: CGSize?
    /// Dynamic Type factor of the label's text-scaling anchor; icons and the spinner use it so
    /// they grow with the label (ADR 0018 decision 2).
    @ScaledMetric private var scale: CGFloat

    init(
        configuration: ButtonStyleConfiguration, theme: DSTheme, variant: DSButtonVariant,
        size: DSButtonSize, leadingIcon: DSIconName?, trailingIcon: DSIconName?, isLoading: Bool
    ) {
        self.configuration = configuration
        self.theme = theme
        self.variant = variant
        self.size = size
        self.leadingIcon = leadingIcon
        self.trailingIcon = trailingIcon
        self.isLoading = isLoading
        let anchor = DSButtonTokens.labelTypography[size]!.resolve(in: theme).textScale
        _scale = ScaledMetric(wrappedValue: 1, relativeTo: anchor.fontTextStyle)
    }

    var body: some View {
        let state = DSButtonState(
            isEnabled: isEnabled, isLoading: isLoading, isPressed: configuration.isPressed,
            isHovered: isHovered)
        let look = DSButtonAppearance(theme: theme, variant: variant, size: size, state: state)
        let m = look.metrics
        let border = DSButtonConstants.borderWidth
        let shape = RoundedRectangle(cornerRadius: m.radius)
        let foreground = Color(look.foreground)
        let iconSize = m.iconSize * scale

        HStack(spacing: m.gap) {
            if let leadingIcon {
                DSIconView(name: leadingIcon, size: iconSize, color: foreground)
            }
            configuration.label
                .dsTextStyle(m.typography)
                .foregroundStyle(foreground)
                .multilineTextAlignment(.center)
                // Never truncate: grow vertically as the label wraps (Dynamic Type, narrow width).
                .fixedSize(horizontal: false, vertical: true)
            if let trailingIcon {
                DSIconView(name: trailingIcon, size: iconSize, color: foreground)
            }
        }
        // Loading hides the content but keeps its space, so the size doesn't change.
        .opacity(look.showsSpinner ? 0 : 1)
        .overlay {
            if look.showsSpinner {
                DSSpinner(
                    size: m.spinnerSize * scale, color: Color(look.spinner),
                    lineWidth: DSButtonConstants.spinnerStrokeWidth, rotation: m.spinnerRotation)
            }
        }
        // Inner spacing sits inside the 1pt border every variant reserves.
        .padding(.vertical, m.paddingBlock + border)
        .padding(.leading, m.paddingLeading(hasIcon: leadingIcon != nil) + border)
        .padding(.trailing, m.paddingTrailing(hasIcon: trailingIcon != nil) + border)
        // A floor, not a fixed height: Dynamic Type grows the button past it.
        .frame(minHeight: m.minHeight)
        .background {
            shape.fill(look.background.map(Color.init) ?? .clear)
                .animation(stateAnimation(m.stateTransition), value: state.visualState)
        }
        .overlay {
            shape.strokeBorder(look.border.map(Color.init) ?? .clear, lineWidth: border)
        }
        .onGeometryChange(for: CGSize.self) { $0.size } action: { measuredSize = $0 }
        .modifier(
            DSHitTargetOutset(
                outset: hitTargetOutset(
                    for: measuredSize
                        ?? CGSize(width: DSButtonConstants.minimumHitTarget, height: m.minHeight))))
        // Hover only exists with a pointer (iPad trackpad / mouse); never needed on touch.
        .onHover { isHovered = $0 }
    }

    /// `motion.micro`, or none with Reduce Motion (web sets the token to 0 ms there).
    private func stateAnimation(_ t: DSTransition) -> Animation? {
        guard !reduceMotion, t.duration > 0 else { return nil }
        return .timingCurve(t.easing.x1, t.easing.y1, t.easing.x2, t.easing.y2, duration: t.duration)
            .delay(t.delay)
    }
}

/// Extends the tappable area by `outset` on each side without changing layout: pad, set the
/// hit shape, then remove the padding again.
private struct DSHitTargetOutset: ViewModifier {
    let outset: (horizontal: CGFloat, vertical: CGFloat)

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, outset.horizontal)
            .padding(.vertical, outset.vertical)
            .contentShape(Rectangle())
            .padding(.horizontal, -outset.horizontal)
            .padding(.vertical, -outset.vertical)
    }
}
