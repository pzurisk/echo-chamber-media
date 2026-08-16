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
    /// Pantry Memory: staples the household always has at home (rice,
    /// olive oil, soy sauce), in display order, user-managed in Settings.
    /// Plans skip buying these and leave them out of the budget estimate.
    @Published var pantryStaples: [String] = []
    @Published var pastDinners: [PastDinner] = []
    @Published var ratings: [String: Int] = [:]
    @Published var phase: Phase = .idle
    /// Short transient notice shown near the Speak tab's status area, for
    /// example when a tap lands while the last plan is still building.
    /// Set via flashStatus, which clears it again after a few seconds.
    @Published var statusMessage: String?
    @Published var selectedTab: Tab = .speak
    @Published var iCloudAvailable = true
    /// True once this phone belongs to a household (a code is stored).
    /// Drives the onboarding cover: false shows setup, true shows the app.
    @Published var isOnboarded = false
    /// True once the one-time notice about sending meal data to Claude has
    /// been accepted. Apple requires clear in-app disclosure before user
    /// content goes to a third-party AI, so planning is gated on this.
    @Published var aiNoticeAccepted = UserDefaults.standard.bool(forKey: HouseholdConfig.Keys.aiNoticeAccepted)

    /// Raised when a plan was asked for and this phone has no subscription.
    /// RootView presents the paywall on it, so every entry point into
    /// planning gets the paywall without knowing anything about StoreKit.
    @Published var showPaywall = false

    /// The subscription. AppState owns it so there is exactly one instance,
    /// and EchoMealApp puts this same object into the environment for the
    /// paywall and Settings to read.
    let subscriptions = SubscriptionStore()

    /// The generation the paywall interrupted, replayed if the user
    /// subscribes. Someone who spoke a week, hit the paywall, and paid
    /// should get the week they asked for, not an empty screen and a second
    /// trip to the mic.
    private var pendingGeneration: (() -> Void)?

    /// Cap on the rolling dinner history used for taste learning.
    private static let historyLimit = 60

    private let store = CloudKitStore()
    private var cancellables = Set<AnyCancellable>()

    /// Handle for the in-flight generation so it can be cancelled from the
    /// UI and checked by the foreground stuck-state recovery.
    private var planTask: Task<Void, Never>?

    /// Auto-clear timer for statusMessage, replaced on every flash.
    private var statusClearTask: Task<Void, Never>?

    /// When each collection was last edited on this device, keyed by
    /// "plan", "checked", "favorites", "history", "ratings", "recipeBox",
    /// "pantry".
    /// Newest wins: a cloud copy older than the local edit is never applied,
    /// so a stale fetch cannot roll back fresh local data.
    private var localEditDates: [String: Date] = [:]

    /// Guards against overlapping refreshes (a push can land mid-refresh).
    private var isRefreshing = false

    /// Bumped every time the household changes. refreshFromCloud captures
    /// the value at entry and re-checks it before each apply, so an
    /// in-flight refresh for the old household can never write its data
    /// into the new one.
    private var refreshGeneration = 0

    /// Collections whose last background CloudKit save failed, by the same
    /// keys as localEditDates. retryDirtySaves pushes the current state for
    /// each next time the app comes to the foreground.
    private var dirtyKinds: Set<String> = []

    init() {
        // No legacy household migration here, on purpose. Installs from
        // before per-household codes existed used to adopt a fixed code
        // hardcoded in this repo, which is public, so anyone could read
        // that household's records straight out of the public database.
        // A code-less install goes through onboarding instead. Do not
        // reintroduce a migration that hardcodes a household code.

        UserDefaults.standard.register(defaults: [
            HouseholdConfig.Keys.budgetTarget: 100.0,
            HouseholdConfig.Keys.dinnersPerWeek: 5
        ])

        isOnboarded = !HouseholdConfig.code.isEmpty
        loadLocalCache()

        NotificationCenter.default.publisher(for: .cloudDataChanged)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                Task { await self?.refreshFromCloud() }
            }
            .store(in: &cancellables)

        // Before onboarding there is no code, so there is nothing to
        // subscribe to or fetch. createHousehold and joinHousehold kick
        // off this same work once a code exists.
        if isOnboarded {
            Task {
                iCloudAvailable = await store.isSignedIn()
                await store.ensureSubscriptions()
                await refreshFromCloud()
            }
        }
    }

    // MARK: - Household membership

    /// The code this phone syncs under. Empty until onboarding finishes.
    var householdCode: String {
        HouseholdConfig.code
    }

    /// Starts a brand new household: fresh code, clean slate, new
    /// subscriptions. Returns the code so onboarding can show it big.
    @discardableResult
    func createHousehold() -> String {
        let code = HouseholdConfig.generateCode()
        switchToHousehold(code)
        return code
    }

    /// Joins an existing household by its code. Local data is cleared and
    /// the partner's data arrives from the cloud on the refresh. Returns
    /// false (and changes nothing) when the code is too short to be real.
    func joinHousehold(code raw: String) -> Bool {
        let code = HouseholdConfig.normalize(raw)
        guard code.count >= 4 else { return false }
        switchToHousehold(code)
        return true
    }

    /// Settings uses this to disconnect from the current household and
    /// start a fresh one. The partner keeps the old data under the old code.
    func leaveHouseholdAndStartNew() {
        createHousehold()
    }

    /// Deletes everything: the household's CloudKit records first, then this
    /// phone. App Store guideline 5.1.1(v) requires an in-app way to delete
    /// the data the app collected, and leaveHouseholdAndStartNew only ever
    /// cleared the phone, which orphaned every record in the public
    /// database permanently.
    ///
    /// The cloud delete runs first and throws on failure, leaving local data
    /// untouched. The other order would show the user an empty app while
    /// their data was still sitting in iCloud, which is a worse lie than an
    /// error message.
    ///
    /// These records belong to the household, not to one phone, so this
    /// removes them for the partner too. The Settings alert says that in
    /// plain words before it runs. leaveHouseholdAndStartNew stays the
    /// softer option, and the two are deliberately separate.
    func deleteEverything() async throws {
        try await store.deleteAllHouseholdData()

        objectWillChange.send()
        // A generation still in flight must not write the deleted household
        // back in behind the wipe, and a plan mid-build has nowhere to land.
        planTask?.cancel()
        planTask = nil
        refreshGeneration += 1
        phase = .idle
        statusMessage = nil
        clearLocalData()

        // Back to a first-launch phone. The cached* keys are already gone
        // from clearLocalData, so the next launch finds no code and no
        // cache and goes through onboarding.
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: HouseholdConfig.Keys.householdCode)
        defaults.removeObject(forKey: HouseholdConfig.Keys.aiNoticeAccepted)
        defaults.removeObject(forKey: HouseholdConfig.Keys.budgetTarget)
        defaults.removeObject(forKey: HouseholdConfig.Keys.dinnersPerWeek)
        aiNoticeAccepted = false
        selectedTab = .speak
        isOnboarded = false
    }

    /// Stores the code, wipes every in-memory collection and the offline
    /// cache (they belong to the old household), then subscribes and pulls
    /// whatever the new household already has in CloudKit.
    private func switchToHousehold(_ code: String) {
        objectWillChange.send()
        refreshGeneration += 1
        HouseholdConfig.code = code
        isOnboarded = true
        clearLocalData()
        Task {
            iCloudAvailable = await store.isSignedIn()
            await store.ensureSubscriptions()
            await refreshFromCloud()
        }
    }

    /// Resets everything this phone holds locally, memory and UserDefaults
    /// cache both, so no data leaks between households.
    private func clearLocalData() {
        plan = nil
        checkedItemIDs = []
        favorites = []
        recipeBox = []
        keptRecipes = []
        pantryStaples = []
        pastDinners = []
        ratings = [:]
        localEditDates = [:]
        // Failed saves from the old household must not be retried into the
        // new one, so pending retries are dropped with the data.
        dirtyKinds = []
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedPlan)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedChecked)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedFavorites)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedHistory)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedRatings)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedRecipeBox)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedKeptRecipes)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedPantry)
        defaults.removeObject(forKey: HouseholdConfig.Keys.cachedEditDates)
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
            parts.append("Recipes they saved as favorites. Do not copy these or rearrange them into new titles. Read them for the underlying principles the household responds to, then give them something new that satisfies the same instinct: \(titles).")
        }
        let topCuisines = favoriteCuisines
        if !topCuisines.isEmpty {
            parts.append("Cuisines they have already had a lot of, give them at most one of these this week: \(topCuisines.joined(separator: ", ")).")
        }
        let recent = pastDinners.suffix(40).map(\.title)
        if !recent.isEmpty {
            parts.append("Dinners from recent weeks. Do not repeat these, and do not repeat close variations of them. Same primary protein plus same cuisine counts as a repeat even when the title is different, and so does combining two of them into one dish: \(recent.joined(separator: ", ")).")
        }
        // Rating keys are stored lowercased; capitalize them back into
        // something that reads like a dish title.
        let loved = ratings.filter { $0.value >= 4 }.keys.sorted().prefix(12).map(Self.displayTitle)
        if !loved.isEmpty {
            parts.append("Meals they cooked and rated 4 or 5 stars. Read these for what worked, the technique, the flavor structure, the level of richness, then give them something new built on the same principles rather than these dishes again: \(loved.joined(separator: ", ")).")
        }
        let disliked = ratings.filter { $0.value <= 2 }.keys.sorted().prefix(12).map(Self.displayTitle)
        if !disliked.isEmpty {
            parts.append("Meals they cooked and rated 1 or 2 stars. Never suggest these again, or close variations of them: \(disliked.joined(separator: ", ")).")
        }
        // Pantry Memory rides along inside tasteNotes so both generatePlan
        // and swapNight carry it through runPlanGeneration into planWeek
        // without changing ClaudeService's signature.
        let pantry = pantryNotes
        if !pantry.isEmpty {
            parts.append(pantry)
        }
        return parts.joined(separator: " ")
    }

    /// One line telling Claude what the household already owns, so plans
    /// stop re-buying staples and the budget estimate gets honest. Empty
    /// when no staples are set, so tasteNotes stays clean.
    var pantryNotes: String {
        guard !pantryStaples.isEmpty else { return "" }
        return "Pantry staples this household always has, never add them to the grocery list and never count them in the budget: \(pantryStaples.joined(separator: ", "))."
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
        // Full week generation: pinned dinners ride along as the locked
        // set, and the grocery check-offs reset for the new shopping trip.
        runPlanGeneration(
            userText: transcript,
            lockedRecipes: keptRecipes,
            preserveChecks: false,
            dinners: dinnersPerWeek
        )
    }

    /// Swap One Night: replace a single dinner without touching the rest
    /// of the week or the grocery check-offs. Every other night rides
    /// along as a locked dinner, so only the chosen day changes.
    func swapNight(day: String, transcript: String) {
        guard phase != .planning else {
            // Same message generatePlan flashes when a tap lands mid-build.
            flashStatus("Hold on, still building your last plan.")
            return
        }
        guard let plan, let swappedRecipe = plan.recipe(forDay: day) else {
            flashStatus("There is no \(day) dinner to swap.")
            return
        }
        // Lock every night except the one being swapped. Pins that are
        // already in the week are among these locked nights; pins that are
        // NOT in the current week are deliberately left out. Adding them
        // would pad the locked set up to (or past) the week size, and the
        // planning request then says every day is locked and no new dinner
        // is needed, which contradicts the swap itself. Outside pins belong
        // to the next full generation, not a one night swap.
        let locked = plan.recipes.filter { $0.day != day }
        // Swapping away a pinned dinner also unpins it. Without this the
        // pin would sneak the replaced dinner back into the next full
        // generation even though the household just asked it to go.
        if isKept(swappedRecipe) {
            toggleKeep(swappedRecipe)
        }
        let said = transcript.trimmingCharacters(in: .whitespacesAndNewlines)
        let userText: String
        if said.isEmpty {
            userText = "Swap request: replace only the \(day) dinner with something different that fits this household's taste. Keep every other night exactly as the locked dinners specify."
        } else {
            userText = "Swap request: replace only the \(day) dinner. The household said: \(said). Keep every other night exactly as the locked dinners specify."
        }
        // A swap regenerates the week at its CURRENT size, not the settings
        // value, so changing dinners per week mid-week cannot silently
        // resize the plan (the setting applies to the next spoken week).
        runPlanGeneration(
            userText: userText,
            lockedRecipes: locked,
            preserveChecks: true,
            dinners: plan.week.count
        )
    }

    /// The one generation pipeline. generatePlan and swapNight both come
    /// through here so a swap gets everything a full generation gets: the
    /// deadline watchdog, cancel, ingredient reconciliation, the Recipe
    /// Box archive, same-day history dedupe, and the CloudKit push.
    ///
    /// preserveChecks switches the grocery check-off behavior, and both
    /// behaviors exist on purpose. A brand new week is a fresh shopping
    /// trip, so check-offs reset to the new plan's pantry staples
    /// (carrying old ones over would pre-check groceries that have been
    /// eaten and must be bought again). A swap happens mid-week against a
    /// list that is mostly unchanged, so check-offs still present on the
    /// new list carry over, unioned with the new plan's pantry staples.
    private func runPlanGeneration(userText: String, lockedRecipes: [Recipe], preserveChecks: Bool, dinners: Int) {
        guard phase != .planning else {
            // Never swallow the tap silently. Tell the user why nothing
            // new started.
            flashStatus("Hold on, still building your last plan.")
            return
        }
        // Fast path for the known-unsubscribed case, checked before the
        // phase moves, so the planning banner never flashes on its way to a
        // paywall. The authoritative check is the await inside the task; this
        // one only spares the UI a flicker it would otherwise show every
        // single time a non-subscriber taps the mic.
        if subscriptions.status == .notSubscribed {
            presentPaywall(resuming: userText, lockedRecipes: lockedRecipes, preserveChecks: preserveChecks, dinners: dinners)
            return
        }
        phase = .planning
        let budget = budgetTarget
        let notes = tasteNotes
        let locked = lockedRecipes
        let staples = pantryStaples
        planTask = Task {
            do {
                // The relay bills this month's allowance against the
                // subscription, so nothing goes out without one. Re-read
                // rather than trusting the cached status: a subscription
                // that lapsed or was cancelled since launch has to be caught
                // here, not by a refusal from the server.
                guard let subscriptionID = await self.subscriptions.activeTransactionID() else {
                    self.phase = .idle
                    self.presentPaywall(resuming: userText, lockedRecipes: locked, preserveChecks: preserveChecks, dinners: dinners)
                    return
                }
                let rawPlan = try await Self.withPlanningDeadline {
                    try await ClaudeService.planWeek(
                        transcript: userText,
                        budget: budget,
                        dinners: dinners,
                        subscriptionID: subscriptionID,
                        tasteNotes: notes,
                        lockedRecipes: locked
                    )
                }
                // Safety net: guarantee every recipe ingredient is on the
                // grocery list before anything downstream uses the plan
                // (recipe box archive, checked-item IDs, CloudKit save).
                // Pantry Memory staples are deliberately off the list, so
                // they are passed in and skipped instead of re-added.
                let newPlan = rawPlan.reconciledWithRecipes(pantryStaples: staples)
                // Archive before replacing so nothing is ever lost. The old
                // plan covers weeks generated before the Recipe Box existed;
                // the new plan is archived right away so it survives the
                // next replacement too.
                let replacedTitles = Set(self.plan?.week.map(\.title) ?? [])
                if let oldPlan = self.plan {
                    self.archiveIntoRecipeBox(oldPlan.recipes)
                }
                self.archiveIntoRecipeBox(newPlan.recipes)
                self.plan = newPlan
                if preserveChecks {
                    // Swap: the shopping week is already in motion, so
                    // check-offs for items still on the new list carry
                    // over, plus the new plan's pantry staples.
                    self.checkedItemIDs = self.checkedItemIDs
                        .intersection(newPlan.allItemIDs)
                        .union(newPlan.pantryItemIDs)
                } else {
                    // A new week means a fresh shopping trip: only the new
                    // plan's pantry staples start checked. Carrying over old
                    // check-offs would pre-check groceries that have been
                    // eaten and must be bought again.
                    self.checkedItemIDs = newPlan.pantryItemIDs
                }
                // A swap logs only the genuinely new dinner(s); re-logging
                // the unchanged nights would bloat the taste history and
                // the do-not-repeat notes on every mid-week swap.
                self.recordHistory(
                    from: newPlan,
                    replacingTitles: replacedTitles,
                    onlyNewDinners: preserveChecks
                )
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
                self.backgroundSave("plan") { try await self.store.savePlan(newPlan) }
                self.backgroundSave("checked") { try await self.store.saveChecked(checked) }
                self.backgroundSave("history") { try await self.store.saveHistory(history) }
                self.backgroundSave("recipeBox") { try await self.store.saveRecipeBox(box, kept: kept) }
            } catch is CancellationError {
                // cancelPlanning already reset the phase. Nothing to show.
            } catch ClaudeService.ClaudeError.subscriptionRefused {
                guard !Task.isCancelled else { return }
                // The relay would not accept the subscription this request
                // carried. Ask StoreKit who is right before saying anything:
                // if the entitlement really is gone (cancelled, lapsed,
                // refunded, or bought on another Apple Account), the honest
                // answer is the paywall. If StoreKit still says subscribed,
                // this is the relay's problem, not the customer's, and
                // telling a paying subscriber to buy again would be the
                // worst possible response.
                if await self.subscriptions.activeTransactionID() == nil {
                    self.phase = .idle
                    self.presentPaywall(resuming: userText, lockedRecipes: locked, preserveChecks: preserveChecks, dinners: dinners)
                } else {
                    self.phase = .error("MealTime could not confirm your subscription with the planning service. Check your connection and try again. If it keeps happening, tap Restore Purchases in Settings.")
                }
            } catch {
                // A cancel can also surface as URLError.cancelled from the
                // network layer. Either way the user asked for it, so stay
                // quiet instead of raising an error alert.
                guard !Task.isCancelled else { return }
                self.phase = .error(error.localizedDescription)
            }
        }
    }

    // MARK: - Subscription gate

    /// Remembers the generation the paywall is interrupting, then raises the
    /// flag RootView watches. Every planning entry point comes through
    /// runPlanGeneration, so this is the only place the paywall is triggered
    /// and no future feature can accidentally skip it.
    private func presentPaywall(resuming userText: String, lockedRecipes: [Recipe], preserveChecks: Bool, dinners: Int) {
        pendingGeneration = { [weak self] in
            self?.runPlanGeneration(
                userText: userText,
                lockedRecipes: lockedRecipes,
                preserveChecks: preserveChecks,
                dinners: dinners
            )
        }
        showPaywall = true
    }

    /// Runs the interrupted generation after a successful purchase, so
    /// speaking a week, paying, and getting that week is one continuous
    /// motion instead of two trips to the mic.
    func resumePendingGeneration() {
        let work = pendingGeneration
        pendingGeneration = nil
        work?()
    }

    /// Drops the interrupted generation when the paywall closes without a
    /// purchase. Never silent: the same rule the AI notice follows, because
    /// a tap that quietly does nothing reads as a broken app.
    func discardPendingGeneration() {
        guard pendingGeneration != nil else { return }
        pendingGeneration = nil
        flashStatus("Your week was not planned. Tap the button when you are ready.")
    }

    /// Stops the in-flight generation and returns the app to idle. Safe to
    /// call at any time; does nothing when no plan is being built.
    func cancelPlanning() {
        planTask?.cancel()
        planTask = nil
        if phase == .planning { phase = .idle }
    }

    /// Foreground safety net, called when the scene becomes active. If the
    /// phase is stuck in .planning with no live task behind it (the app was
    /// killed mid-generation, or the task was cancelled without the phase
    /// resetting), fall back to idle so the Speak button works again.
    func recoverIfStuck() {
        guard phase == .planning else { return }
        if planTask == nil || planTask!.isCancelled {
            phase = .idle
        }
    }

    /// Shows a short status line, then clears it after a few seconds. A new
    /// flash replaces the old one and restarts the clock.
    func flashStatus(_ message: String) {
        statusMessage = message
        statusClearTask?.cancel()
        statusClearTask = Task {
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            guard !Task.isCancelled else { return }
            self.statusMessage = nil
        }
    }

    /// Hard ceiling on one generation, retries included. Races the planning
    /// call against a 240 second deadline so the phase always reaches .idle
    /// or .error within about 4 minutes, even if the network layer hangs.
    private static func withPlanningDeadline<T: Sendable>(
        _ work: @escaping @Sendable () async throws -> T
    ) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask { try await work() }
            group.addTask {
                try await Task.sleep(nanoseconds: 240_000_000_000)
                throw PlanningTimeoutError()
            }
            // First child to finish wins; the loser is cancelled.
            guard let winner = try await group.next() else {
                throw PlanningTimeoutError()
            }
            group.cancelAll()
            return winner
        }
    }

    /// Thrown when a generation blows past the deadline.
    private struct PlanningTimeoutError: LocalizedError {
        var errorDescription: String? {
            "That took too long. Check your connection and try again."
        }
    }

    /// Plans a week with no spoken input at all: Claude picks based on what
    /// the app has learned about the household so far.
    func surpriseMe() {
        generatePlan(from: "No specific cravings this time. Build a week you are confident this household will love based on the taste notes, and include one new dish worth trying that fits their pattern.")
    }

    /// Appends the new plan's dinners to the rolling history. A same-day
    /// regeneration replaces the plan it logged earlier today, so those
    /// entries are removed first (same calendar day AND a title from the
    /// replaced plan). Otherwise three retries on a Sunday would log three
    /// weeks of phantom dinners that block future suggestions.
    private func recordHistory(from newPlan: MealPlan, replacingTitles oldTitles: Set<String>, onlyNewDinners: Bool = false) {
        let now = Date()
        let calendar = Calendar.current
        let replaced = Set(oldTitles.map { $0.lowercased() })
        let newTitles = Set(newPlan.week.map { $0.title.lowercased() })
        // Same-day dedupe. A full regeneration scrubs today's entries for
        // every replaced title. A swap scrubs only the title that actually
        // left the week; the unchanged nights' entries must survive.
        let removalTargets = onlyNewDinners ? replaced.subtracting(newTitles) : replaced
        if !removalTargets.isEmpty {
            pastDinners.removeAll {
                calendar.isDate($0.date, inSameDayAs: now)
                    && removalTargets.contains($0.title.lowercased())
            }
        }
        // onlyNewDinners (swaps): unchanged nights were already logged when
        // the week was generated, so only titles absent from the replaced
        // plan get appended.
        let entries = onlyNewDinners
            ? newPlan.week.filter { !replaced.contains($0.title.lowercased()) }
            : newPlan.week
        let dinners = entries.map {
            PastDinner(title: $0.title, cuisine: $0.cuisine, date: now)
        }
        pastDinners.append(contentsOf: dinners)
        if pastDinners.count > Self.historyLimit {
            pastDinners.removeFirst(pastDinners.count - Self.historyLimit)
        }
    }

    /// Clear This Week: drops the plan and the grocery check-offs on this
    /// phone, writes a tombstone to CloudKit so the other phone clears too,
    /// and leaves the Recipe Box, pins, and history alone. Recipes are
    /// never lost by clearing a week.
    func clearWeek() {
        plan = nil
        checkedItemIDs = []
        markEdited("plan")
        markEdited("checked")
        // saveLocalCache leaves the cached plan untouched when plan is nil,
        // so the stale copy is removed here explicitly. Without this a
        // relaunch would resurrect the cleared week from the cache.
        UserDefaults.standard.removeObject(forKey: HouseholdConfig.Keys.cachedPlan)
        backgroundSave("plan") { try await self.store.saveClearedPlan() }
        backgroundSave("checked") { try await self.store.saveChecked([]) }
    }

    func clearError() {
        if case .error = phase { phase = .idle }
    }

    /// Records that the user saw and accepted the one-time AI notice.
    func acceptAINotice() {
        aiNoticeAccepted = true
        UserDefaults.standard.set(true, forKey: HouseholdConfig.Keys.aiNoticeAccepted)
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
        backgroundSave("checked") { try await self.store.saveChecked(snapshot) }
    }

    // MARK: - Ratings

    /// Weekday number (1 is Sunday through 7 is Saturday, the same scheme
    /// Calendar.component(.weekday) uses) for a plan day name like
    /// "Monday". Nil when the string is not an English day name, so an
    /// unexpected plan value can never match a real weekday.
    nonisolated static func weekdayNumber(forDayName name: String) -> Int? {
        let names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        let trimmed = name.trimmingCharacters(in: .whitespaces).lowercased()
        guard let index = names.firstIndex(of: trimmed) else { return nil }
        return index + 1
    }

    /// The plan recipe whose night already passed (yesterday back through
    /// three days ago, nearest night first) and that has no rating yet.
    /// Drives the slim rating nudge on the Week tab. Nil when there is no
    /// plan or every recent dinner is rated.
    var unratedRecent: Recipe? {
        guard let plan else { return nil }
        let calendar = Calendar.current
        let now = Date()
        for daysBack in 1...3 {
            guard let past = calendar.date(byAdding: .day, value: -daysBack, to: now) else { continue }
            let weekday = calendar.component(.weekday, from: past)
            for recipe in plan.recipes where Self.weekdayNumber(forDayName: recipe.day) == weekday {
                if rating(for: recipe) == 0 { return recipe }
            }
        }
        return nil
    }

    /// Ratings are keyed by lowercased title so lookups match no matter how
    /// a title is cased in a plan, the box, or an old record.
    func rating(for recipe: Recipe) -> Int {
        ratings[recipe.title.lowercased()] ?? 0
    }

    func rating(forTitle title: String) -> Int? {
        ratings[title.lowercased()]
    }

    /// Rate a cooked meal 1 through 5. Tapping the current star again clears
    /// the rating. Low ratings (1 or 2) are excluded from future suggestions.
    func rate(_ recipe: Recipe, stars: Int) {
        let key = recipe.title.lowercased()
        if ratings[key] == stars {
            ratings.removeValue(forKey: key)
        } else {
            ratings[key] = stars
        }
        markEdited("ratings")
        let snapshot = ratings
        backgroundSave("ratings") { try await self.store.saveRatings(snapshot) }
    }

    /// Lowercases every ratings key so lookups are case-insensitive.
    /// Older mixed-case keys that collide merge deterministically (sorted
    /// key order, first wins) so both phones normalize identically.
    private static func normalizedRatings(_ raw: [String: Int]) -> [String: Int] {
        var normalized: [String: Int] = [:]
        for (key, value) in raw.sorted(by: { $0.key < $1.key }) {
            let lowered = key.lowercased()
            if normalized[lowered] == nil {
                normalized[lowered] = value
            }
        }
        return normalized
    }

    /// Ratings keys are stored lowercased; capitalizing the first letter
    /// makes them readable again in the taste notes.
    private static func displayTitle(_ key: String) -> String {
        guard let first = key.first else { return key }
        return first.uppercased() + key.dropFirst()
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
        backgroundSave("favorites") { try await self.store.saveFavorites(snapshot) }
    }

    // MARK: - Recipe editing

    /// Applies a hand-edited recipe everywhere a copy lives: the current
    /// plan (with the week card and grocery list brought back in sync),
    /// the Recipe Box archive, the kept pins, and favorites. The title
    /// and day never change through this path, so ratings, pins,
    /// favorites, and history keep matching by title. Grocery check-offs
    /// survive the edit; ingredients the edit adds land on the list
    /// unchecked through the same reconciliation safety net a generation
    /// uses. Items the edit no longer needs stay on the list untouched
    /// rather than vanishing mid-shopping-trip.
    func updateRecipe(_ edited: Recipe) {
        if var updatedPlan = plan,
           let index = updatedPlan.recipes.firstIndex(where: {
               $0.title.caseInsensitiveCompare(edited.title) == .orderedSame
           }) {
            updatedPlan.recipes[index] = edited
            // Keep the Week tab card's numbers in step with the recipe.
            if let weekIndex = updatedPlan.week.firstIndex(where: { $0.day == edited.day }) {
                updatedPlan.week[weekIndex].cookTimeMin = edited.cookTimeMin
                updatedPlan.week[weekIndex].servings = edited.servings
            }
            let reconciled = updatedPlan.reconciledWithRecipes(pantryStaples: pantryStaples)
            plan = reconciled
            // Check-offs carry over for every item still on the list;
            // brand-new items start unchecked.
            checkedItemIDs = checkedItemIDs.intersection(reconciled.allItemIDs)
            markEdited("plan")
            markEdited("checked")
            let planSnapshot = reconciled
            let checkedSnapshot = checkedItemIDs
            backgroundSave("plan") { try await self.store.savePlan(planSnapshot) }
            backgroundSave("checked") { try await self.store.saveChecked(checkedSnapshot) }
        }

        // The archive always gets the newest version, and an edited pin
        // rides into the next generation exactly as edited.
        archiveIntoRecipeBox([edited])
        if let keptIndex = keptRecipes.firstIndex(where: {
            $0.title.caseInsensitiveCompare(edited.title) == .orderedSame
        }) {
            keptRecipes[keptIndex] = edited
        }
        markEdited("recipeBox")
        let box = recipeBox
        let kept = keptRecipes
        backgroundSave("recipeBox") { try await self.store.saveRecipeBox(box, kept: kept) }

        if let favIndex = favorites.firstIndex(where: {
            $0.title.caseInsensitiveCompare(edited.title) == .orderedSame
        }) {
            favorites[favIndex] = edited
            markEdited("favorites")
            let favs = favorites
            backgroundSave("favorites") { try await self.store.saveFavorites(favs) }
        }
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
        backgroundSave("recipeBox") { try await self.store.saveRecipeBox(box, kept: kept) }
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
        backgroundSave("recipeBox") { try await self.store.saveRecipeBox(box, kept: kept) }
        backgroundSave("favorites") { try await self.store.saveFavorites(favs) }
    }

    // MARK: - Pantry staples

    /// Adds a staple to Pantry Memory. Whitespace is trimmed, an empty
    /// result is ignored, and a title already on the list (compared case
    /// insensitively) is not added twice.
    func addStaple(_ raw: String) {
        let staple = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !staple.isEmpty else { return }
        guard !pantryStaples.contains(where: {
            $0.caseInsensitiveCompare(staple) == .orderedSame
        }) else { return }
        pantryStaples.append(staple)
        persistPantry()
    }

    /// Removes one staple by its display text (matched case insensitively).
    func removeStaple(_ staple: String) {
        guard let index = pantryStaples.firstIndex(where: {
            $0.caseInsensitiveCompare(staple) == .orderedSame
        }) else { return }
        pantryStaples.remove(at: index)
        persistPantry()
    }

    /// Swipe-to-delete support for the Settings list.
    func removeStaples(atOffsets offsets: IndexSet) {
        pantryStaples.remove(atOffsets: offsets)
        persistPantry()
    }

    /// Shared persistence tail for every pantry mutation: stamp the local
    /// edit (which also saves the offline cache), then push to CloudKit.
    private func persistPantry() {
        markEdited("pantry")
        let snapshot = pantryStaples
        backgroundSave("pantry") { try await self.store.saveStaples(snapshot) }
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

    /// Runs a fire-and-forget CloudKit save. On failure the kind is marked
    /// dirty so retryDirtySaves can push the then-current state for it the
    /// next time the app comes to the foreground.
    private func backgroundSave(_ kind: String, _ op: @escaping () async throws -> Void) {
        Task {
            do {
                try await op()
            } catch {
                self.dirtyKinds.insert(kind)
            }
        }
    }

    /// Re-runs the CloudKit save for every collection whose last background
    /// save failed, using a fresh snapshot of the current state. Called from
    /// the scenePhase .active path so an offline check-off or rating still
    /// reaches the other phone once the network is back.
    func retryDirtySaves() {
        guard !dirtyKinds.isEmpty else { return }
        let kinds = dirtyKinds
        dirtyKinds = []
        for kind in kinds {
            switch kind {
            case "plan":
                if let plan {
                    backgroundSave("plan") { try await self.store.savePlan(plan) }
                } else {
                    backgroundSave("plan") { try await self.store.saveClearedPlan() }
                }
            case "checked":
                let snapshot = checkedItemIDs
                backgroundSave("checked") { try await self.store.saveChecked(snapshot) }
            case "favorites":
                let snapshot = favorites
                backgroundSave("favorites") { try await self.store.saveFavorites(snapshot) }
            case "history":
                let snapshot = pastDinners
                backgroundSave("history") { try await self.store.saveHistory(snapshot) }
            case "ratings":
                let snapshot = ratings
                backgroundSave("ratings") { try await self.store.saveRatings(snapshot) }
            case "recipeBox":
                let box = recipeBox
                let kept = keptRecipes
                backgroundSave("recipeBox") { try await self.store.saveRecipeBox(box, kept: kept) }
            case "pantry":
                let snapshot = pantryStaples
                backgroundSave("pantry") { try await self.store.saveStaples(snapshot) }
            default:
                break
            }
        }
    }

    /// Pulls each record from CloudKit and applies it only when the cloud
    /// copy is newer than the last local edit (newest wins). Skipped
    /// entirely mid-generation so a stale fetch cannot revert a brand-new
    /// plan, and never runs twice at once.
    func refreshFromCloud() async {
        guard isOnboarded else { return }
        guard phase != .planning else { return }
        guard !isRefreshing else { return }
        isRefreshing = true
        defer { isRefreshing = false }

        // Snapshot the household this refresh belongs to. Every apply block
        // re-checks it, so a refresh that was in flight when the user
        // switched households bails instead of writing stale data into the
        // new household.
        let generation = refreshGeneration
        let code = householdCode
        func stillCurrent() -> Bool {
            generation == refreshGeneration && code == householdCode
        }

        iCloudAvailable = await store.isSignedIn()
        guard iCloudAvailable else { return }

        if let remote = await store.fetchPlan(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "plan") {
            if let remotePlan = remote.plan {
                if remotePlan != plan {
                    plan = remotePlan
                }
            } else {
                // Tombstone: the other phone cleared the week. Clear the
                // plan and the check-offs here too so both phones agree,
                // and drop the cached plan so a relaunch stays empty.
                plan = nil
                checkedItemIDs = []
                UserDefaults.standard.removeObject(forKey: HouseholdConfig.Keys.cachedPlan)
                localEditDates["checked"] = remote.updatedAt
            }
            localEditDates["plan"] = remote.updatedAt
        }
        if let remote = await store.fetchChecked(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "checked") {
            if remote.checked != checkedItemIDs {
                checkedItemIDs = remote.checked
            }
            localEditDates["checked"] = remote.updatedAt
        }
        if let remote = await store.fetchFavorites(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "favorites") {
            if remote.recipes != favorites {
                favorites = remote.recipes
            }
            localEditDates["favorites"] = remote.updatedAt
        }
        if let remote = await store.fetchHistory(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "history") {
            if remote.dinners != pastDinners {
                pastDinners = remote.dinners
            }
            localEditDates["history"] = remote.updatedAt
        }
        if let remote = await store.fetchRatings(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "ratings") {
            let normalized = Self.normalizedRatings(remote.ratings)
            if normalized != ratings {
                ratings = normalized
            }
            localEditDates["ratings"] = remote.updatedAt
        }
        if let remote = await store.fetchRecipeBox(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "recipeBox") {
            if remote.recipes != recipeBox {
                recipeBox = remote.recipes
            }
            if remote.kept != keptRecipes {
                keptRecipes = remote.kept
            }
            localEditDates["recipeBox"] = remote.updatedAt
        }
        if let remote = await store.fetchStaples(), stillCurrent(),
           remote.updatedAt > localEditDate(for: "pantry") {
            if remote.staples != pantryStaples {
                pantryStaples = remote.staples
            }
            localEditDates["pantry"] = remote.updatedAt
        }
        guard stillCurrent() else { return }
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
            // Migrates mixed-case keys from older builds to the lowercased
            // keying the accessors use now.
            ratings = Self.normalizedRatings(cached)
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
        if let json = defaults.string(forKey: HouseholdConfig.Keys.cachedPantry),
           let data = json.data(using: .utf8),
           let cached = try? JSONDecoder().decode([String].self, from: data) {
            pantryStaples = cached
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
        if let data = try? JSONEncoder().encode(pantryStaples),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: HouseholdConfig.Keys.cachedPantry)
        }
        let stamps = localEditDates.mapValues { $0.timeIntervalSince1970 }
        defaults.set(stamps, forKey: HouseholdConfig.Keys.cachedEditDates)
    }
}
