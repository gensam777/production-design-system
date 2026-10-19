import PDSTokens
import SwiftUI

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

extension DSTextScale {
    /// The SwiftUI text style this role scales with under Dynamic Type (ADR 0016 anchors).
    public var fontTextStyle: Font.TextStyle {
        switch self {
        case .largeTitle: .largeTitle
        case .title1: .title
        case .title2: .title2
        case .title3: .title3
        case .headline: .headline
        case .body: .body
        case .callout: .callout
        case .subheadline: .subheadline
        case .footnote: .footnote
        case .caption1: .caption
        case .caption2: .caption2
        }
    }
}

extension DSTextStyle {
    /// Whether the app has registered this role's exact face (PDS bundles no font files —
    /// ADR 0016). Checked at runtime, so no "fonts loaded" flag is needed on Apple platforms.
    var isFaceRegistered: Bool {
        #if canImport(UIKit)
        UIFont(name: postScriptName, size: size) != nil
        #elseif canImport(AppKit)
        NSFont(name: postScriptName, size: size) != nil
        #else
        false
        #endif
    }

    var swiftUIWeight: Font.Weight {
        switch fontWeight {
        case ..<150: .ultraLight
        case ..<250: .thin
        case ..<350: .light
        case ..<450: .regular
        case ..<550: .medium
        case ..<650: .semibold
        case ..<750: .bold
        case ..<850: .heavy
        default: .black
        }
    }
}

/// Applies a typography role: the brand face when the app has registered it, otherwise the
/// system font at the same size and weight — never another brand's family. Size, line spacing
/// and tracking all scale on the role's Dynamic Type anchor, so the whole role grows together.
struct DSTextStyleModifier: ViewModifier {
    let style: DSTextStyle
    @ScaledMetric private var scale: CGFloat

    init(_ style: DSTextStyle) {
        self.style = style
        _scale = ScaledMetric(wrappedValue: 1, relativeTo: style.textScale.fontTextStyle)
    }

    func body(content: Content) -> some View {
        content
            .font(font)
            .lineSpacing(style.lineSpacing * scale)
            .tracking(style.tracking * scale)
    }

    private var font: Font {
        if style.isFaceRegistered {
            return .custom(style.postScriptName, size: style.size, relativeTo: style.textScale.fontTextStyle)
        }
        // `.custom` with an unregistered name can't take a weight (SwiftUI logs "Unable to
        // update Font Descriptor's weight"), so the fallback is an explicit system font scaled
        // by the same anchor.
        return .system(size: style.size * scale, weight: style.swiftUIWeight)
    }
}

extension View {
    /// Styles text with a generated typography role (`theme.typography.*`), scaling with
    /// Dynamic Type on the role's anchor.
    public func dsTextStyle(_ style: DSTextStyle) -> some View {
        modifier(DSTextStyleModifier(style))
    }
}
