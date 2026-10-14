import Foundation
import os

/// Keeps the recipe shelf stocked. Called when the app comes to the
/// foreground and from the background processing task. It never throws and never
/// shows the household anything: a shelf that could not be topped up is
/// simply a shelf the picker tops up from the fallback call later.
///
/// All the decisions live here (when to run, how many to ask for, whether a
/// returned recipe is good enough to keep). ClaudeService only talks to the
/// relay.
@MainActor
enum ShelfFiller {

    static let logger = Logger(subsystem: "com.echochambermedia.echomeal", category: "shelf")

    /// The shelf is kept at about this many recipes that are fit to cook.
    static let targetShelfSize = 20
    /// Most recipes asked for in one call.
    static let batchMax = 5
    /// Fewest recipes worth a call (the contract's floor).
    static let batchMin = 3
    /// A recipe served this recently is not counted as ready stock.
    static let servedWindowDays = 14
    /// A top-up older than this makes the shelf stale even when it is full.
    static let staleAfter: TimeInterval = 48 * 3600
    /// Never more than one top-up inside this window.
    static let minimumGap: TimeInterval = 6 * 3600
    /// Cold start. While ready stock is under this many recipes the gap is
    /// the short one below, so a fresh household fills the shelf across the
    /// first day of opens instead of one batch every 6 hours.
    static let coldStartReadyFloor = 8
    static let coldStartGap: TimeInterval = 20 * 60
    /// Every Nth top-up runs a web discovery search first.
    static let discoveryEvery = 3

    /// Count of top-ups attempted on this phone, in UserDefaults. Drives the
    /// every-third-run discovery search. Per phone on purpose: it only
    /// spaces out that phone's own searches.
    static let runCountKey = "shelfTopUpRunCount"

    /// Only one top-up at a time. The foreground trigger and the background
    /// task can land together.
    private static var running = false

    // MARK: - Entry point

