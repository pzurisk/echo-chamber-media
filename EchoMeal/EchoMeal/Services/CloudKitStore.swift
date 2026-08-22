import CloudKit
import CryptoKit
import Foundation

/// Sync layer. Uses the CloudKit public database so both Apple IDs read and
/// write the same records with no third-party service and no extra keys.
///
/// Nothing here writes the household code, and nothing here writes readable
/// content. HouseholdCrypto derives an opaque lookup ID and an AES key from
/// the code; the lookup ID names the records, and everything else is sealed
/// into one `payload` field. The public database is readable by every iCloud
/// user of the app, so a container dump has to come back as opaque IDs and
/// ciphertext, and it does.
///
/// Record layout (record names are deterministic, so everything is fetched
/// by ID and no query index is needed for reads):
///   HouseholdPlan  "plan-<lookupID>"       payload, householdID, updatedAt
///   GroceryState   "grocery-<lookupID>"    payload, householdID, updatedAt
///   Favorites      "favorites-<lookupID>"  payload, householdID, updatedAt
///   TasteHistory   "history-<lookupID>"    payload, householdID, updatedAt
///   Ratings        "ratings-<lookupID>"    payload, householdID, updatedAt
///   RecipeBox      "recipebox-<lookupID>"  payload, householdID, updatedAt
///   Pantry         "pantry-<lookupID>"     payload, householdID, updatedAt
///   FreeformItems  "freeform-<lookupID>"   payload, householdID, updatedAt
///   LeftoverStatus "leftover-<lookupID>"   payload, householdID, updatedAt
///
/// `payload` is Bytes and holds an AES-GCM sealed box. `householdID` holds
/// the lookup ID, not the code, and stays QUERYABLE because
/// CKQuerySubscription needs an index to filter on. Enumerating the
/// container through that index is possible and pointless: it returns
/// derived IDs and sealed blobs.
///
/// The household code lives in the Keychain and can change while the app is
/// running (create, join, or leave a household), so it is read fresh on
/// every call rather than captured at init. While no code is set (first
/// launch before onboarding), every fetch returns nil and every save and
/// subscription call is a no-op.
final class CloudKitStore {

    static let planRecordType = "HouseholdPlan"
    static let groceryRecordType = "GroceryState"
    static let favoritesRecordType = "Favorites"
    static let historyRecordType = "TasteHistory"
    static let ratingsRecordType = "Ratings"
    static let recipeBoxRecordType = "RecipeBox"
    static let pantryRecordType = "Pantry"
    static let freeformRecordType = "FreeformItems"
    static let leftoverStatusRecordType = "LeftoverStatus"

    /// The single encrypted field on every record type.
    private static let payloadKey = "payload"

    private let database: CKDatabase
    private let container: CKContainer

    init() {
        container = CKContainer(identifier: HouseholdConfig.cloudKitContainerID)
        database = container.publicCloudDatabase
    }

    // MARK: - Household context

    /// The derived pair every call needs. Nil until onboarding sets a code.
    private struct Context {
        let lookupID: String
        let key: SymmetricKey
    }

    private var context: Context? {
        let code = HouseholdConfig.code
        guard !code.isEmpty else { return nil }
        let derived = HouseholdCrypto.derive(from: code)
        return Context(lookupID: derived.lookupID, key: derived.key)
    }

    /// One record type plus the prefix its record names use.
    private struct Kind {
        let prefix: String
        let type: String

        static let plan = Kind(prefix: "plan", type: CloudKitStore.planRecordType)
        static let grocery = Kind(prefix: "grocery", type: CloudKitStore.groceryRecordType)
        static let favorites = Kind(prefix: "favorites", type: CloudKitStore.favoritesRecordType)
        static let history = Kind(prefix: "history", type: CloudKitStore.historyRecordType)
        static let ratings = Kind(prefix: "ratings", type: CloudKitStore.ratingsRecordType)
        static let recipeBox = Kind(prefix: "recipebox", type: CloudKitStore.recipeBoxRecordType)
        static let pantry = Kind(prefix: "pantry", type: CloudKitStore.pantryRecordType)
        static let freeform = Kind(prefix: "freeform", type: CloudKitStore.freeformRecordType)
        static let leftoverStatus = Kind(prefix: "leftover", type: CloudKitStore.leftoverStatusRecordType)

