import CloudKit
import Foundation

/// Sync layer. Uses the CloudKit public database so both Apple IDs read and
/// write the same records with no third-party service and no extra keys.
///
/// Record layout (all record names are deterministic, so everything is
/// fetched by ID and no query indexes are needed for reads):
///   HouseholdPlan  "plan-<code>"       planJSON, householdID, updatedAt
///   GroceryState   "grocery-<code>"    checkedIDs [String], householdID, updatedAt
///   Favorites      "favorites-<code>"  recipesJSON, householdID, updatedAt
///   TasteHistory   "history-<code>"    historyJSON, householdID, updatedAt
///   Ratings        "ratings-<code>"    ratingsJSON, householdID, updatedAt
///   RecipeBox      "recipebox-<code>"  recipesJSON, keptJSON, householdID, updatedAt
///   Pantry         "pantry-<code>"     staplesJSON, householdID, updatedAt
///
/// CKQuerySubscriptions (predicate: householdID == code) push a silent
/// notification to the other phone whenever a record changes. The one-time
/// CloudKit Console step for this is in the README.
///
/// The household code lives in UserDefaults and can change while the app
/// is running (create, join, or leave a household), so it is read fresh on
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

    /// Always the current code, never a stale copy from init.
    private var household: String { HouseholdConfig.code }
    private let database: CKDatabase
    private let container: CKContainer

    init() {
        container = CKContainer(identifier: HouseholdConfig.cloudKitContainerID)
        database = container.publicCloudDatabase
    }

    private var planRecordID: CKRecord.ID { CKRecord.ID(recordName: "plan-\(household)") }
    private var groceryRecordID: CKRecord.ID { CKRecord.ID(recordName: "grocery-\(household)") }
    private var favoritesRecordID: CKRecord.ID { CKRecord.ID(recordName: "favorites-\(household)") }
    private var historyRecordID: CKRecord.ID { CKRecord.ID(recordName: "history-\(household)") }
    private var ratingsRecordID: CKRecord.ID { CKRecord.ID(recordName: "ratings-\(household)") }
    private var recipeBoxRecordID: CKRecord.ID { CKRecord.ID(recordName: "recipebox-\(household)") }
    private var pantryRecordID: CKRecord.ID { CKRecord.ID(recordName: "pantry-\(household)") }

    // MARK: - Account

    /// True when the user is signed into iCloud. The UI shows a friendly
    /// prompt when this is false.
    func isSignedIn() async -> Bool {
        let status = (try? await container.accountStatus()) ?? .couldNotDetermine
        return status == .available
    }

    // MARK: - Plan

    func savePlan(_ plan: MealPlan) async throws {
        guard !household.isEmpty else { return }
        let json = try String(data: JSONEncoder().encode(plan), encoding: .utf8) ?? "{}"
        let record = await fetchOrCreate(planRecordID, type: Self.planRecordType)
        record["planJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Clear This Week, cloud side. Writes the plan record with an empty
    /// planJSON (a tombstone) and a fresh updatedAt through the same
    /// conflict-merge save path, so the other phone's newest-wins refresh
    /// drops its local plan too instead of resurrecting the cleared week.
    func saveClearedPlan() async throws {
        guard !household.isEmpty else { return }
        let record = await fetchOrCreate(planRecordID, type: Self.planRecordType)
        record["planJSON"] = ""
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the plan plus the record's freshness date so the caller can
    /// skip applying a cloud copy that is older than local edits. Three
    /// outcomes: nil means no record exists at all; (nil, date) is a
    /// tombstone left by saveClearedPlan (empty or unparseable planJSON),
    /// which a caller applies by clearing its local plan when the date is
    /// newer; (plan, date) is a real plan.
    func fetchPlan() async -> (plan: MealPlan?, updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: planRecordID)
        else { return nil }
        guard let json = record["planJSON"] as? String,
              let data = json.data(using: .utf8),
              let plan = try? JSONDecoder().decode(MealPlan.self, from: data)
        else { return (nil, freshness(of: record)) }
        return (plan, freshness(of: record))
    }

    // MARK: - Grocery checked state

    func saveChecked(_ ids: Set<String>) async throws {
        guard !household.isEmpty else { return }
        let record = await fetchOrCreate(groceryRecordID, type: Self.groceryRecordType)
        record["checkedIDs"] = Array(ids)
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the checked IDs plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchChecked() async -> (checked: Set<String>, updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: groceryRecordID),
              let ids = record["checkedIDs"] as? [String]
        else { return nil }
        return (Set(ids), freshness(of: record))
    }

    // MARK: - Favorites

    func saveFavorites(_ recipes: [Recipe]) async throws {
        guard !household.isEmpty else { return }
        let json = try String(data: JSONEncoder().encode(recipes), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(favoritesRecordID, type: Self.favoritesRecordType)
        record["recipesJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the favorites plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchFavorites() async -> (recipes: [Recipe], updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: favoritesRecordID),
              let json = record["recipesJSON"] as? String,
              let data = json.data(using: .utf8),
              let recipes = try? JSONDecoder().decode([Recipe].self, from: data)
        else { return nil }
        return (recipes, freshness(of: record))
    }

    // MARK: - Taste history

    func saveHistory(_ dinners: [PastDinner]) async throws {
        guard !household.isEmpty else { return }
        let json = try String(data: JSONEncoder().encode(dinners), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(historyRecordID, type: Self.historyRecordType)
        record["historyJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the history plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchHistory() async -> (dinners: [PastDinner], updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: historyRecordID),
              let json = record["historyJSON"] as? String,
              let data = json.data(using: .utf8),
              let dinners = try? JSONDecoder().decode([PastDinner].self, from: data)
        else { return nil }
        return (dinners, freshness(of: record))
    }

    // MARK: - Ratings

    /// Star ratings keyed by recipe title, 1 through 5.
    func saveRatings(_ ratings: [String: Int]) async throws {
        guard !household.isEmpty else { return }
        let json = try String(data: JSONEncoder().encode(ratings), encoding: .utf8) ?? "{}"
        let record = await fetchOrCreate(ratingsRecordID, type: Self.ratingsRecordType)
        record["ratingsJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the ratings plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchRatings() async -> (ratings: [String: Int], updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: ratingsRecordID),
              let json = record["ratingsJSON"] as? String,
              let data = json.data(using: .utf8),
              let ratings = try? JSONDecoder().decode([String: Int].self, from: data)
        else { return nil }
        return (ratings, freshness(of: record))
    }

    // MARK: - Recipe box

    /// The full archive of every generated recipe plus the kept (pinned)
    /// recipes locked into the next generation. Both live on one record so
    /// they sync together.
    func saveRecipeBox(_ recipes: [Recipe], kept: [Recipe]) async throws {
        guard !household.isEmpty else { return }
        let recipesJSON = try String(data: JSONEncoder().encode(recipes), encoding: .utf8) ?? "[]"
        let keptJSON = try String(data: JSONEncoder().encode(kept), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(recipeBoxRecordID, type: Self.recipeBoxRecordType)
        record["recipesJSON"] = recipesJSON
        record["keptJSON"] = keptJSON
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the archive and pins plus the record's freshness date so the
    /// caller can skip applying a cloud copy that is older than local edits.
    func fetchRecipeBox() async -> (recipes: [Recipe], kept: [Recipe], updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: recipeBoxRecordID),
              let recipesJSON = record["recipesJSON"] as? String,
              let recipesData = recipesJSON.data(using: .utf8),
              let recipes = try? JSONDecoder().decode([Recipe].self, from: recipesData)
        else { return nil }
        var kept: [Recipe] = []
        if let keptJSON = record["keptJSON"] as? String,
           let keptData = keptJSON.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([Recipe].self, from: keptData) {
            kept = decoded
        }
        return (recipes, kept, freshness(of: record))
    }

    // MARK: - Pantry staples

    /// Staples the household always has at home (Pantry Memory), stored in
    /// display order. Plans skip buying these and leave them out of the
    /// budget estimate.
    func saveStaples(_ staples: [String]) async throws {
        guard !household.isEmpty else { return }
        let json = try String(data: JSONEncoder().encode(staples), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(pantryRecordID, type: Self.pantryRecordType)
        record["staplesJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    /// Returns the staples plus the record's freshness date so the caller
    /// can skip applying a cloud copy that is older than local edits.
    func fetchStaples() async -> (staples: [String], updatedAt: Date)? {
        guard !household.isEmpty,
              let record = try? await database.record(for: pantryRecordID),
              let json = record["staplesJSON"] as? String,
              let data = json.data(using: .utf8),
              let staples = try? JSONDecoder().decode([String].self, from: data)
        else { return nil }
        return (staples, freshness(of: record))
    }

    // MARK: - Subscriptions

    /// Registers silent-push query subscriptions so this phone refreshes
    /// when the other one changes something. Safe to call on every launch;
    /// saving an existing subscription ID just succeeds or errors quietly.
    /// Subscription IDs include the household code, so stale subscriptions
    /// left behind by a previous code (after joining or starting a new
    /// household) are found and deleted first.
    func ensureSubscriptions() async {
        let code = household
        guard !code.isEmpty else { return }
        let types = [
            Self.planRecordType, Self.groceryRecordType,
            Self.favoritesRecordType, Self.historyRecordType,
            Self.ratingsRecordType, Self.recipeBoxRecordType,
            Self.pantryRecordType
        ]
        let wantedIDs = Set(types.map { "sub-\($0)-\(code)" })

        // Drop only OUR stale subscriptions: IDs this app created (the
        // "sub-" prefix) for a different household code. Anything else in
        // the container is left untouched.
        if let existing = try? await database.allSubscriptions() {
            for subscription in existing
            where subscription.subscriptionID.hasPrefix("sub-")
                && !wantedIDs.contains(subscription.subscriptionID) {
                _ = try? await database.deleteSubscription(withID: subscription.subscriptionID)
            }
        }

        for type in types {
            let subscriptionID = "sub-\(type)-\(code)"
            let predicate = NSPredicate(format: "householdID == %@", code)
            let subscription = CKQuerySubscription(
                recordType: type,
                predicate: predicate,
                subscriptionID: subscriptionID,
                options: [.firesOnRecordCreation, .firesOnRecordUpdate]
            )
            let info = CKSubscription.NotificationInfo()
            info.shouldSendContentAvailable = true
            subscription.notificationInfo = info
            _ = try? await database.save(subscription)
        }
    }

    // MARK: - Deletion

    /// Deletes every record this household owns, then the subscriptions this
    /// app registered for it. App Store guideline 5.1.1(v) requires an
    /// in-app way to delete the data an app collects, and nothing here ever
    /// removed a record from the public database before this.
    ///
    /// Non-atomic on purpose. A household that never saved a pantry or a
    /// ratings record should still get every other record deleted, and the
    /// public database does not support atomic operations anyway. A record
    /// that is already gone comes back as .unknownItem, which is exactly the
    /// state the caller asked for, so it counts as success. Anything else is
    /// thrown, so the caller can leave the phone's data alone instead of
    /// telling the user it is gone while it is still in iCloud.
    func deleteAllHouseholdData() async throws {
        let code = household
        guard !code.isEmpty else { return }
        let ids = [
            planRecordID, groceryRecordID, favoritesRecordID,
            historyRecordID, ratingsRecordID, recipeBoxRecordID,
            pantryRecordID
        ]
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
        await deleteSubscriptions(for: code)
    }

    /// Removes the query subscriptions this app created for one household,
    /// matched by the same "sub-<type>-<code>" scheme ensureSubscriptions
    /// writes, so nothing else in the container is touched. Best effort on
    /// purpose: once the records are gone a leftover subscription has
    /// nothing left to fire on, and it should not fail a deletion the user
    /// has already been told succeeded.
    private func deleteSubscriptions(for code: String) async {
        guard let existing = try? await database.allSubscriptions() else { return }
        for subscription in existing
        where subscription.subscriptionID.hasPrefix("sub-")
            && subscription.subscriptionID.hasSuffix("-\(code)") {
            _ = try? await database.deleteSubscription(withID: subscription.subscriptionID)
        }
    }

    // MARK: - Helpers

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
    /// between), retries once by applying our keys onto the server's copy,
    /// so a simultaneous check-off does not fail the write. The grocery
    /// record's checkedIDs field is special-cased: the retry writes the
    /// union of both phones' arrays so neither side's check-offs are lost.
    private func save(_ record: CKRecord) async throws {
        do {
            _ = try await database.save(record)
        } catch let error as CKError where error.code == .serverRecordChanged {
            guard let server = error.serverRecord else { throw error }
            for key in record.allKeys() {
                if record.recordType == Self.groceryRecordType,
                   key == "checkedIDs",
                   let localIDs = record[key] as? [String],
                   let serverIDs = server[key] as? [String] {
                    server[key] = Array(Set(localIDs).union(serverIDs))
                } else {
                    server[key] = record[key]
                }
            }
            _ = try await database.save(server)
        }
    }
}
