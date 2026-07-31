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
/// Interactive stars are real Buttons so VoiceOver can activate them, and
/// the row supports the VoiceOver adjustable gesture (swipe up or down).
struct StarRating: View {
    let rating: Int
    var onTap: ((Int) -> Void)? = nil

    private var accessibilityText: String {
        rating > 0 ? "Rated \(rating) of 5 stars" : "Not rated yet"
    }

    var body: some View {
        if let onTap {
            HStack(spacing: 8) {
                ForEach(1...5, id: \.self) { star in
                    Button {
                        onTap(star)
                    } label: {
                        starImage(for: star)
                    }
                    .buttonStyle(.plain)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(accessibilityText)
            .accessibilityValue(rating > 0 ? "\(rating) of 5" : "No rating")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment:
                    if rating < 5 { onTap(rating + 1) }
                case .decrement:
                    if rating > 1 {
                        onTap(rating - 1)
                    } else if rating == 1 {
                        // Tapping the current star clears the rating, so
                        // repeating star 1 drops the rating to none. This
                        // lets VoiceOver users clear a rating too.
                        onTap(1)
                    }
                @unknown default:
                    break
                }
            }
        } else {
            HStack(spacing: 8) {
                ForEach(1...5, id: \.self) { star in
                    starImage(for: star)
                }
            }
            .accessibilityLabel(accessibilityText)
        }
    }

    /// One star, identical visuals for both paths.
    private func starImage(for star: Int) -> some View {
        Image(systemName: star <= rating ? "star.fill" : "star")
            .font(onTap == nil ? .caption : .title2)
            .foregroundStyle(star <= rating ? Color.yellow : Color.echoTextSecondary)
            .contentShape(Rectangle())
    }
}
