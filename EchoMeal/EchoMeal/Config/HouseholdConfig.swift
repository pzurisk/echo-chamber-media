import Foundation

/// Household identity shared by both phones. Both installs must use the
/// same code so they read and write the same CloudKit records. The code
/// is created on first launch (or typed in to join a partner's household)
/// and stored in UserDefaults. An empty code means "not set up yet" and
/// the app shows onboarding until one exists.
enum HouseholdConfig {
    /// The shared household code. Empty string means this install has not
    /// been set up yet. Shown and changeable in Settings.
    static var code: String {
        get { UserDefaults.standard.string(forKey: Keys.householdCode) ?? "" }
        set { UserDefaults.standard.set(newValue, forKey: Keys.householdCode) }
    }

    /// CloudKit container identifier. Must match the iCloud container
    /// enabled in Signing & Capabilities and the entitlements file.
    static let cloudKitContainerID = "iCloud.com.echochambermedia.echomeal"

    /// Characters used in generated codes. Capital letters and digits only,
    /// with the easy-to-confuse ones (O, 0, I, 1, L) left out so the code
    /// is painless to read aloud or type on the other phone.
    private static let codeAlphabet = Array("ABCDEFGHJKMNPQRSTUVWXYZ23456789")

    /// Makes a fresh household code, "MEAL-" plus six unambiguous
    /// characters, for example "MEAL-7KDQ2X".
    static func generateCode() -> String {
        let suffix = String((0..<6).compactMap { _ in codeAlphabet.randomElement() })
        return "MEAL-\(suffix)"
    }

    /// Cleans up a user-typed code so it matches a generated one:
    /// uppercased with ALL whitespace stripped, since generated codes never
    /// contain spaces and a stray space would silently create an empty,
    /// never-matching household.
    static func normalize(_ raw: String) -> String {
        raw.uppercased()
            .components(separatedBy: .whitespacesAndNewlines)
            .joined()
    }

    /// UserDefaults keys.
    enum Keys {
        static let householdCode = "householdCode"
        static let aiNoticeAccepted = "aiNoticeAccepted"
        static let budgetTarget = "budgetTarget"
        static let dinnersPerWeek = "dinnersPerWeek"
        static let themeChoice = "themeChoice"
        static let cachedPlan = "cachedPlanJSON"
        static let cachedChecked = "cachedCheckedIDs"
        static let cachedFavorites = "cachedFavoritesJSON"
        static let cachedHistory = "cachedHistoryJSON"
        static let cachedRatings = "cachedRatingsJSON"
        static let cachedRecipeBox = "cachedRecipeBoxJSON"
        static let cachedKeptRecipes = "cachedKeptRecipesJSON"
        static let cachedPantry = "cachedPantryJSON"
        static let cachedEditDates = "cachedEditDates"
    }
}

// If Billy later wants a non-Apple backend or cross-platform support
// (an Android phone in the household, for example), Supabase or Firebase
// is a drop-in alternative: one table keyed by this same household code,
// realtime subscriptions instead of CKQuerySubscription, and the rest of
// the app does not change.
