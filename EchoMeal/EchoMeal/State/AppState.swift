import Combine
import Foundation
import SwiftUI

extension Notification.Name {
    static let cloudDataChanged = Notification.Name("cloudDataChanged")
}

/// Single source of truth for the app. Owns the plan, the checked grocery
/// items, the favorites library, the recipe box archive, the kept (pinned)
/// dinners, and the sync plumbing.
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
    /// Every recipe ever generated, newest first. Recipes only leave this
    /// archive when the user deletes them by hand.
    @Published var recipeBox: [Recipe] = []
    /// Pinned dinners locked into the next generation. They survive week
    /// after week until the user unpins them.
    @Published var keptRecipes: [Recipe] = []
    @Published var pastDinners: [PastDinner] = []
    @Published var ratings: [String: Int] = [:]
    @Published var phase: Phase = .idle
    @Published var selectedTab: Tab = .speak
    @Published var iCloudAvailable = true

    /// Cap on the rolling dinner history used for taste learning.
    private static let historyLimit = 60

    private let store = CloudKitStore()
    private var cancellables = Set<AnyCancellable>()

    /// When each collection was last edited on this device, keyed by
    /// "plan", "checked", "favorites", "history", "ratings", "recipeBox".
    /// Newest wins: a cloud copy older than the local edit is never applied,
    /// so a stale fetch cannot roll back fresh local data.
    private var localEditDates: [String: Date] = [:]

    /// Guards against overlapping refreshes (a push can land mid-refresh).
    private var isRefreshing = false

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
        let loved = ratings.filter { $0.value >= 4 }.keys.sorted().prefix(12)
        if !loved.isEmpty {
            parts.append("Meals they cooked and rated 4 or 5 stars, lean toward more like these: \(loved.joined(separator: ", ")).")
        }
        let disliked = ratings.filter { $0.value <= 2 }.keys.sorted().prefix(12)
        if !disliked.isEmpty {
            parts.append("Meals they cooked and rated 1 or 2 stars. Never suggest these again, or close variations of them: \(disliked.joined(separator: ", ")).")
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
                let rawPlan = try await ClaudeService.planWeek(
                    transcript: transcript,
                    budget: budgetTarget,
                    dinners: dinnersPerWeek,
                    tasteNotes: tasteNotes,
                    lockedRecipes: keptRecipes
                )
                // Safety net: guarantee every recipe ingredient is on the
                // grocery list before anything downstream uses the plan
                // (recipe box archive, checked-item IDs, CloudKit save).
                let newPlan = rawPlan.reconciledWithRecipes()
                // Archive before replacing so nothing is ever lost. The old
                // plan covers weeks generated before the Recipe Box existed;
                // the new plan is archived right away so it survives the
                // next replacement too.
                if let oldPlan = self.plan {
                    self.archiveIntoRecipeBox(oldPlan.recipes)
                }
                self.archiveIntoRecipeBox(newPlan.recipes)
                self.plan = newPlan
                // Keep check-offs the household already made for items that
                // are still on the new list, and pre-check the new plan's
                // pantry staples as before.
                var newPlanItemIDs = Set<String>()
                for section in newPlan.grocery.sections {
                    for item in section.items {
                        newPlanItemIDs.insert(MealPlan.itemID(section: section.name, item: item.name))
                    }
                }
                self.checkedItemIDs = self.checkedItemIDs
                    .intersection(newPlanItemIDs)
                    .union(newPlan.pantryItemIDs)
                self.recordHistory(from: newPlan)
                self.phase = .idle
                self.selectedTab = .week
                self.markEdited("plan")
                self.markEdited("checked")
                self.markEdited("history")
                self.markEdited("recipeBox")

                // Push to CloudKit so the other phone picks it up.
                let checked = self.checkedItemIDs
                let history = self.pastDinners
                let box = self.recipeBox
                let kept = self.keptRecipes
                Task {
                    try? await self.store.savePlan(newPlan)
                    try? await self.store.saveChecked(checked)
                    try? await self.store.saveHistory(history)
                    try? await self.store.saveRecipeBox(box, kept: kept)
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
        markEdited("checked")
        let snapshot = checkedItemIDs
        Task { try? await store.saveChecked(snapshot) }
    }

    // MARK: - Ratings

    func rating(for recipe: Recipe) -> Int {
        ratings[recipe.title] ?? 0
    }

    func rating(forTitle title: String) -> Int? {
        ratings[title]
    }

    /// Rate a cooked meal 1 through 5. Tapping the current star again clears
    /// the rating. Low ratings (1 or 2) are excluded from future suggestions.
    func rate(_ recipe: Recipe, stars: Int) {
        if ratings[recipe.title] == stars {
            ratings.removeValue(forKey: recipe.title)
        } else {
            ratings[recipe.title] = stars
        }
        markEdited("ratings")
        let snapshot = ratings
        Task { try? await store.saveRatings(snapshot) }
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
        markEdited("favorites")
        let snapshot = favorites
        Task { try? await store.saveFavorites(snapshot) }
    }

    // MARK: - Recipe box and keep pins

    /// Merges recipes into the box, deduping by title (case-insensitive).
    /// A matching title is replaced in place so the newest version wins;
    /// unseen titles are inserted at the front, newest first.
    private func archiveIntoRecipeBox(_ recipes: [Recipe]) {
        for recipe in recipes {
            if let index = recipeBox.firstIndex(where: {
                $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
            }) {
                recipeBox[index] = recipe
            } else {
                recipeBox.insert(recipe, at: 0)
            }
        }
    }

    func isKept(_ recipe: Recipe) -> Bool {
        keptRecipes.contains {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }
    }

    /// Pin or unpin a recipe. Pinned recipes ride along into every new
    /// generation, exactly as saved, until unpinned.
    func toggleKeep(_ recipe: Recipe) {
        if let index = keptRecipes.firstIndex(where: {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }) {
            keptRecipes.remove(at: index)
        } else {
            keptRecipes.append(recipe)
        }
        markEdited("recipeBox")
        let box = recipeBox
        let kept = keptRecipes
        Task { try? await store.saveRecipeBox(box, kept: kept) }
    }

    /// The only way a recipe leaves the archive. Also clears its pin and
    /// favorite so no stale copy lingers anywhere.
    func deleteFromRecipeBox(_ recipe: Recipe) {
        recipeBox.removeAll {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }
        keptRecipes.removeAll {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }
        favorites.removeAll {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }
        markEdited("recipeBox")
        markEdited("favorites")
        let box = recipeBox
        let kept = keptRecipes
        let favs = favorites
        Task {
            try? await store.saveRecipeBox(box, kept: kept)
            try? await store.saveFavorites(favs)
        }
    }

    // MARK: - Sync

    /// Records that a collection was just edited on this device, then
    /// persists so a relaunch cannot forget that local data is newer.
    private func markEdited(_ key: String) {
        localEditDates[key] = Date()
        saveLocalCache()
    }

    /// Date of the last local edit for a key. Never edited counts as
    /// distantPast, so any cloud copy wins.
    private func localEditDate(for key: String) -> Date {
        localEditDates[key] ?? .distantPast
    }

    /// Pulls each record from CloudKit and applies it only when the cloud
    /// copy is newer than the last local edit (newest wins). Skipped
    /// entirely mid-generation so a stale fetch cannot revert a brand-new
    /// plan, and never runs twice at once.
    func refreshFromCloud() async {
        guard phase != .planning else { return }
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        iCloudAvailable = await store.isSignedIn()
        guard iCloudAvailable else { return }

        if let remote = await store.fetchPlan(),
           remote.updatedAt > localEditDate(for: "plan") {
            if remote.plan != plan {
                plan = remote.plan
            }
            localEditDates["plan"] = remote.updatedAt
        }
        if let remote = await store.fetchChecked(),
           remote.updatedAt > localEditDate(for: "checked") {
            if remote.checked != checkedItemIDs {
                checkedItemIDs = remote.checked
            }
            localEditDates["checked"] = remote.updatedAt
        }
        if let remote = await store.fetchFavorites(),
           remote.updatedAt > localEditDate(for: "favorites") {
            if remote.recipes != favorites {
                favorites = remote.recipes
            }
            localEditDates["favorites"] = remote.updatedAt
        }
        if let remote = await store.fetchHistory(),
           remote.updatedAt > localEditDate(for: "history") {
            if remote.dinners != pastDinners {
                pastDinners = remote.dinners
            }
            localEditDates["history"] = remote.updatedAt
        }
        if let remote = await store.fetchRatings(),
           remote.updatedAt > localEditDate(for: "ratings") {
            if remote.ratings != ratings {
                ratings = remote.ratings
            }
            localEditDates["ratings"] = remote.updatedAt
        }
        if let remote = await store.fetchRecipeBox(),
           remote.updatedAt > localEditDate(for: "recipeBox") {
            if remote.recipes != recipeBox {
                recipeBox = remote.recipes
            }
            if remote.kept != keptRecipes {
                keptRecipes = remote.kept
            }
            localEditDates["recipeBox"] = remote.updatedAt
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
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedRatings),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([String: Int].self, from: data) {
            ratings = cached
        }
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedRecipeBox),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([Recipe].self, from: data) {
            recipeBox = cached
        }
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedKeptRecipes),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([Recipe].self, from: data) {
            keptRecipes = cached
        }
        if let stamps = defaults.dictionary(forKey: HouseholdConfig.Keys.cachedEditDates) as? [String: Double] {
            localEditDates = stamps.mapValues { Date(timeIntervalSince1970: $0) }
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
        if let data = try? JSONEncoder().encode(ratings),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedRatings)
        }
        if let data = try? JSONEncoder().encode(recipeBox),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedRecipeBox)
        }
        if let data = try? JSONEncoder().encode(keptRecipes),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedKeptRecipes)
        }
        let stamps = localEditDates.mapValues { $0.timeIntervalSince1970 }
        defaults.set(stamps, forKey: HouseholdConfig.Keys.cachedEditDates)
    }
}
