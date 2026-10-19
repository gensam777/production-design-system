import SwiftUI

/// The Lucide artwork of a catalog icon, scaled from its 24×24 space into the given rect.
struct LucideIconShape: Shape {
    let name: DSIconName

    func path(in rect: CGRect) -> Path {
        let scale = CGAffineTransform(scaleX: rect.width / 24, y: rect.height / 24)
            .concatenating(CGAffineTransform(translationX: rect.minX, y: rect.minY))
        return name.lucidePath.applying(scale)
    }
}

/// Internal, decorative icon (not public API): a catalog icon at a resolved size, stroked the
/// way Lucide draws it — round caps and joins, stroke 2 at 24pt scaling with the size (ADR 0019
/// rule 4: 2 at 24 → 1.33 at 16). Hidden from accessibility; the owning control names itself.
struct DSIconView: View {
    let name: DSIconName
    let size: CGFloat
    let color: Color

    var body: some View {
        LucideIconShape(name: name)
            .stroke(
                color,
                style: StrokeStyle(lineWidth: 2 * size / 24, lineCap: .round, lineJoin: .round))
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}
