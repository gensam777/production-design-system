import PDSTokens

/// Visual emphasis (contract `properties.variant`).
public enum DSButtonVariant: String, CaseIterable, Sendable, Hashable {
    /// The main action of a view or region. Use at most one per region.
    case primary
    /// An alternative or supporting action next to a primary one.
    case secondary
    /// A low-emphasis action; no fill until interacted with.
    case tertiary
    /// A destructive or irreversible action.
    case danger
}

/// Visual size (contract `properties.size`). Changes the minimum height, inner spacing, label
/// typography and icon size.
public enum DSButtonSize: String, CaseIterable, Sendable, Hashable {
    /// Compact — dense toolbars and inline actions. Minimum height 32.
    case sm
    /// Default. Minimum height 40.
    case md
    /// Prominent — primary actions on spacious or touch-first layouts. Minimum height 48.
    case lg
}

/// Which token cell paints the container (contract `tokens.container.background` state keys).
/// Loading has no cells of its own and uses `default` (contract `states.loading`).
enum DSButtonVisualState: String, CaseIterable, Sendable, Hashable {
    case `default`, hover, pressed, disabled
}

/// A contract token path bound to the generated theme value it names.
struct DSTokenRef<Value>: Sendable {
    /// The contract path, e.g. `color.action.primary.on-color`.
    let path: String
    let keyPath: KeyPath<DSTheme, Value> & Sendable

    init(_ path: String, _ keyPath: KeyPath<DSTheme, Value> & Sendable) {
        self.path = path
        self.keyPath = keyPath
    }

    func resolve(in theme: DSTheme) -> Value { theme[keyPath: keyPath] }
}

/// Button's token bindings — the contract's `tokens` section
/// (design/contracts/components/button.contract.yaml), cell for cell. `nil` is the contract's
/// `none` (no paint). The tests compare `contractCells` with the YAML and resolve every binding
/// in Brand A and Brand B; `npm run contracts:validate` compares the path set.
enum DSButtonTokens {
    typealias ColorRef = DSTokenRef<DSColorValue>
    typealias Metric = DSTokenRef<Double>

    // MARK: container

    static let background: [DSButtonVariant: [DSButtonVisualState: ColorRef?]] = [
        .primary: [
            .default: ColorRef("color.action.primary.default", \.color.action.primary.default),
            .hover: ColorRef("color.action.primary.hover", \.color.action.primary.hover),
            .pressed: ColorRef("color.action.primary.active", \.color.action.primary.active),
            .disabled: ColorRef("color.action.primary.disabled", \.color.action.primary.disabled),
        ],
        .secondary: [
            .default: ColorRef("color.action.secondary.default", \.color.action.secondary.default),
            .hover: ColorRef("color.action.secondary.hover", \.color.action.secondary.hover),
            .pressed: ColorRef("color.action.secondary.hover", \.color.action.secondary.hover),
            .disabled: ColorRef("color.action.secondary.default", \.color.action.secondary.default),
        ],
        .tertiary: [
            .default: nil,
            .hover: ColorRef("color.action.tertiary.hover", \.color.action.tertiary.hover),
            .pressed: ColorRef("color.action.tertiary.hover", \.color.action.tertiary.hover),
            .disabled: nil,
        ],
        .danger: [
            .default: ColorRef("color.action.danger.default", \.color.action.danger.default),
            .hover: ColorRef("color.action.danger.hover", \.color.action.danger.hover),
            .pressed: ColorRef("color.action.danger.hover", \.color.action.danger.hover),
            .disabled: ColorRef("color.action.danger.disabled", \.color.action.danger.disabled),
        ],
    ]

    static let borderColor: [DSButtonVariant: ColorRef?] = [
        .primary: nil,
        .secondary: ColorRef("color.border.default", \.color.border.default),
        .tertiary: nil,
        .danger: nil,
    ]

    static let radius = Metric("radius.control", \.radius.control)

    static let paddingBlock: [DSButtonSize: Metric] = [
        .sm: Metric("space.inset.xs", \.space.inset.xs),
        .md: Metric("space.inset.sm", \.space.inset.sm),
        .lg: Metric("space.inset.sm", \.space.inset.sm),
    ]

    static let paddingInline: [DSButtonSize: Metric] = [
        .sm: Metric("space.inset.md", \.space.inset.md),
        .md: Metric("space.inset.lg", \.space.inset.lg),
        .lg: Metric("space.inset.xl", \.space.inset.xl),
    ]

    static let paddingInlineIconSide: [DSButtonSize: Metric] = [
        .sm: Metric("space.inset.sm", \.space.inset.sm),
        .md: Metric("space.inset.md", \.space.inset.md),
        .lg: Metric("space.inset.lg", \.space.inset.lg),
    ]

    static let gap: [DSButtonSize: Metric] = [
        .sm: Metric("space.inline.xs", \.space.inline.xs),
        .md: Metric("space.inline.sm", \.space.inline.sm),
        .lg: Metric("space.inline.sm", \.space.inline.sm),
    ]

    static let stateTransition = DSTokenRef<DSTransition>("motion.micro", \.motion.micro)

    // MARK: label

