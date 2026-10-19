import CoreGraphics
import PDSTokens
import Testing

@testable import PDSUI

private let brands: [(name: String, theme: DSTheme)] = [("brand-a", .brandA), ("brand-b", .brandB)]

/// Contract token path → the generated Swift member path (ADR 0013 / 0016 naming: the `text`
/// root is `typography`, kebab segments become lowerCamelCase).
private func swiftMemberPath(_ contractPath: String) -> String {
    contractPath.split(separator: ".").enumerated().map { index, segment -> String in
        if index == 0, segment == "text" { return "typography" }
        let parts = segment.split(separator: "-")
        return ([String(parts[0])] + parts.dropFirst().map { $0.prefix(1).uppercased() + $0.dropFirst() })
            .joined()
    }.joined(separator: ".")
}

/// Every binding in DSButtonTokens with its key path rendered as text.
private func allBindings() -> [(path: String, keyPath: String)] {
    func describe<V>(_ ref: DSTokenRef<V>) -> (String, String) { (ref.path, "\(ref.keyPath)") }
    let t = DSButtonTokens.self
    var out: [(String, String)] = []
    for variant in DSButtonVariant.allCases {
        for state in DSButtonVisualState.allCases {
            if let ref = t.background[variant]?[state] ?? nil { out.append(describe(ref)) }
        }
        if let ref = t.borderColor[variant] ?? nil { out.append(describe(ref)) }
        out.append(describe(t.labelColor[variant]!.default))
        out.append(describe(t.labelColor[variant]!.disabled))
        out.append(describe(t.spinnerColor[variant]!))
    }
    for size in DSButtonSize.allCases {
        for map in [t.paddingBlock, t.paddingInline, t.paddingInlineIconSide, t.gap, t.leadingIconSize, t.trailingIconSize, t.spinnerSize] {
            out.append(describe(map[size]!))
        }
        out.append(describe(t.labelTypography[size]!))
    }
    // spinnerRadius (`radius.full`) is left out: DSCornerShape is a single-case enum, so the
    // stored property is zero-sized and its key path prints as the field at the same offset
    // (`radius.flat`). Its value is checked by BrandResolutionTests instead.
    out += [describe(t.radius), describe(t.stateTransition), describe(t.spinnerRotation),
            describe(t.focusRing), describe(t.focusRingOffset)]
    return out
}

@Suite("Contract token mapping")
struct ContractTokenMappingTests {
    @Test("DSButtonTokens equals the contract tokens section cell by cell")
    func cellsMatchContract() throws {
        let contract = try ContractYAML.leaves(of: "tokens")
        #expect(!contract.isEmpty)
        #expect(DSButtonTokens.contractCells == contract)
    }

