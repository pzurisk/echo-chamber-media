import SwiftUI
import UIKit

/// Shared colors and small styling helpers.
///
/// Two palettes ship, and the household picks one in Settings:
///
/// - **Hearth** is the dark one. Warm near-black browns, terracotta, sage.
/// - **Kitchen Table** is the light one. Cream paper, the same terracotta
///   and sage tuned for a light ground.
///
/// Every color below is a single dynamic `UIColor` that resolves to the
/// Hearth value in a dark trait collection and the Kitchen Table value in a
/// light one. Nothing here reads a preference itself. `EchoMealApp` sets
/// `.preferredColorScheme` from the stored choice and the trait collection
/// does the rest, which is what makes "Follow system" work for free.
///
/// Hex values come straight from the design system's `styles.css`, so the
/// prototype and the app cannot drift apart by eye.

// MARK: - Theme preference

/// What the household picked in Settings. `colorScheme` is nil for
/// "Follow system", which is exactly what `.preferredColorScheme` wants.
enum AppTheme: String, CaseIterable, Identifiable {
    case hearth
    case kitchenTable
    case system

    var id: String { rawValue }

    var label: String {
        switch self {
        case .hearth: return "Hearth"
        case .kitchenTable: return "Kitchen Table"
        case .system: return "Follow system"
        }
    }

    /// The short line under each option in Settings.
    var detail: String {
        switch self {
        case .hearth: return "Dark and warm. Easy on the eyes at dinner time."
        case .kitchenTable: return "Light and creamy. Easier to read in daylight."
        case .system: return "Matches whatever iOS is set to."
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .hearth: return .dark
        case .kitchenTable: return .light
        case .system: return nil
        }
    }
}

// MARK: - Palette plumbing

private extension UIColor {
    /// 0xRRGGBB, so the values below can be pasted from the stylesheet
    /// without converting anything by hand.
    convenience init(hex: UInt32, alpha: CGFloat = 1) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: alpha
        )
    }
}

/// One color that knows both palettes. The closure runs again whenever the
/// trait collection changes, so a `static let` built this way is still fully
/// adaptive. That is why every existing call site keeps working untouched.
private func themed(
    hearth: UInt32,
    kitchenTable: UInt32,
    hearthAlpha: CGFloat = 1,
    kitchenTableAlpha: CGFloat = 1
) -> Color {
    Color(uiColor: UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(hex: hearth, alpha: hearthAlpha)
            : UIColor(hex: kitchenTable, alpha: kitchenTableAlpha)
    })
}

// MARK: - Roles

extension Color {
    /// The page behind everything.
    static let echoBackground = themed(hearth: 0x17110E, kitchenTable: 0xF5EAD8)

    /// One step up from the background. Nav bars, sheets, inset rows.
    static let echoSurface = themed(hearth: 0x1E1613, kitchenTable: 0xEBDDC5)

    /// Cards sitting on the background.
    static let echoCard = themed(hearth: 0x241B16, kitchenTable: 0xF9F4ED)

    /// A card that should read as accent-tinted rather than neutral.
    static let echoCardAccent = themed(hearth: 0x2E231C, kitchenTable: 0xFFF2EB)

    /// Hairlines and card strokes. Ink on cream, paper on dark.
    static let echoCardBorder = themed(
        hearth: 0xF7EEE2, kitchenTable: 0x201E1D,
        hearthAlpha: 0.09, kitchenTableAlpha: 0.16
    )

    /// A translucent wash for chips, pills, and progress tracks. Same idea
    /// as the border, just heavier.
    static let echoFill = themed(
        hearth: 0xF7EEE2, kitchenTable: 0x201E1D,
        hearthAlpha: 0.10, kitchenTableAlpha: 0.07
    )

    /// Primary type.
    static let echoText = themed(hearth: 0xF7EEE2, kitchenTable: 0x201E1D)

    /// Supporting type. Captions, subtitles, unfilled stars.
    static let echoTextSecondary = themed(hearth: 0xBFAE9C, kitchenTable: 0x645C50)

    /// The quietest readable type. Metadata, placeholders.
    static let echoTextTertiary = themed(hearth: 0x8A7969, kitchenTable: 0x82796A)

    /// Terracotta, used as a solid fill: the mic button, sliders, filled
    /// pills. Text on top of it goes to `echoOnAccent`.
    static let echoAccent = themed(hearth: 0xC96A34, kitchenTable: 0xC67139)

    /// Terracotta tuned to stay readable directly on the background. Use
    /// this for accent-colored text and icons, never for a fill.
    static let echoAccentText = themed(hearth: 0xF0996B, kitchenTable: 0xB2622D)

    /// Type and icons sitting on top of `echoAccent`.
    static let echoOnAccent = themed(hearth: 0x1E1613, kitchenTable: 0xFFF2EB)

    /// Sage. Success, "connected", checked-off states.
    static let echoGreen = themed(hearth: 0xAEBF92, kitchenTable: 0x56633F)

    /// Honey. Every warning and error message in the app, plus filled stars.
    static let echoWarning = themed(hearth: 0xE8B75C, kitchenTable: 0xA4761F)

    /// Muted blue. Informational, never an action.
    static let echoInfo = themed(hearth: 0x8FA6B8, kitchenTable: 0x4F6C81)

    /// Kept so the 40-odd existing call sites still compile. It is terracotta
    /// now, not red. Prefer `echoAccent` (fills) or `echoAccentText` (type).
    static let echoRed = Color.echoAccent
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
            .foregroundStyle(star <= rating ? Color.echoWarning : Color.echoTextSecondary)
            .contentShape(Rectangle())
    }
}
