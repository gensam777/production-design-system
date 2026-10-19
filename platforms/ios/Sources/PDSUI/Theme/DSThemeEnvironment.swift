import PDSTokens
import SwiftUI

// The active brand theme travels through the SwiftUI environment (ADR 0011 / multi-brand
// rule: components read semantic tokens only and never know which brand is active). Without
// `.dsTheme(_:)` a view gets the default brand — the SwiftUI equivalent of web's "no
// data-brand attribute = Brand A" and React Native's default PDSThemeProvider.

private struct DSThemeKey: EnvironmentKey {
    static let defaultValue: DSTheme = DSTheme.all[DSTheme.defaultBrandName] ?? .brandA
}

extension EnvironmentValues {
    /// The generated semantic token theme for the active brand (`PDSTokens`).
    public var dsTheme: DSTheme {
        get { self[DSThemeKey.self] }
        set { self[DSThemeKey.self] = newValue }
    }
}

extension View {
    /// Sets the brand theme for this view and everything inside it. Nests: a subtree can use a
    /// different brand (web's `data-brand` on a container).
    ///
    /// ```swift
    /// ContentView().dsTheme(.brandB)
    /// ```
    public func dsTheme(_ theme: DSTheme) -> some View {
        environment(\.dsTheme, theme)
    }
}
