import SwiftUI

/// Shared colors and small styling helpers. Dark, high contrast, calm,
/// with one dominant red on the Speak tab.
extension Color {
    static let echoBackground = Color(red: 0.055, green: 0.055, blue: 0.063)
    static let echoCard = Color(red: 0.110, green: 0.110, blue: 0.125)
    static let echoCardBorder = Color(white: 1.0, opacity: 0.06)
    static let echoRed = Color(red: 0.898, green: 0.196, blue: 0.176)
    static let echoGreen = Color(red: 0.30, green: 0.78, blue: 0.47)
    static let echoTextSecondary = Color(white: 0.62)
}

struct CardBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color.echoCard)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(Color.echoCardBorder, lineWidth: 1)
                    )
            )
    }
}

extension View {
    func echoCardStyle() -> some View {
        modifier(CardBackground())
    }
}

/// A 1 to 5 star row. Pass onTap to make it interactive; leave it nil for
/// display only. Big touch targets so it is easy to hit after cooking.
struct StarRating: View {
    let rating: Int
    var onTap: ((Int) -> Void)? = nil

    var body: some View {
        HStack(spacing: 8) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= rating ? "star.fill" : "star")
                    .font(onTap == nil ? .caption : .title2)
                    .foregroundStyle(star <= rating ? Color.yellow : Color.echoTextSecondary)
                    .contentShape(Rectangle())
                    .onTapGesture {
                        onTap?(star)
                    }
            }
        }
        .accessibilityLabel(rating > 0 ? "Rated \(rating) of 5 stars" : "Not rated yet")
    }
}