    /// Label cells exist for `default` and `disabled`; hover / pressed keep the default label.
    static let labelColor: [DSButtonVariant: (default: ColorRef, disabled: ColorRef)] = [
        .primary: (
            ColorRef("color.action.primary.on-color", \.color.action.primary.onColor),
            ColorRef("color.text.disabled", \.color.text.disabled)
        ),
        .secondary: (
            ColorRef("color.text.primary", \.color.text.primary),
            ColorRef("color.text.disabled", \.color.text.disabled)
        ),
        .tertiary: (
            ColorRef("color.text.primary", \.color.text.primary),
            ColorRef("color.text.disabled", \.color.text.disabled)
        ),
        .danger: (
            ColorRef("color.action.danger.on-color", \.color.action.danger.onColor),
            ColorRef("color.text.disabled", \.color.text.disabled)
        ),
    ]

    static let labelTypography: [DSButtonSize: DSTokenRef<DSTextStyle>] = [
        .sm: DSTokenRef("text.label.sm.medium", \.typography.label.sm.medium),
        .md: DSTokenRef("text.label.md.medium", \.typography.label.md.medium),
        .lg: DSTokenRef("text.label.lg.medium", \.typography.label.lg.medium),
    ]

    // MARK: icons

    static let leadingIconSize: [DSButtonSize: Metric] = [
        .sm: Metric("icon.sm", \.icon.sm),
        .md: Metric("icon.md", \.icon.md),
        .lg: Metric("icon.lg", \.icon.lg),
    ]

    static let trailingIconSize: [DSButtonSize: Metric] = leadingIconSize

    // MARK: spinner

    static let spinnerColor: [DSButtonVariant: ColorRef] = [
        .primary: ColorRef("color.action.primary.on-color", \.color.action.primary.onColor),
        .secondary: ColorRef("color.text.primary", \.color.text.primary),
        .tertiary: ColorRef("color.text.primary", \.color.text.primary),
        .danger: ColorRef("color.action.danger.on-color", \.color.action.danger.onColor),
    ]

    static let spinnerSize: [DSButtonSize: Metric] = leadingIconSize

    static let spinnerRadius = DSTokenRef<DSCornerShape>("radius.full", \.radius.full)

    static let spinnerRotation = DSTokenRef<DSTransition>("motion.spinner", \.motion.spinner)

    // MARK: focus indicator

    /// Bound for contract parity. iOS keeps its system focus effect (Full Keyboard Access), so
    /// these are not drawn — contract `intentional-differences.focus-indicator-rendering`.
    static let focusRing = ColorRef("color.focus.ring", \.color.focus.ring)
    static let focusRingOffset = ColorRef("color.focus.ring-offset", \.color.focus.ringOffset)

    // MARK: contract shape

    /// The bindings flattened the way the contract YAML is (`part.property[.selector…]` →
    /// token path, `none` for no paint), for the cell-by-cell parity test.
    static var contractCells: [String: String] {
        var cells: [String: String] = [:]
        let path = { (ref: ColorRef?) in ref?.path ?? "none" }
        for variant in DSButtonVariant.allCases {
            let v = variant.rawValue
            for state in DSButtonVisualState.allCases {
                cells["container.background.\(v).\(state.rawValue)"] = path(background[variant]?[state] ?? nil)
            }
            cells["container.border-color.\(v)"] = path(borderColor[variant] ?? nil)
            cells["label.color.\(v).default"] = labelColor[variant]?.default.path
            cells["label.color.\(v).disabled"] = labelColor[variant]?.disabled.path
            cells["spinner.color.\(v)"] = spinnerColor[variant]?.path
        }
        for size in DSButtonSize.allCases {
            let s = size.rawValue
            cells["container.padding-block.\(s)"] = paddingBlock[size]?.path
            cells["container.padding-inline.\(s)"] = paddingInline[size]?.path
            cells["container.padding-inline-icon-side.\(s)"] = paddingInlineIconSide[size]?.path
            cells["container.gap.\(s)"] = gap[size]?.path
            cells["label.typography.\(s)"] = labelTypography[size]?.path
            cells["leadingIcon.size.\(s)"] = leadingIconSize[size]?.path
            cells["trailingIcon.size.\(s)"] = trailingIconSize[size]?.path
            cells["spinner.size.\(s)"] = spinnerSize[size]?.path
        }
        cells["container.radius"] = radius.path
        cells["container.state-transition"] = stateTransition.path
        cells["spinner.radius"] = spinnerRadius.path
        cells["spinner.rotation"] = spinnerRotation.path
        cells["focusIndicator.color"] = focusRing.path
        cells["focusIndicator.offset-color"] = focusRingOffset.path
        return cells
    }
}

/// Contract `component-constants` and `sizing` — deliberately not tokens.
enum DSButtonConstants {
    static let borderWidth: Double = 1
    static let spinnerStrokeWidth: Double = 2
    /// Minimum (not fixed) heights — the button grows with Dynamic Type.
    static let visualHeight: [DSButtonSize: Double] = [.sm: 32, .md: 40, .lg: 48]
    /// Contract `sizing.hit-target.minimum.ios`.
    static let minimumHitTarget: Double = 44
}
