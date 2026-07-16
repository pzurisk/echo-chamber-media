import Combine
import Foundation
import SwiftUI

extension Notification.Name {
    static let cloudDataChanged = Notification.Name("cloudDataChanged")
}

/// Single source of truth for the app. Owns the plan, the checked grocery
/// items, the favorites library, and the sync plumbing.
@MainActor
final class AppState: ObservableObject {

    enum Phase: Equatable {
        case idle
        case planning
        case error(String)
    }

    enum Tab: Hashable {
        case speak, week, list
    }

    @Published var plan: MealPlan?
    @Published var checkedItemIDs: Set<String> = []
    @Published var favorites: [Recipe] = []
    @Published var pastDinners: [PastDinner] = []
    @Published var phase: Phase = .idle
    @Published var selectedTab: Tab = .speak
    @Published var iCloudAvailable = true

    /// Cap on the rolling dinner history used for taste learning.
    private static let historyLimit = 60

    private let store = CloudKitStore()
    private var cancellables = Set<AnyCancellable>()

    init() {
        UserDefaults.standard.register(defaults: [
            HouseholdConfig.Keys.budgetTarget: 100.0,
            HouseholdConfig.Keys.dinnersPerWeek: 5
        ])

        loadLocalCache()

        NotificationCenter.default.publisher(for: .cloudDataChanged)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                Task { await self?.refreshFromCloud() }
            }
            .store(in: &cancellables)