        static let all: [Kind] = [
            plan, grocery, favorites, history, ratings, recipeBox, pantry, freeform, leftoverStatus
        ]
    }

    private func recordID(_ kind: Kind, _ ctx: Context) -> CKRecord.ID {
        CKRecord.ID(recordName: "\(kind.prefix)-\(ctx.lookupID)")
    }

    // MARK: - Account

    /// True when the user is signed into iCloud. The UI shows a friendly
    /// prompt when this is false.
    func isSignedIn() async -> Bool {
        let status = (try? await container.accountStatus()) ?? .couldNotDetermine
        return status == .available
    }

    // MARK: - Plan

    func savePlan(_ plan: MealPlan) async throws {
        try await writeValue(plan, .plan)
    }

    /// Clear This Week, cloud side. Writes the plan record with an empty
    /// payload (a tombstone) and a fresh updatedAt through the same
    /// conflict-merge save path, so the other phone's newest-wins refresh
    /// drops its local plan too instead of resurrecting the cleared week.
    /// The tombstone is still sealed, so an observer cannot tell a cleared
    /// week from a full one.
    func saveClearedPlan() async throws {
        guard let ctx = context else { return }
        try await writePayload(Data(), .plan, ctx: ctx)
    }

    /// Returns the plan plus the record's freshness date so the caller can
    /// skip applying a cloud copy that is older than local edits. Three
    /// outcomes: nil means no record exists at all; (nil, date) is a
    /// tombstone left by saveClearedPlan (empty or unreadable payload),
    /// which a caller applies by clearing its local plan when the date is
    /// newer; (plan, date) is a real plan.
    func fetchPlan() async -> (plan: MealPlan?, updatedAt: Date)? {
        guard let read = await readPayload(.plan) else { return nil }
        guard let plan = try? JSONDecoder().decode(MealPlan.self, from: read.data) else {
            return (nil, read.updatedAt)
        }
        return (plan, read.updatedAt)
    }

    // MARK: - Grocery checked state

    func saveChecked(_ ids: Set<String>) async throws {
        guard let ctx = context else { return }
        try await writePayload(
            try JSONEncoder().encode(Array(ids)),
            .grocery,
            ctx: ctx,
            merge: Self.mergeCheckedIDs
        )
    }

