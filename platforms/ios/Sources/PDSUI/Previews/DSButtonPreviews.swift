#if DEBUG
import PDSTokens
import SwiftUI

// Visual review surface for DSButton — open Package.swift in Xcode, select this file, pick an
// iOS Simulator destination and show the canvas (Editor ▸ Canvas). Each #Preview is one brand /
// text-size configuration. Brand fonts aren't bundled (ADR 0016), so text uses the system font
// at the role's weight unless the host app registers Inter / Figtree.

/// Wraps its children onto new lines like the web / React Native galleries' rows.
private struct DSPreviewFlow: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal: proposal, subviews: subviews).size
    }

    func placeSubviews(
        in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()
    ) {
        let result = arrange(proposal: ProposedViewSize(width: bounds.width, height: nil), subviews: subviews)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size))
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews)
        -> (size: CGSize, frames: [CGRect])
    {
        let maxWidth = proposal.width ?? .infinity
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var lineHeight: CGFloat = 0
        var width: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(ProposedViewSize(width: maxWidth, height: nil))
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
            width = max(width, x - spacing)
        }
        return (CGSize(width: width, height: y + lineHeight), frames)
    }
}

private struct DSPreviewSection<Content: View>: View {
    let title: String
    var note: String? = nil
    @ViewBuilder let content: Content
    @Environment(\.dsTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.space.stack.sm) {
            Text(title)
                .dsTextStyle(theme.typography.heading.sm.semibold)
                .foregroundStyle(Color(theme.color.text.primary))
                .accessibilityAddTraits(.isHeader)
            if let note {
                Text(note)
                    .dsTextStyle(theme.typography.body.sm.regular)
                    .foregroundStyle(Color(theme.color.text.secondary))
            }
            content
        }
    }
}

/// Pressing starts a two-second pending action: the button shows loading and ignores presses.
private struct DSPendingActionDemo: View {
    let variant: DSButtonVariant
    @State private var pending = false
    @State private var count = 0

    var body: some View {
        DSButton(
            count == 0 ? "Submit" : "Submitted \(count)×", variant: variant,
            trailingIcon: .arrowRight, isLoading: pending
        ) {
            count += 1
            pending = true
            Task {
                try? await Task.sleep(for: .seconds(2))
                pending = false
            }
        }
    }
}

struct DSButtonGallery: View {
    @Environment(\.dsTheme) private var theme
    private let variants = DSButtonVariant.allCases
    private let sizes = DSButtonSize.allCases

    private var brandName: String {
        theme == .brandB ? "Brand B" : theme == .brandA ? "Brand A" : "Custom theme"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: theme.space.stack.xl) {
                Text(brandName)
                    .dsTextStyle(theme.typography.heading.md.bold)
                    .foregroundStyle(Color(theme.color.text.primary))
                    .accessibilityAddTraits(.isHeader)

                DSPreviewSection(title: "Variants", note: "Default size (md).") {
                    DSPreviewFlow {
                        ForEach(variants, id: \.self) { v in
                            DSButton(v.rawValue.capitalized, variant: v) {}
                        }
                    }
                }

                DSPreviewSection(
                    title: "Sizes", note: "Minimum heights 32 / 40 / 48; hit area ≥ 44pt."
                ) {
                    ForEach(variants, id: \.self) { v in
                        DSPreviewFlow {
                            ForEach(sizes, id: \.self) { s in
                                DSButton("\(v.rawValue.capitalized) \(s.rawValue)", variant: v, size: s) {}
                            }
                        }
                    }
                }

                DSPreviewSection(title: "Icons", note: "Leading, trailing and both.") {
                    ForEach(sizes, id: \.self) { s in
                        DSPreviewFlow {
                            DSButton("Add item", size: s, leadingIcon: .plus) {}
                            DSButton("Continue", variant: .secondary, size: s, trailingIcon: .arrowRight) {}
                            DSButton(
                                "Edit", variant: .tertiary, size: s, leadingIcon: .edit,
                                trailingIcon: .chevronDown) {}
                            DSButton("Delete", variant: .danger, size: s, leadingIcon: .trash) {}
                        }
                    }
                }

                DSPreviewSection(
                    title: "Loading",
                    note: "Busy, not disabled: variant colors kept, size preserved, presses ignored."
                ) {
                    DSPreviewFlow {
                        ForEach(variants, id: \.self) { v in
                            DSButton(v.rawValue.capitalized, variant: v, leadingIcon: .check, isLoading: true) {}
                        }
                    }
                    DSPreviewFlow {
                        ForEach(sizes, id: \.self) { s in
                            DSButton("Loading \(s.rawValue)", size: s, isLoading: true) {}
                        }
                    }
                    DSPreviewFlow {
                        DSPendingActionDemo(variant: .primary)
                        DSPendingActionDemo(variant: .secondary)
                    }
                }

                DSPreviewSection(title: "Disabled") {
                    DSPreviewFlow {
                        ForEach(variants, id: \.self) { v in
                            DSButton(v.rawValue.capitalized, variant: v, leadingIcon: .plus) {}
                                .disabled(true)
                        }
                    }
                }

                DSPreviewSection(
                    title: "Disabled + loading", note: "Disabled wins: label visible, no spinner, not busy."
                ) {
                    DSPreviewFlow {
                        ForEach(variants, id: \.self) { v in
                            DSButton(v.rawValue.capitalized, variant: v, isLoading: true) {}
                                .disabled(true)
                        }
                    }
                }

                DSPreviewSection(
                    title: "Long and wrapping labels",
                    note: "Labels wrap and the button grows; nothing truncates."
                ) {
                    VStack(alignment: .leading, spacing: theme.space.stack.sm) {
                        DSButton(
                            "Confirm and continue to the payment details step",
                            leadingIcon: .check, trailingIcon: .arrowRight) {}
                        DSButton(
                            "A small secondary action whose label is long enough to wrap",
                            variant: .secondary, size: .sm) {}
                    }
                    .frame(maxWidth: 220, alignment: .leading)
                }
            }
            .padding(theme.space.inset.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color(theme.color.surface.canvas))
    }
}

#Preview("Brand A") {
    DSButtonGallery().dsTheme(.brandA)
}

#Preview("Brand B") {
    DSButtonGallery().dsTheme(.brandB)
}

#Preview("Dynamic Type · xxxLarge") {
    DSButtonGallery().dsTheme(.brandA).environment(\.dynamicTypeSize, .xxxLarge)
}

#Preview("Dynamic Type · AX3") {
    DSButtonGallery().dsTheme(.brandB).environment(\.dynamicTypeSize, .accessibility3)
}

#Preview("Dynamic Type · xSmall") {
    DSButtonGallery().dsTheme(.brandA).environment(\.dynamicTypeSize, .xSmall)
}
#endif