        Task {
            iCloudAvailable = await store.isSignedIn()
            await store.ensureSubscriptions()
            await refreshFromCloud()
        }
    }

    // MARK: - Settings

    var budgetTarget: Double {
        UserDefaults.standard.double(forKey: HouseholdConfig.Keys.budgetTarget)
    }

    var dinnersPerWeek: Int {
        UserDefaults.standard.integer(forKey: HouseholdConfig.Keys.dinnersPerWeek)
    }

    // MARK: - Taste learning

    /// A short profile built from favorites and the rolling dinner history.
    /// Sent along with every planning request so suggestions improve as the
    /// app learns what the household actually likes.
    var tasteNotes: String {
        var parts: [String] = []
        if !favorites.isEmpty {
            let titles = favorites.suffix(8).map(\.title).joined(separator: ", ")
            parts.append("Recipes they saved as favorites (they loved these, lean into similar flavors): \(titles).")
        }
        let topCuisines = favoriteCuisines
        if !topCuisines.isEmpty {
            parts.append("Cuisines they come back to: \(topCuisines.joined(separator: ", ")).")
        }
        let recent = pastDinners.suffix(15).map(\.title)
        if !recent.isEmpty {
            parts.append("Dinners from recent weeks, do not repeat these exactly: \(recent.joined(separator: ", ")).")
        }
        return parts.joined(separator: " ")
    }

    /// Most common cuisines across the dinner history, best first.
    var favoriteCuisines: [String] {
        var counts: [String: Int] = [:]
        for dinner in pastDinners where !dinner.cuisine.isEmpty {
            counts[dinner.cuisine, default: 0] += 1
        }
        return counts.sorted { $0.value > $1.value }.prefix(3).map(\.key)
    }

    /// Short idea prompts shown on the Speak tab.
    var suggestionIdeas: [String] {
        var ideas = favorites.suffix(3).map { "More like \($0.title)" }
        for cuisine in favoriteCuisines where ideas.count < 3 {
            ideas.append("A \(cuisine) night")
        }
        return ideas
    }

    // MARK: - Planning

    func generatePlan(from transcript: String) {
        guard phase != .planning else { return }
        phase = .planning
        Task {
            do {
                let newPlan = try await ClaudeService.planWeek(
                    transcript: transcript,
                    budget: budgetTarget,
                    dinners: dinnersPerWeek,
                    tasteNotes: tasteNotes
                )
                self.plan = newPlan
                self.checkedItemIDs = newPlan.pantryItemIDs
                self.recordHistory(from: newPlan)
                self.phase = .idle
                self.selectedTab = .week
                self.saveLocalCache()

                // Push to CloudKit so the other phone picks it up.
                let history = self.pastDinners
                Task {
                    try? await self.store.savePlan(newPlan)
                    try? await self.store.saveChecked(newPlan.pantryItemIDs)
                    try? await self.store.saveHistory(history)
                }
            } catch {
                self.phase = .error(error.localizedDescription)
            }
        }
    }

    /// Plans a week with no spoken input at all: Claude picks based on what
    /// the app has learned about the household so far.
    func surpriseMe() {
        generatePlan(from: "No specific cravings this time. Build a week you are confident this household will love based on the taste notes, and include one new dish worth trying that fits their pattern.")
    }

    private func recordHistory(from newPlan: MealPlan) {
        let now = Date()
        let dinners = newPlan.week.map {
            PastDinner(title: $0.title, cuisine: $0.cuisine, date: now)
        }
        pastDinners.append(contentsOf: dinners)
        if pastDinners.count > Self.historyLimit {
            pastDinners.removeFirst(pastDinners.count - Self.historyLimit)
        }
    }

    func clearError() {
        if case .error = phase { phase = .idle }
    }

    // MARK: - Grocery list

    func isChecked(section: String, item: String) -> Bool {
        checkedItemIDs.contains(MealPlan.itemID(section: section, item: item))
    }

    func toggle(section: String, item: String) {
        let id = MealPlan.itemID(section: section, item: item)
        if checkedItemIDs.contains(id) {
            checkedItemIDs.remove(id)
        } else {
            checkedItemIDs.insert(id)
        }
        saveLocalCache()
        let snapshot = checkedItemIDs
        Task { try? await store.saveChecked(snapshot) }
    }

    // MARK: - Favorites

    func isFavorite(_ recipe: Recipe) -> Bool {
        favorites.contains { $0.title == recipe.title }
    }

    func toggleFavorite(_ recipe: Recipe) {
        if let index = favorites.firstIndex(where: { $0.title == recipe.title }) {
            favorites.remove(at: index)
        } else {
            favorites.append(recipe)
        }
        saveLocalCache()
        let snapshot = favorites
        Task { try? await store.saveFavorites(snapshot) }
    }

    // MARK: - Sync

    func refreshFromCloud() async {
        iCloudAvailable = await store.isSignedIn()
        guard iCloudAvailable else { return }

        if let remotePlan = await store.fetchPlan() {
            if remotePlan != plan {
                plan = remotePlan
            }
        }
        if let remoteChecked = await store.fetchChecked() {
            if remoteChecked != checkedItemIDs {
                checkedItemIDs = remoteChecked
            }
        }
        if let remoteFavorites = await store.fetchFavorites() {
            if remoteFavorites != favorites {
                favorites = remoteFavorites
            }
        }
        if let remoteHistory = await store.fetchHistory() {
            if remoteHistory != pastDinners {
                pastDinners = remoteHistory
            }
        }
        saveLocalCache()
    }

    // MARK: - Local cache (offline relaunch)

    private func loadLocalCache() {
        let defaults = UserDefaults.standard
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedPlan),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode(MealPlan.self, from: data) {
            plan = cached
        }
        if let ids = defaults.stringArray(forKey: HouseholdConfig.Keys.cachedChecked) {
            checkedItemIDs = Set(ids)
        }
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedFavorites),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([Recipe].self, from: data) {
            favorites = cached
        }
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedHistory),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([PastDinner].self, from: data) {
            pastDinners = cached
        }
    }

    private func saveLocalCache() {
        let defaults = UserDefaults.standard
        if let plan,
           let data = try? JSONEncoder().encode(plan),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedPlan)
        }
        defaults.set(Array(checkedItemIDs), forKey: HouseholdConfig.Keys.cachedChecked)
        if let data = try? JSONEncoder().encode(favorites),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedFavorites)
        }
        if let data = try? JSONEncoder().encode(pastDinners),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedHistory)
        }
    }
}
