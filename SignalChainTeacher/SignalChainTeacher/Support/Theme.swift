import SwiftUI

/// Rack aesthetic ported from the HTML artifact: dark background, each
/// module panel carries the real device's own color scheme, brass/amber
/// accents for XP and progress, LED-style completion indicators.
enum Theme {
    static let rackBackground = Color(hex: "0d0d0f")
    static let brass = Color(hex: "d8a54a")
    static let cardStroke = Color.white.opacity(0.08)

    /// Condensed industrial feel for module labels and headers. The HTML
    /// version used Oswald; Oswald is not bundled here yet (see README), so
    /// this approximates it with a heavy system weight and wide tracking
    /// until the real font is added to Assets.
    static func displayFont(_ size: CGFloat) -> Font {
        .system(size: size, weight: .black, design: .default)
    }

    static func statFont(_ size: CGFloat = 13) -> Font {
        .system(size: size, weight: .medium, design: .monospaced)
    }
}

extension Color {
    init(hex: String) {
        var value = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        value.removeAll { $0 == "#" }
        var rgb: UInt64 = 0
        Scanner(string: value).scanHexInt64(&rgb)
        let r = Double((rgb & 0xFF0000) >> 16) / 255
        let g = Double((rgb & 0x00FF00) >> 8) / 255
        let b = Double(rgb & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
