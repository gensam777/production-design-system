import PDSTokens
import SwiftUI

extension Color {
    /// A generated token color (sRGB, alpha included).
    public init(_ value: DSColorValue) {
        self.init(.sRGB, red: value.red, green: value.green, blue: value.blue, opacity: value.alpha)
    }
}