    static func topUpIfNeeded(state: AppState, reason: String) async {
        guard !running else {
            logger.info("Top-up skipped (\(reason, privacy: .public)): one is already running.")
            return
        }
        running = true
        defer { running = false }

        guard state.isOnboarded else { return }
        let now = Date()
        let defaults = UserDefaults.standard

        // Ready stock is anything not served, or served long enough ago to
        // come around again.
        let cutoff = now.addingTimeInterval(-Double(servedWindowDays) * 86_400)
        let ready = state.shelf.filter { recipe in
            guard let served = recipe.servedAt else { return true }
            return served < cutoff
        }.count

        // Spacing. The newest of this phone's last attempt and the household's
        // last successful top-up (either phone) starts the clock: 6 hours
        // normally, 20 minutes while the shelf is nearly empty.
        let phoneLast = (defaults.object(forKey: HouseholdConfig.Keys.lastShelfTopUpAt) as? Double)
            .map { Date(timeIntervalSince1970: $0) }
        let householdLast = state.shelfLastTopUpAt
        let gap = ready < coldStartReadyFloor ? coldStartGap : minimumGap
        if let last = [phoneLast, householdLast].compactMap({ $0 }).max(),
           now.timeIntervalSince(last) < gap {
            return
        }

        // Need.
        let stale = householdLast.map { now.timeIntervalSince($0) > staleAfter } ?? true
        guard ready < targetShelfSize || stale else { return }

        // A stale but full shelf still gets the smallest batch, so the stock
        // keeps turning over. Never past the shelf cap, never under the
        // contract's three-recipe floor.
        let slots = ShelfVocab.shelfCap - state.shelf.count
        guard slots >= batchMin else { return }
        let wanted = max(batchMin, min(batchMax, targetShelfSize - ready))
        let count = min(wanted, slots)

        // The relay refuses a request without a subscription id, so there is
        // nothing to try without one. Checked last because it re-reads
        // StoreKit entitlements.
        guard let subscriptionID = await state.subscriptions.activeTransactionID(), !subscriptionID.isEmpty else {
            logger.info("Top-up skipped (\(reason, privacy: .public)): no subscription id.")
            return
        }
        guard !Task.isCancelled else { return }

        // From here a call goes out, so the attempt counts against the
        // spacing whether it works or not. A failing relay is not hammered.
        defaults.set(now.timeIntervalSince1970, forKey: HouseholdConfig.Keys.lastShelfTopUpAt)
        let runIndex = defaults.integer(forKey: runCountKey)
        defaults.set(runIndex + 1, forKey: runCountKey)
        let discoveryDue = (runIndex + 1) % discoveryEvery == 0

        let signals = state.shelfSignals
        let prefs = state.preferences
        logger.info("Top-up starting (\(reason, privacy: .public)): \(ready, privacy: .public) ready, \(state.shelf.count, privacy: .public) on the shelf, asking for \(count, privacy: .public), discovery \(discoveryDue, privacy: .public).")

        var hints: [String] = []
        if discoveryDue {
            hints = await ClaudeService.discoverDishes(signals: signals, subscriptionID: subscriptionID)
            guard !Task.isCancelled else { return }
        }

        var known = Set(signals.doNotRepeat.map(normalizedTitle))
        for recipe in state.shelf { known.insert(normalizedTitle(recipe.recipe.title)) }

        var accepted: [ShelfRecipe] = []
        var retryNotes: [String] = []
        for attempt in 0..<2 {
            let raw: [ShelfTopUpRecipe]
            do {
                raw = try await ClaudeService.topUp(
                    signals: signals, count: count, subscriptionID: subscriptionID,
                    trendingHints: hints, retryNotes: retryNotes
                )
            } catch {
                logger.error("Top-up call failed: \(String(describing: error), privacy: .public)")
                break
            }
            guard !Task.isCancelled else { return }

            var reasons: [String] = []
            for item in raw {
                switch validate(item, prefs: prefs, perDinnerBudget: signals.perDinnerBudget, knownTitles: known, now: now) {
                case .success(let recipe):
                    if let reason = varietyRejection(recipe, batch: accepted, shelf: state.shelf, trendingHints: hints) {
                        logger.info("Top-up recipe rejected: \(reason, privacy: .private)")
                        reasons.append("\"\(item.title)\": \(reason).")
                        continue
                    }
                    // A discovery dish that shares a cuisine with an earlier
                    // ordinary one takes its place (see displacedIndex).
                    if let gone = displacedIndex(recipe, batch: accepted, trendingHints: hints) {
                        let removed = accepted.remove(at: gone)
                        known.remove(normalizedTitle(removed.recipe.title))
                        logger.info("Top-up recipe displaced by a discovery dish of the same cuisine: \(removed.recipe.title, privacy: .private)")
                    }
                    known.insert(normalizedTitle(recipe.recipe.title))
                    accepted.append(recipe)
                case .failure(let rejection):
                    // Private: the reason can carry the household's off terms.
                    logger.info("Top-up recipe rejected: \(rejection.reason, privacy: .private)")
                    reasons.append("\"\(item.title)\": \(rejection.reason).")
                }
            }
            // One retry, and only when recipes came back and every one was
            // thrown out. An empty reply (a silent 402) has nothing to learn
            // from, so it does not spend a second call.
            if !accepted.isEmpty || raw.isEmpty || attempt == 1 { break }
            retryNotes = Array(reasons.prefix(8))
        }

        guard !accepted.isEmpty else {
            logger.info("Top-up finished with nothing to add.")
            return
        }
        let room = max(0, ShelfVocab.shelfCap - state.shelf.count)
        let toAdd = Array(accepted.prefix(room))
        guard !toAdd.isEmpty else { return }
        state.addToShelf(toAdd)
        state.setShelfLastTopUp(Date())
        logger.info("Top-up added \(toAdd.count, privacy: .public) recipes.")
    }

    // MARK: - Variety

    /// The most recipes of one cuisine, or of one protein and cuisine pair,
    /// the shelf may already hold before another is accepted. Keeps the shelf
    /// varied enough that pickWeek can build a week with no repeated cuisine.
    static let shelfVarietyLimit = 2

