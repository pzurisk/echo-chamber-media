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
    @Published var phase: Phase = .idle
    @Published var selectedTab: Tab = .speak
    @Published var iCloudAvailable = true

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

    // MARK: - Planning

    func generatePlan(from transcript: String) {
        guard phase != .planning else { return }
        phase = .planning
        Task {
            do {
                let newPlan = try await ClaudeService.planWeek(
                    transcript: transcript,
                    budget: budgetTarget,
                    dinners: dinnersPerWeek
                )
                self.plan = newPlan
                self.checkedItemIDs = newPlan.pantryItemIDs
                self.phase = .idle
                self.selectedTab = .week
                self.saveLocalCache()

                // Push to CloudKit so the other phone picks it up.
                Task {
                    try? await self.store.savePlan(newPlan)
                    try? await self.store.saveChecked(newPlan.pantryItemIDs)
                }
            } catch {
                self.phase = .error(error.localizedDescription)
            }
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
    }
}
