import Foundation

/// Fixed household identity shared by both phones.
/// Both installs must use the same code so they read and write
/// the same CloudKit records. Change it here if you ever want
/// a fresh start (old records will simply be ignored).
enum HouseholdConfig {
    /// The shared household code. Shown in Settings.
    static let code = "ZURISK-KITCHEN"

    /// CloudKit container identifier. Must match the iCloud container
    /// enabled in Signing & Capabilities and the entitlements file.
    static let cloudKitContainerID = "iCloud.com.echochambermedia.echomeal"

    /// UserDefaults keys.
    enum Keys {
        static let budgetTarget = "budgetTarget"
        static let dinnersPerWeek = "dinnersPerWeek"
        static let cachedPlan = "cachedPlanJSON"
        static let cachedChecked = "cachedCheckedIDs"
        static let cachedFavorites = "cachedFavoritesJSON"
        static let cachedHistory = "cachedHistoryJSON"
    }
}

// If Billy later wants a non-Apple backend or cross-platform support
// (an Android phone in the household, for example), Supabase or Firebase
// is a drop-in alternative: one table keyed by this same household code,
// realtime subscriptions instead of CKQuerySubscription, and the rest of
// the app does not change.