    /// True for a dish the model marked as the discovery slice, or one whose
    /// title matches a trending hint (either contains the other).
    static func isDiscovery(_ recipe: ShelfRecipe, trendingHints: [String]) -> Bool {
        if recipe.source == "discovery" { return true }
        let title = normalizedTitle(recipe.recipe.title)
        return trendingHints.map(normalizedTitle).contains { !$0.isEmpty && (title.contains($0) || $0.contains(title)) }
    }

    /// When `recipe` is a discovery dish and an earlier recipe in the batch
    /// shares its cuisine and is not one, the index of that earlier recipe:
    /// the viral dish survives and the ordinary one goes. Nil otherwise, so
    /// with neither or both being discovery the earlier recipe is kept.
    static func displacedIndex(_ recipe: ShelfRecipe, batch: [ShelfRecipe], trendingHints: [String]) -> Int? {
        guard isDiscovery(recipe, trendingHints: trendingHints) else { return nil }
        let cuisine = recipe.cuisine.lowercased()
        guard let index = batch.firstIndex(where: { $0.cuisine.lowercased() == cuisine }),
              !isDiscovery(batch[index], trendingHints: trendingHints) else { return nil }
        return index
    }

    /// Why a validated recipe should be dropped for variety, or nil to keep
    /// it. A recipe goes when its cuisine already appeared earlier in the same
    /// batch (unless it is a discovery dish displacing an ordinary one, see
    /// displacedIndex), or when its cuisine, or its protein and cuisine
    /// together, is already on the shelf more than `shelfVarietyLimit` times.
    /// `batch` is what this call has accepted so far; it counts toward the
    /// shelf total, minus any recipe the new one displaces.
    static func varietyRejection(_ recipe: ShelfRecipe, batch: [ShelfRecipe], shelf: [ShelfRecipe],
                                 trendingHints: [String] = []) -> String? {
        let cuisine = recipe.cuisine.lowercased()
        let protein = recipe.primaryProtein.lowercased()
        var batch = batch
        if let gone = displacedIndex(recipe, batch: batch, trendingHints: trendingHints) {
            batch.remove(at: gone)
        }
        if batch.contains(where: { $0.cuisine.lowercased() == cuisine }) {
            return "another recipe in this batch is already \(recipe.cuisine)"
        }
        let held = shelf + batch
        if held.filter({ $0.cuisine.lowercased() == cuisine }).count > shelfVarietyLimit {
            return "the shelf already has plenty of \(recipe.cuisine)"
        }
        if held.filter({ $0.cuisine.lowercased() == cuisine && $0.primaryProtein.lowercased() == protein }).count > shelfVarietyLimit {
            return "the shelf already has plenty of \(protein) \(recipe.cuisine) dinners"
        }
        return nil
    }

    // MARK: - Validation

    struct Rejection: Error {
        let reason: String
    }

    /// Lowercased, trimmed, inner whitespace collapsed. The key for every
    /// title comparison here.
    static func normalizedTitle(_ title: String) -> String {
        title.lowercased().split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
    }

