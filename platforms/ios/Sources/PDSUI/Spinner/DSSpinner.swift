import PDSTokens
import SwiftUI

/// Internal busy indicator (not public API): a ring with flat ends and a gap in one quarter
/// (a 270° arc), drawn inside its box, turning once per `motion.spinner`. With Reduce Motion
/// on, the ring is drawn but does not turn (ADR 0018 decision 6). Decorative: the owning
/// control exposes the busy state, so it is hidden from accessibility.
///
/// Not `ProgressView`: the contract fixes the ring geometry and timing, which the system
/// spinner can't take; it follows the system's Reduce Motion setting the same way.
struct DSSpinner: View {
    let size: CGFloat
    let color: Color
    let lineWidth: CGFloat
    let rotation: DSTransition

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion || rotation.duration <= 0)) { context in
            ring.rotationEffect(angle(at: context.date))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    private var ring: some View {
        Circle()
            .inset(by: lineWidth / 2)
            .trim(from: 0, to: 0.75)
            .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
    }

    /// One turn per `rotation.duration`, eased per turn with the token's curve (linear today).
    private func angle(at date: Date) -> Angle {
        guard !reduceMotion, rotation.duration > 0 else { return .zero }
        let elapsed = date.timeIntervalSinceReferenceDate
        let progress = elapsed.truncatingRemainder(dividingBy: rotation.duration) / rotation.duration
        let e = rotation.easing
        let curve = UnitCurve.bezier(
            startControlPoint: UnitPoint(x: e.x1, y: e.y1),
            endControlPoint: UnitPoint(x: e.x2, y: e.y2))
        return .degrees(360 * curve.value(at: progress))
    }
}
