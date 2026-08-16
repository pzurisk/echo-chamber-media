import Foundation
import Security

/// Household identity shared by both phones. Both installs must use the
/// same code so they read and write the same CloudKit records. The code is
/// created on first launch (or joined from the partner's phone) and stored
/// in the Keychain. An empty code means "not set up yet" and the app shows
/// onboarding until one exists.
///
/// The code lives in the Keychain rather than UserDefaults because it is an
/// encryption key now, not just an identifier: HouseholdCrypto derives the
/// AES key for every CloudKit payload from it. UserDefaults rides along in
/// device backups, which is the wrong home for key material.
enum HouseholdConfig {

    /// The shared household code, canonical form: twenty-six base32
    /// characters, no prefix and no separators. Empty means this install has
    /// not been set up. Settings shows the formatted version.
    static var code: String {
        get { Keychain.read(account: Keychain.householdCodeAccount) ?? "" }
        set {
            if newValue.isEmpty {
                Keychain.delete(account: Keychain.householdCodeAccount)
            } else {
                Keychain.write(newValue, account: Keychain.householdCodeAccount)
            }
        }
    }

    /// CloudKit container identifier. Must match the iCloud container
    /// enabled in Signing & Capabilities and the entitlements file.
    static let cloudKitContainerID = "iCloud.com.echochambermedia.echomeal"

    /// Makes a fresh 128-bit household code.
    static func generateCode() -> String {
        HouseholdCrypto.generateCode()
    }

    /// Cleans up a typed, pasted, or scanned code so it matches a generated
    /// one.
    static func normalize(_ raw: String) -> String {
        HouseholdCrypto.normalize(raw)
    }

    /// One-time cleanup for phones updating from the plaintext sync scheme.
    ///
    /// Those installs kept a six-character code in UserDefaults and synced
    /// unencrypted JSON under record names built from it. There is no
    /// migration path: the old code carries about thirty bits, and the whole
    /// point of the new scheme is that the record names and payloads are
    /// derived from a code that size cannot produce. So the old code and the
    /// stale plaintext caches are removed, and the phone goes back through
    /// onboarding to get a real one.
    ///
    /// Leaving them in place would be worse than useless: the phone would
    /// look set up while writing plaintext records nobody was reading.
    static func purgeLegacyStorageIfNeeded() {
        let defaults = UserDefaults.standard
        guard defaults.object(forKey: Keys.legacyHouseholdCode) != nil else { return }
        for key in Keys.legacyPurge {
            defaults.removeObject(forKey: key)
        }
    }

    /// UserDefaults keys. The household code is no longer among them.
    enum Keys {
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

        /// Where the code used to live. Read only by purgeLegacyStorageIfNeeded.
        static let legacyHouseholdCode = "householdCode"

        /// Everything the legacy purge clears: the old code plus every
        /// cached payload written under it.
        static let legacyPurge = [
            legacyHouseholdCode, cachedPlan, cachedChecked, cachedFavorites,
            cachedHistory, cachedRatings, cachedRecipeBox, cachedKeptRecipes,
            cachedPantry, cachedEditDates
        ]
    }

    // MARK: - Keychain

    /// Minimal generic-password wrapper. Only the household code goes in
    /// here, so there is no need for anything more general.
    private enum Keychain {
        static let householdCodeAccount = "householdCode"
        private static let service = "com.echochambermedia.echomeal.household"

        /// This-device-only, so the code never travels in an iCloud Keychain
        /// backup. The trade-off is that restoring a new phone from backup
        /// does not bring the household with it, which is recoverable: the
        /// partner's phone still has the code and can hand it over by QR.
        /// After-first-unlock rather than when-unlocked, because CloudKit
        /// pushes arrive and get processed while the phone is locked.
        private static let accessibility = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        private static func query(account: String) -> [String: Any] {
            [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: account
            ]
        }

        static func read(account: String) -> String? {
            var request = query(account: account)
            request[kSecReturnData as String] = true
            request[kSecMatchLimit as String] = kSecMatchLimitOne
            var result: CFTypeRef?
            guard SecItemCopyMatching(request as CFDictionary, &result) == errSecSuccess,
                  let data = result as? Data,
                  let value = String(data: data, encoding: .utf8)
            else { return nil }
            return value
        }

        static func write(_ value: String, account: String) {
            let data = Data(value.utf8)
            let base = query(account: account)
            let updated = SecItemUpdate(
                base as CFDictionary,
                [kSecValueData as String: data] as CFDictionary
            )
            guard updated != errSecSuccess else { return }
            var insert = base
            insert[kSecValueData as String] = data
            insert[kSecAttrAccessible as String] = accessibility
            SecItemAdd(insert as CFDictionary, nil)
        }

        static func delete(account: String) {
            SecItemDelete(query(account: account) as CFDictionary)
        }
    }
}

// If Billy later wants a non-Apple backend or cross-platform support
// (an Android phone in the household, for example), Supabase or Firebase
// is a drop-in alternative: one table keyed by the derived lookup ID,
// realtime subscriptions instead of CKQuerySubscription, the same payload
// sealing on the client, and the rest of the app does not change.