    /// Checks one model-written recipe against CONTRACT section 5 and, if it
    /// passes, builds the shelf entry. Nothing the model said is trusted:
    /// cost is recomputed, servings are forced to 2, the cuisine and section
    /// are rewritten to the app's spelling. `source` is derived from the
    /// recipe's slice; fallback callers can overwrite it afterwards.
    /// `knownTitles` holds lowercased titles already on the shelf, in the
    /// box, kept, or in history; the recipe is also checked against itself
    /// not repeating inside the batch because the caller grows the set.
    static func validate(_ raw: ShelfTopUpRecipe, prefs: Preferences, perDinnerBudget: Double,
                         knownTitles: Set<String>, now: Date, source: String? = nil) -> Result<ShelfRecipe, Rejection> {
        func reject(_ reason: String) -> Result<ShelfRecipe, Rejection> { .failure(Rejection(reason: reason)) }
        func clean(_ text: String) -> String { text.trimmingCharacters(in: .whitespacesAndNewlines) }

        // 1. Required fields present and not blank.
        let title = clean(raw.title)
        if title.isEmpty { return reject("blank title") }
        if raw.cookTimeMin <= 0 { return reject("no cook time") }
        let keys = raw.ingredientKeys.map { clean($0).lowercased() }.filter { !$0.isEmpty }
        if keys.isEmpty { return reject("no ingredient keys") }
        if raw.groceryItems.isEmpty { return reject("no grocery lines") }
        for line in raw.groceryItems {
            if clean(line.name).isEmpty || clean(line.qty).isEmpty || clean(line.section).isEmpty {
                return reject("a grocery line is missing a name, quantity, or section")
            }
            if !line.estPrice.isFinite || line.estPrice < 0 { return reject("a grocery line has a bad price") }
        }
        for ingredient in raw.ingredients where clean(ingredient.item).isEmpty || clean(ingredient.qty).isEmpty {
            return reject("an ingredient is missing a name or quantity")
        }
        let steps = raw.steps.map(clean).filter { !$0.isEmpty }

        // 2. Vocabulary.
        guard let cuisine = ShelfVocab.canonicalCuisine(raw.cuisine) else { return reject("cuisine \"\(raw.cuisine)\" is not in the list") }
        let protein = clean(raw.primaryProtein).lowercased()
        if !ShelfVocab.proteins.contains(protein) { return reject("protein \"\(raw.primaryProtein)\" is not in the list") }
        let method = clean(raw.method).lowercased()
        if !ShelfVocab.methods.contains(method) { return reject("method \"\(raw.method)\" is not in the list") }
        var lines: [ShelfGroceryItem] = []
        for line in raw.groceryItems {
            guard let section = ShelfVocab.sections.first(where: { $0.caseInsensitiveCompare(clean(line.section)) == .orderedSame }) else {
                return reject("grocery section \"\(line.section)\" is not in the list")
            }
            lines.append(ShelfGroceryItem(section: section, name: clean(line.name), qty: clean(line.qty),
                                          estPrice: line.estPrice, pantry: line.pantry))
        }

        // 3. The household's off lists.
        let offProteins = prefs.offProteins(at: now)
        if offProteins.contains(protein) { return reject("uses an off protein (\(protein))") }
        let texts = keys + raw.ingredients.map { clean($0.item) } + lines.map(\.name)
        // An off protein is off in its derivatives too: fish sauce under fish,
        // oyster sauce under shellfish. The primary-protein field alone let a
        // beef dish with fish sauce through in the live test.
        for off in offProteins {
            for term in ShelfRules.offTerms(forProtein: off) where ShelfRules.matchesOff(term: term, in: texts) {
                return reject("uses \(term), which comes from an off protein (\(off))")
            }
        }
        for term in prefs.offIngredients(at: now) where ShelfRules.matchesOff(term: term, in: texts) {
            return reject("uses an off ingredient (\(term))")
        }

        // 4. Duplicate title.
        if knownTitles.contains(normalizedTitle(title)) { return reject("duplicate title") }

        // 5. Cost, recomputed from the lines.
        let cost = ShelfRecipe.cost(of: lines)
        if perDinnerBudget > 0, cost > ShelfVocab.costCeilingFactor * perDinnerBudget {
            return reject("costs $\(String(format: "%.2f", cost)), over the ceiling")
        }

        // 6 and 7. Substance.
        if raw.ingredients.count < 3 { return reject("fewer than 3 ingredients") }
        if steps.count < 4 { return reject("fewer than 4 steps") }

        let recipe = Recipe(
            day: "", title: title, cookTimeMin: raw.cookTimeMin, servings: 2,
            ingredients: raw.ingredients.map { Ingredient(item: clean($0.item), qty: clean($0.qty)) },
            steps: steps, leftoverYield: raw.leftoverYield
        )
        let resolvedSource = source ?? (clean(raw.slice ?? "").lowercased() == "discovery" ? "discovery" : "topup")
        return .success(ShelfRecipe(recipe: recipe, cuisine: cuisine, primaryProtein: protein, method: method,
                                    ingredientKeys: keys, groceryItems: lines, source: resolvedSource, now: now))
    }
}