    /// Returns the checked IDs plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchChecked() async -> (checked: Set<String>, updatedAt: Date)? {
        guard let read = await readValue([String].self, .grocery) else { return nil }
        return (Set(read.value), read.updatedAt)
    }

    /// Conflict resolution for simultaneous check-offs. This used to be a
    /// plain union of two CKRecord string arrays, but the IDs are inside the
    /// sealed payload now, so the merge happens on decrypted plaintext and
    /// the result is resealed before it goes back. Falls back to our copy if
    /// either side will not decode, which is the same outcome the old
    /// non-special-cased path gave.
    private static func mergeCheckedIDs(local: Data, server: Data) -> Data {
        guard let ours = try? JSONDecoder().decode([String].self, from: local),
              let theirs = try? JSONDecoder().decode([String].self, from: server),
              let merged = try? JSONEncoder().encode(Array(Set(ours).union(theirs)))
        else { return local }
        return merged
    }

    // MARK: - Favorites

    func saveFavorites(_ recipes: [Recipe]) async throws {
        try await writeValue(recipes, .favorites)
    }

    /// Returns the favorites plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchFavorites() async -> (recipes: [Recipe], updatedAt: Date)? {
        guard let read = await readValue([Recipe].self, .favorites) else { return nil }
        return (read.value, read.updatedAt)
    }

    // MARK: - Taste history

    func saveHistory(_ dinners: [PastDinner]) async throws {
        try await writeValue(dinners, .history)
    }

    /// Returns the history plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchHistory() async -> (dinners: [PastDinner], updatedAt: Date)? {
        guard let read = await readValue([PastDinner].self, .history) else { return nil }
        return (read.value, read.updatedAt)
    }

    // MARK: - Ratings

    /// Star ratings keyed by recipe title, 1 through 5.
    func saveRatings(_ ratings: [String: Int]) async throws {
        try await writeValue(ratings, .ratings)
    }

    /// Returns the ratings plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchRatings() async -> (ratings: [String: Int], updatedAt: Date)? {
        guard let read = await readValue([String: Int].self, .ratings) else { return nil }
        return (read.value, read.updatedAt)
    }

    // MARK: - Recipe box

    /// The archive and the pins used to be two fields on one record. They
    /// are one sealed payload now, which keeps them syncing together for
    /// free.
    private struct RecipeBoxPayload: Codable {
        let recipes: [Recipe]
        let kept: [Recipe]
    }

    /// The full archive of every generated recipe plus the kept (pinned)
    /// recipes locked into the next generation. Both live on one record so
    /// they sync together.
    func saveRecipeBox(_ recipes: [Recipe], kept: [Recipe]) async throws {
        try await writeValue(RecipeBoxPayload(recipes: recipes, kept: kept), .recipeBox)
    }

    /// Returns the archive and pins plus the record's freshness date so the
    /// caller can skip applying a cloud copy that is older than local edits.
    func fetchRecipeBox() async -> (recipes: [Recipe], kept: [Recipe], updatedAt: Date)? {
        guard let read = await readValue(RecipeBoxPayload.self, .recipeBox) else { return nil }
        return (read.value.recipes, read.value.kept, read.updatedAt)
    }

    // MARK: - Pantry inventory

    /// The household's confirmed pantry (Feature 2's full manual inventory).
    /// Same record type and prefix the old flat staple-name list used.
    func savePantryItems(_ items: [PantryItem]) async throws {
        try await writeValue(items, .pantry)
    }

    /// Returns the pantry items plus the record's freshness date so the
    /// caller can skip applying a cloud copy that is older than local edits.
    /// Falls back to decoding the pre-Feature-2 flat `[String]` format and
    /// migrating it to PantryItem (in stock, category "Other"), so a
    /// household's existing staples survive the upgrade instead of vanishing
    /// the first time this reads their old record.
    func fetchPantryItems() async -> (items: [PantryItem], updatedAt: Date)? {
        guard let read = await readPayload(.pantry) else { return nil }
        if let items = try? JSONDecoder().decode([PantryItem].self, from: read.data) {
            return (items, read.updatedAt)
        }
        if let names = try? JSONDecoder().decode([String].self, from: read.data) {
            let migrated = names.map { PantryItem(name: $0, category: "Other") }
            return (migrated, read.updatedAt)
        }
        return nil
    }

    // MARK: - Freeform grocery items

    /// Items typed or spoken in with no recipe behind them (paper towels,
    /// dog food). Stored separately from the plan so they are not wiped out
    /// by the next plan regeneration.
    func saveFreeformItems(_ items: [FreeformGroceryItem]) async throws {
        try await writeValue(items, .freeform)
    }

    /// Returns the freeform items plus the record's freshness date so the
    /// caller can skip applying a cloud copy that is older than local edits.
    func fetchFreeformItems() async -> (items: [FreeformGroceryItem], updatedAt: Date)? {
        guard let read = await readValue([FreeformGroceryItem].self, .freeform) else { return nil }
        return (read.value, read.updatedAt)
    }

    // MARK: - Leftover check-in

    /// Per-day leftover status for the current week ("Monday" -> still in
    /// the fridge, or eaten). Keyed by day name, so it is only meaningful
    /// alongside the plan that produced it; AppState clears entries whose
    /// dinner changed on every regeneration.
    func saveLeftoverStatus(_ status: [String: Bool]) async throws {
        try await writeValue(status, .leftoverStatus)
    }

    /// Returns the leftover status plus the record's freshness date so the
    /// caller can skip applying a cloud copy that is older than local edits.
    func fetchLeftoverStatus() async -> (status: [String: Bool], updatedAt: Date)? {
        guard let read = await readValue([String: Bool].self, .leftoverStatus) else { return nil }
        return (read.value, read.updatedAt)
    }

    // MARK: - Subscriptions

    /// Registers silent-push query subscriptions so this phone refreshes
    /// when the other one changes something. Safe to call on every launch;
    /// saving an existing subscription ID just succeeds or errors quietly.
    /// Subscription IDs include the lookup ID, so stale subscriptions left
    /// behind by a previous household are found and deleted first.
    ///
    /// The predicate filters on householdID, which is why that field keeps a
    /// QUERYABLE index. It holds the derived lookup ID, so the index leaks
    /// nothing about the code.
    func ensureSubscriptions() async {
        guard let ctx = context else { return }
        let wantedIDs = Set(Kind.all.map { subscriptionID($0, ctx) })

        // Drop only OUR stale subscriptions: IDs this app created (the
        // "sub-" prefix) for a different household. Anything else in the
        // container is left untouched.
        if let existing = try? await database.allSubscriptions() {
            for subscription in existing
            where subscription.subscriptionID.hasPrefix("sub-")
                && !wantedIDs.contains(subscription.subscriptionID) {
                _ = try? await database.deleteSubscription(withID: subscription.subscriptionID)
            }
        }

        for kind in Kind.all {
            let predicate = NSPredicate(format: "householdID == %@", ctx.lookupID)
            let subscription = CKQuerySubscription(
                recordType: kind.type,
                predicate: predicate,
                subscriptionID: subscriptionID(kind, ctx),
                options: [.firesOnRecordCreation, .firesOnRecordUpdate]
            )
            let info = CKSubscription.NotificationInfo()
            info.shouldSendContentAvailable = true
            subscription.notificationInfo = info
            _ = try? await database.save(subscription)
        }
    }

    private func subscriptionID(_ kind: Kind, _ ctx: Context) -> String {
        "sub-\(kind.type)-\(ctx.lookupID)"
    }

    // MARK: - Deletion

    /// Deletes every record this household owns, then the subscriptions this
    /// app registered for it. App Store guideline 5.1.1(v) requires an
    /// in-app way to delete the data an app collects.
    ///
    /// Non-atomic on purpose. A household that never saved a pantry or a
    /// ratings record should still get every other record deleted, and the
    /// public database does not support atomic operations anyway. A record
    /// that is already gone comes back as .unknownItem, which is exactly the
    /// state the caller asked for, so it counts as success. Anything else is
    /// thrown, so the caller can leave the phone's data alone instead of
    /// telling the user it is gone while it is still in iCloud.
    func deleteAllHouseholdData() async throws {
        guard let ctx = context else { return }
        let ids = Kind.all.map { recordID($0, ctx) }
        let (_, deleteResults) = try await database.modifyRecords(
            saving: [],
            deleting: ids,
            atomically: false
        )
        for (_, result) in deleteResults {
            guard case .failure(let error) = result else { continue }
            if let ckError = error as? CKError, ckError.code == .unknownItem { continue }
            throw error
        }
        await deleteSubscriptions(for: ctx)
    }

    /// Removes the query subscriptions this app created for one household,
    /// matched by the same "sub-<type>-<lookupID>" scheme ensureSubscriptions
    /// writes, so nothing else in the container is touched. Best effort on
    /// purpose: once the records are gone a leftover subscription has
    /// nothing left to fire on, and it should not fail a deletion the user
    /// has already been told succeeded.
    private func deleteSubscriptions(for ctx: Context) async {
        guard let existing = try? await database.allSubscriptions() else { return }
        for subscription in existing
        where subscription.subscriptionID.hasPrefix("sub-")
            && subscription.subscriptionID.hasSuffix("-\(ctx.lookupID)") {
            _ = try? await database.deleteSubscription(withID: subscription.subscriptionID)
        }
    }

    // MARK: - Read and write helpers

    /// Encodes, seals, and writes. A no-op before onboarding.
    private func writeValue<T: Encodable>(_ value: T, _ kind: Kind) async throws {
        guard let ctx = context else { return }
        try await writePayload(try JSONEncoder().encode(value), kind, ctx: ctx)
    }

    /// Seals plaintext into the payload field and saves. `merge` runs only
    /// on a version conflict, on the two decrypted plaintexts, and its
    /// result is resealed before the retry.
    private func writePayload(
        _ plaintext: Data,
        _ kind: Kind,
        ctx: Context,
        merge: ((Data, Data) -> Data)? = nil
    ) async throws {
        let record = await fetchOrCreate(recordID(kind, ctx), type: kind.type)
        record[Self.payloadKey] = try HouseholdCrypto.seal(plaintext, key: ctx.key)
        record["householdID"] = ctx.lookupID
        record["updatedAt"] = Date()
        try await save(record, ctx: ctx, merge: merge)
    }

    /// Fetches and unseals. Returns nil when there is no code, no record, no
    /// payload, or the payload will not open under this household's key.
    private func readPayload(_ kind: Kind) async -> (data: Data, updatedAt: Date)? {
        guard let ctx = context,
              let record = try? await database.record(for: recordID(kind, ctx)),
              let sealed = record[Self.payloadKey] as? Data,
              let plaintext = HouseholdCrypto.open(sealed, key: ctx.key)
        else { return nil }
        return (plaintext, freshness(of: record))
    }

    /// readPayload plus a JSON decode, for the record types with no special
    /// tombstone handling.
    private func readValue<T: Decodable>(
        _ type: T.Type,
        _ kind: Kind
    ) async -> (value: T, updatedAt: Date)? {
        guard let read = await readPayload(kind),
              let value = try? JSONDecoder().decode(T.self, from: read.data)
        else { return nil }
        return (value, read.updatedAt)
    }

    /// Freshness date for a fetched record: the explicit "updatedAt" field,
    /// then CloudKit's modification date, then distantPast so a record with
    /// no date never beats local data.
    private func freshness(of record: CKRecord) -> Date {
        (record["updatedAt"] as? Date) ?? record.modificationDate ?? .distantPast
    }

    private func fetchOrCreate(_ id: CKRecord.ID, type: String) async -> CKRecord {
        if let existing = try? await database.record(for: id) {
            return existing
        }
        return CKRecord(recordType: type, recordID: id)
    }

    /// Saves the record. On a version conflict (the other phone wrote in
    /// between), retries once against the server's copy. With a `merge` the
    /// two payloads are unsealed, combined, and resealed, so a simultaneous
    /// grocery check-off does not lose either side. Without one, or if
    /// either payload will not open, our keys are copied onto the server
    /// record and newest wins.
    private func save(
        _ record: CKRecord,
        ctx: Context,
        merge: ((Data, Data) -> Data)? = nil
    ) async throws {
        do {
            _ = try await database.save(record)
        } catch let error as CKError where error.code == .serverRecordChanged {
            guard let server = error.serverRecord else { throw error }
            if let merge,
               let ourSealed = record[Self.payloadKey] as? Data,
               let theirSealed = server[Self.payloadKey] as? Data,
               let ours = HouseholdCrypto.open(ourSealed, key: ctx.key),
               let theirs = HouseholdCrypto.open(theirSealed, key: ctx.key) {
                server[Self.payloadKey] = try HouseholdCrypto.seal(
                    merge(ours, theirs), key: ctx.key
                )
                server["householdID"] = ctx.lookupID
                server["updatedAt"] = Date()
            } else {
                for key in record.allKeys() {
                    server[key] = record[key]
                }
            }
            _ = try await database.save(server)
        }
    }
}
