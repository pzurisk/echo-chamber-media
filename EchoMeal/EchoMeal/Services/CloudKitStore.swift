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
///
/// CKQuerySubscriptions (predicate: householdID == code) push a silent
/// notification to the other phone whenever a record changes. The one-time
/// CloudKit Console step for this is in the README.
final class CloudKitStore {

    static let planRecordType = "HouseholdPlan"
    static let groceryRecordType = "GroceryState"
    static let favoritesRecordType = "Favorites"
    static let historyRecordType = "TasteHistory"

    private let household = HouseholdConfig.code
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

    // MARK: - Account

    /// True when the user is signed into iCloud. The UI shows a friendly
    /// prompt when this is false.
    func isSignedIn() async -> Bool {
        let status = (try? await container.accountStatus()) ?? .couldNotDetermine
        return status == .available
    }

    // MARK: - Plan

    func savePlan(_ plan: MealPlan) async throws {
        let json = try String(data: JSONEncoder().encode(plan), encoding: .utf8) ?? "{}"
        let record = await fetchOrCreate(planRecordID, type: Self.planRecordType)
        record["planJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    func fetchPlan() async -> MealPlan? {
        guard let record = try? await database.record(for: planRecordID),
              let json = record["planJSON"] as? String,
              let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(MealPlan.self, from: data)
    }

    // MARK: - Grocery checked state

    func saveChecked(_ ids: Set<String>) async throws {
        let record = await fetchOrCreate(groceryRecordID, type: Self.groceryRecordType)
        record["checkedIDs"] = Array(ids)
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    func fetchChecked() async -> Set<String>? {
        guard let record = try? await database.record(for: groceryRecordID),
              let ids = record["checkedIDs"] as? [String]
        else { return nil }
        return Set(ids)
    }

    // MARK: - Favorites

    func saveFavorites(_ recipes: [Recipe]) async throws {
        let json = try String(data: JSONEncoder().encode(recipes), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(favoritesRecordID, type: Self.favoritesRecordType)
        record["recipesJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    func fetchFavorites() async -> [Recipe]? {
        guard let record = try? await database.record(for: favoritesRecordID),
              let json = record["recipesJSON"] as? String,
              let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode([Recipe].self, from: data)
    }

    // MARK: - Taste history

    func saveHistory(_ dinners: [PastDinner]) async throws {
        let json = try String(data: JSONEncoder().encode(dinners), encoding: .utf8) ?? "[]"
        let record = await fetchOrCreate(historyRecordID, type: Self.historyRecordType)
        record["historyJSON"] = json
        record["householdID"] = household
        record["updatedAt"] = Date()
        try await save(record)
    }

    func fetchHistory() async -> [PastDinner]? {
        guard let record = try? await database.record(for: historyRecordID),
              let json = record["historyJSON"] as? String,
              let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode([PastDinner].self, from: data)
    }

    // MARK: - Subscriptions

    /// Registers silent-push query subscriptions so this phone refreshes
    /// when the other one changes something. Safe to call on every launch;
    /// saving an existing subscription ID just succeeds or errors quietly.
    func ensureSubscriptions() async {
        let types = [Self.planRecordType, Self.groceryRecordType, Self.favoritesRecordType, Self.historyRecordType]
        for type in types {
            let subscriptionID = "sub-\(type)-\(household)"
            let predicate = NSPredicate(format: "householdID == %@", household)
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

    // MARK: - Helpers

    private func fetchOrCreate(_ id: CKRecord.ID, type: String) async -> CKRecord {
        if let existing = try? await database.record(for: id) {
            return existing
        }
        return CKRecord(recordType: type, recordID: id)
    }

    /// Saves the record. On a version conflict (the other phone wrote in
    /// between), retries once by applying our keys onto the server's copy,
    /// so a simultaneous check-off does not fail the write.
    private func save(_ record: CKRecord) async throws {
        do {
            _ = try await database.save(record)
        } catch let error as CKError where error.code == .serverRecordChanged {
            guard let server = error.serverRecord else { throw error }
            for key in record.allKeys() {
                server[key] = record[key]
            }
            _ = try await database.save(server)
        }
    }
}