    @Test("Each binding's key path is the generated member its contract path names")
    func keyPathsMatchPaths() {
        for binding in allBindings() {
            #expect(
                binding.keyPath == "\\DSTheme.\(swiftMemberPath(binding.path))",
                "\(binding.path) is bound to \(binding.keyPath)")
        }
    }

    @Test("Component constants and minimum heights match the contract")
    func constants() throws {
        let constants = try ContractYAML.leaves(of: "component-constants")
        #expect(constants["border-width.value"] == "1")
        #expect(DSButtonConstants.borderWidth == 1)
        #expect(constants["spinner-stroke-width.value"] == "2")
        #expect(DSButtonConstants.spinnerStrokeWidth == 2)

        let sizing = try ContractYAML.leaves(of: "sizing")
        #expect(sizing["height"] == "minimum")
        for size in DSButtonSize.allCases {
            #expect(sizing["visual-height.\(size.rawValue)"] == "\(Int(DSButtonConstants.visualHeight[size]!))")
        }
        #expect(sizing["hit-target.minimum.ios"] == "44pt")
        #expect(DSButtonConstants.minimumHitTarget == 44)
    }

    @Test("Enums match the contract's values and defaults")
    func enums() throws {
        let contract = try String(contentsOf: ContractYAML.buttonURL, encoding: .utf8)
        for v in DSButtonVariant.allCases { #expect(contract.contains("      \(v.rawValue): ")) }
        for s in DSButtonSize.allCases { #expect(contract.contains("      \(s.rawValue): ")) }
        #expect(DSButtonVariant.allCases.count == 4)
        #expect(DSButtonSize.allCases.count == 3)
    }
}

@Suite("Brand token resolution")
struct BrandResolutionTests {
    @Test("Every binding resolves in both brands", arguments: brands.map(\.name))
    func resolves(brand: String) {
        let theme = DSTheme.all[brand]!
        for variant in DSButtonVariant.allCases {
            for size in DSButtonSize.allCases {
                for enabled in [true, false] {
                    _ = DSButtonAppearance(
                        theme: theme, variant: variant, size: size,
                        state: DSButtonState(isEnabled: enabled, isLoading: false))
                }
            }
        }
        #expect(DSButtonTokens.spinnerRadius.resolve(in: theme) == .full)
        #expect(DSButtonTokens.focusRing.resolve(in: theme) == theme.color.focus.ring)
    }

    @Test("Brand-dependent tokens differ, shared ones don't")
    func brandDifferences() {
        let a = DSButtonAppearance(theme: .brandA, variant: .primary, size: .md, state: .init(isEnabled: true, isLoading: false))
        let b = DSButtonAppearance(theme: .brandB, variant: .primary, size: .md, state: .init(isEnabled: true, isLoading: false))
        #expect(a.background == DSTheme.brandA.color.action.primary.default)
        #expect(b.background == DSTheme.brandB.color.action.primary.default)
        #expect(a.background != b.background)
        #expect(a.metrics.radius == DSTheme.brandA.radius.control)
        #expect(b.metrics.radius == DSTheme.brandB.radius.control)
        #expect(a.metrics.typography.fontFamily != b.metrics.typography.fontFamily)
        #expect(a.foreground == b.foreground)  // action.primary.on-color is shared
        let dangerA = DSButtonAppearance(theme: .brandA, variant: .danger, size: .md, state: .init(isEnabled: true, isLoading: false))
        let dangerB = DSButtonAppearance(theme: .brandB, variant: .danger, size: .md, state: .init(isEnabled: true, isLoading: false))
        #expect(dangerA.background == dangerB.background)
    }
}

@Suite("Variant / size / state resolution")
struct AppearanceTests {
    private let theme = DSTheme.brandA
    private func look(_ v: DSButtonVariant, _ s: DSButtonSize = .md, enabled: Bool = true, loading: Bool = false, pressed: Bool = false, hovered: Bool = false) -> DSButtonAppearance {
        DSButtonAppearance(theme: theme, variant: v, size: s, state: .init(isEnabled: enabled, isLoading: loading, isPressed: pressed, isHovered: hovered))
    }

    @Test("Variant default / hover / pressed / disabled cells")
    func cells() {
        let c = theme.color
        #expect(look(.primary).background == c.action.primary.default)
        #expect(look(.primary, hovered: true).background == c.action.primary.hover)
        #expect(look(.primary, pressed: true).background == c.action.primary.active)
        #expect(look(.primary, enabled: false).background == c.action.primary.disabled)
        #expect(look(.primary).foreground == c.action.primary.onColor)
        #expect(look(.primary, enabled: false).foreground == c.text.disabled)

        #expect(look(.secondary).background == c.action.secondary.default)
        #expect(look(.secondary).border == c.border.default)
        #expect(look(.secondary, pressed: true).background == c.action.secondary.hover)
        #expect(look(.secondary, enabled: false).background == c.action.secondary.default)

        #expect(look(.tertiary).background == nil)
        #expect(look(.tertiary).border == nil)
        #expect(look(.tertiary, pressed: true).background == c.action.tertiary.hover)
        #expect(look(.tertiary, enabled: false).background == nil)

        #expect(look(.danger).background == c.action.danger.default)
        #expect(look(.danger, pressed: true).background == c.action.danger.hover)
        #expect(look(.danger, enabled: false).background == c.action.danger.disabled)
        #expect(look(.danger).foreground == c.action.danger.onColor)
    }

    @Test("Sizes: minimum height, padding, gap, icon and spinner sizes, typography")
    func sizes() {
        let s = theme.space
        let sm = look(.primary, .sm).metrics
        #expect(sm.minHeight == 32)
        #expect(sm.paddingBlock == s.inset.xs)
        #expect(sm.paddingInline == s.inset.md)
        #expect(sm.paddingInlineIconSide == s.inset.sm)
        #expect(sm.gap == s.inline.xs)
        #expect(sm.iconSize == theme.icon.sm)
        #expect(sm.spinnerSize == theme.icon.sm)
        #expect(sm.typography == theme.typography.label.sm.medium)

        let md = look(.primary, .md).metrics
        #expect(md.minHeight == 40)
        #expect(md.paddingInline == s.inset.lg)
        #expect(md.typography == theme.typography.label.md.medium)

        let lg = look(.primary, .lg).metrics
        #expect(lg.minHeight == 48)
        #expect(lg.paddingInline == s.inset.xl)
        #expect(lg.paddingInlineIconSide == s.inset.lg)
        #expect(lg.iconSize == theme.icon.lg)
        #expect(lg.typography == theme.typography.label.lg.medium)
    }

    @Test("An icon reduces its side's inset one step")
    func iconSidePadding() {
        let m = look(.primary, .md).metrics
        #expect(m.paddingLeading(hasIcon: true) == theme.space.inset.md)
        #expect(m.paddingLeading(hasIcon: false) == theme.space.inset.lg)
        #expect(m.paddingTrailing(hasIcon: true) == theme.space.inset.md)
    }

    @Test("Label typography scales with Dynamic Type on its role's anchor")
    func dynamicTypeAnchors() {
        #expect(look(.primary, .sm).metrics.typography.textScale == .caption1)
        #expect(look(.primary, .md).metrics.typography.textScale == .subheadline)
        #expect(look(.primary, .lg).metrics.typography.textScale == .callout)
    }

    @Test("Motion: micro state transition and spinner rotation")
    func motion() {
        let m = look(.primary).metrics
        #expect(m.stateTransition == theme.motion.micro)
        #expect(m.spinnerRotation == theme.motion.spinner)
        #expect(m.spinnerRotation.duration == 0.6)
    }
}

@Suite("Disabled / loading precedence")
struct PrecedenceTests {
    @Test("Loading: busy, not disabled, blocks activation, keeps variant colors, no pressed/hover")
    func loading() {
        let state = DSButtonState(isEnabled: true, isLoading: true, isPressed: true, isHovered: true)
        #expect(state.showsLoading)
        #expect(!state.canActivate)
        #expect(state.visualState == .default)
        let look = DSButtonAppearance(theme: .brandA, variant: .primary, size: .md, state: state)
        #expect(look.showsSpinner)
        #expect(look.background == DSTheme.brandA.color.action.primary.default)
        #expect(look.foreground == DSTheme.brandA.color.action.primary.onColor)
        #expect(look.spinner == DSTheme.brandA.color.action.primary.onColor)
    }

    @Test("Disabled + loading: disabled wins — no spinner, not busy, disabled colors, no activation")
    func disabledWins() {
        let state = DSButtonState(isEnabled: false, isLoading: true)
        #expect(!state.showsLoading)
        #expect(!state.canActivate)
        #expect(state.visualState == .disabled)
        let look = DSButtonAppearance(theme: .brandB, variant: .danger, size: .lg, state: state)
        #expect(!look.showsSpinner)
        #expect(look.background == DSTheme.brandB.color.action.danger.disabled)
        #expect(look.foreground == DSTheme.brandB.color.text.disabled)
    }

    @Test("Enabled, idle: activates; precedence disabled > loading > pressed > hover > default")
    func precedence() {
        #expect(DSButtonState(isEnabled: true, isLoading: false).canActivate)
        #expect(DSButtonState(isEnabled: true, isLoading: false, isPressed: true, isHovered: true).visualState == .pressed)
        #expect(DSButtonState(isEnabled: true, isLoading: false, isHovered: true).visualState == .hover)
        #expect(DSButtonState(isEnabled: true, isLoading: false).visualState == .default)
        #expect(DSButtonState(isEnabled: false, isLoading: false, isPressed: true).visualState == .disabled)
    }

    @Test("Spinner color per variant", arguments: DSButtonVariant.allCases)
    func spinnerColor(variant: DSButtonVariant) {
        let t = DSTheme.brandA
        let look = DSButtonAppearance(theme: t, variant: variant, size: .md, state: .init(isEnabled: true, isLoading: true))
        let expected: DSColorValue = switch variant {
        case .primary: t.color.action.primary.onColor
        case .secondary, .tertiary: t.color.text.primary
        case .danger: t.color.action.danger.onColor
        }
        #expect(look.spinner == expected)
    }
}

@Suite("Touch target")
struct HitTargetTests {
    @Test("Vertical outset reaches 44pt: sm / md / lg → 6 / 2 / 0")
    func vertical() {
        #expect([32.0, 40, 48].map { hitTargetOutset(for: CGSize(width: 100, height: $0)).vertical } == [6, 2, 0])
    }

    @Test("Narrow buttons get a horizontal outset; grown buttons need none")
    func horizontalAndGrown() {
        let narrow = hitTargetOutset(for: CGSize(width: 36, height: 32))
        #expect(narrow.horizontal == 4)
        #expect(narrow.vertical == 6)
        let grown = hitTargetOutset(for: CGSize(width: 200, height: 60))
        #expect(grown.horizontal == 0)
        #expect(grown.vertical == 0)
    }
}

@Suite("Icon catalog")
struct IconCatalogTests {
    @Test("Every catalog icon has non-empty Lucide artwork", arguments: DSIconName.allCases)
    func artwork(icon: DSIconName) {
        let path = icon.lucidePath
        #expect(!path.isEmpty)
        let box = path.boundingRect
        #expect(box.minX >= -0.5 && box.minY >= -0.5 && box.maxX <= 24.5 && box.maxY <= 24.5, "\(icon) \(box)")
    }

    @Test("Raw values are the catalog names")
    func rawValues() {
        #expect(DSIconName.arrowLeft.rawValue == "arrow-left")
        #expect(DSIconName.eyeOff.rawValue == "eye-off")
        #expect(DSIconName.close.rawValue == "close")
        #expect(DSIconName(rawValue: "chevron-down") == .chevronDown)
    }
}
