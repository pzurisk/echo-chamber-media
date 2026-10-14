import Foundation

/// Pure shelf picking rules: eligibility, ranking, the weekly pick, the
/// budget ceiling, swap candidates, and the code-side grocery merge. No
/// AppState access, no clock reads, no randomness except a seeded jitter, so
/// the same inputs always give the same week.
enum ShelfRules {

    // MARK: - Text matching

    /// Lowercased words split on non-alphanumerics.
    private static func rawWords(_ text: String) -> [String] {
        text.lowercased().split(whereSeparator: { !($0.isLetter || $0.isNumber) }).map(String.init)
    }

    /// Every spelling a word can reduce to: itself, minus a trailing "s",
    /// minus a trailing "es". Two words match when their sets overlap, so
    /// "tomatoes" meets "tomato" and "sardines" meets "sardine".
    private static func stems(_ w: String) -> Set<String> {
        var out: Set<String> = [w]
        if w.hasSuffix("es"), w.count > 2 { out.insert(String(w.dropLast(2))) }
        if w.hasSuffix("s"), w.count > 1 { out.insert(String(w.dropLast())) }
        return out
    }

    /// Word-level view kept for keyword scoring: one canonical stem each.
    private static func words(_ text: String) -> [String] {
        rawWords(text).map { w in
            if w.hasSuffix("es"), w.count > 2 { return String(w.dropLast(2)) }
            if w.hasSuffix("s"), w.count > 1 { return String(w.dropLast()) }
            return w
        }
    }

    /// True when the term's word sequence appears contiguously in any text.
    /// "egg" matches "scrambled eggs" and never "eggplant". A match followed
    /// by "free" or preceded by "no", "without", or "not" does not count.
    static func matchesOff(term: String, in texts: [String]) -> Bool {
        let needle = rawWords(term).map(stems)
        guard !needle.isEmpty else { return false }
        for text in texts {
            let hay = rawWords(text).map(stems)
            guard hay.count >= needle.count else { continue }
            for start in 0...(hay.count - needle.count) {
                var all = true
                for k in 0..<needle.count where hay[start + k].isDisjoint(with: needle[k]) {
                    all = false
                    break
                }
                guard all else { continue }
                // "fish-free soy sauce", "no shrimp", "without fish": the
                // text names the term to say it is absent, so it is no hit.
                let end = start + needle.count
                if end < hay.count, hay[end].contains("free") { continue }
                if start > 0, !hay[start - 1].isDisjoint(with: ["no", "without", "not"]) { continue }
                return true
            }
        }
        return false
    }

    /// An off protein also bans the sauces, pastes, stocks, and cuts made
    /// from it. Returns the protein itself plus its derivatives, lowercased,
    /// ready for `matchesOff`. Unknown or "none" gives an empty list.
    static func offTerms(forProtein p: String) -> [String] {
        let key = p.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        switch key {
        case "fish":
            return ["fish", "fish sauce", "fish stock", "anchovy", "anchovies", "dashi", "bonito", "katsuobushi", "tuna",
                    "salmon", "cod", "tilapia", "halibut", "sardine", "mackerel", "trout", "worcestershire",
                    "swordfish", "catfish", "snapper", "haddock", "mahi mahi", "sea bass", "pollock"]
        case "shellfish":
            return ["shellfish", "shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "oyster sauce",
                    "shrimp paste", "dried shrimp", "scallop", "squid", "calamari", "crawfish", "crayfish", "octopus"]
        case "beef":
            return ["beef", "steak", "ground beef", "brisket", "short rib", "beef broth", "beef stock", "beef bouillon",
                    "veal", "sirloin", "ribeye", "chuck roast", "oxtail"]
        case "pork":
            return ["pork", "bacon", "pancetta", "prosciutto", "ham", "sausage", "chorizo", "lard", "pork belly",
                    "guanciale", "pepperoni", "salami"]
        case "chicken":
            return ["chicken", "chicken broth", "chicken stock", "chicken bouillon", "chicken thigh", "chicken breast"]
        case "lamb":
            return ["lamb", "mutton", "lamb chop", "ground lamb"]
        case "turkey":
            return ["turkey", "turkey bacon", "ground turkey"]
        case "eggs":
            return ["eggs", "egg", "mayonnaise", "mayo", "aioli", "meringue"]
        case "tofu":
            return ["tofu", "bean curd", "tempeh"]
        case "beans":
            return ["beans", "black bean", "kidney bean", "white bean", "pinto bean", "refried bean", "baked bean",
                    "navy bean", "lima bean", "cannellini", "chickpea", "garbanzo", "lentil", "hummus"]
        default:
            return []
        }
    }

    /// The first off term (a protein or one of its derivatives) found in
    /// the texts, or nil. `protein` is checked first as the recipe's
    /// declared main protein.
    static func offProteinHit(protein: String, texts: [String], prefs: Preferences, now: Date) -> String? {
        let off = prefs.offProteins(at: now)
        let declared = protein.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if off.contains(declared) { return declared }
        for p in off {
            for term in offTerms(forProtein: p) where matchesOff(term: term, in: texts) { return term }
        }
        return nil
    }

    private static func offTexts(of s: ShelfRecipe) -> [String] {
        s.ingredientKeys + s.recipe.ingredients.map(\.item) + s.groceryItems.map(\.name)
    }

    private static func norm(_ title: String) -> String {
        title.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    }

    // MARK: - Eligibility

    static func eligibility(of s: ShelfRecipe, shelf: [ShelfRecipe], history: [PastDinner], ratings: [String: Int],
                            favoriteTitles: Set<String>, prefs: Preferences, today: Date, calendar: Calendar) -> ShelfEligibility {
        let protein = s.primaryProtein.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        let texts = offTexts(of: s)
        if offProteinHit(protein: protein, texts: texts, prefs: prefs, now: today) != nil { return .offProtein }

        for term in prefs.offIngredients(at: today) where matchesOff(term: term, in: texts) {
            return .offIngredient
        }

        let title = norm(s.recipe.title)
        let matching = history.filter { norm($0.title) == title }

        if let rating = ratings[s.recipe.title.lowercased()] ?? ratings[title], rating <= 2 {
            let anchors = matching.map(\.date) + [s.servedAt, s.cookedAt].compactMap { $0 }
            guard let anchor = anchors.max() else { return .disliked }
            if let limit = calendar.date(byAdding: .day, value: -ShelfVocab.dislikeBanDays, to: today), anchor >= limit {
                return .disliked
            }
        }

        let isFavorite = favoriteTitles.contains { norm($0) == title }
        let window = isFavorite ? prefs.favoriteCooldownDays : prefs.cooldownDays
        guard let windowStart = calendar.date(byAdding: .day, value: -window, to: today),
              let weekStart = calendar.date(byAdding: .day, value: -7, to: today) else { return .eligible }

        func counts(_ entry: PastDinner) -> Bool {
            entry.date >= windowStart && (entry.cooked != false || entry.date >= weekStart)
        }

        if matching.contains(where: counts) { return .titleCooldown }

        let cuisine = s.cuisine.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if protein != "none" && !protein.isEmpty {
            for entry in history where counts(entry) {
                guard entry.cuisine.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) == cuisine else { continue }
                let source = shelf.first { entry.shelfID != nil && $0.id == entry.shelfID }
                    ?? shelf.first { norm($0.recipe.title) == norm(entry.title) }
                guard let entryProtein = source?.primaryProtein.lowercased() else { continue }
                if entryProtein == protein { return .proteinCuisineCooldown }
            }
        }
        return .eligible
    }

    // MARK: - Rank

    /// SplitMix64 step, so the jitter is a pure function of seed and id.
    private static func mix(_ x: UInt64) -> UInt64 {
        var z = x &+ 0x9E37_79B9_7F4A_7C15
        z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
        z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
        return z ^ (z >> 31)
    }

    private static func fold(_ id: UUID) -> UInt64 {
        var h: UInt64 = 0xCBF2_9CE4_8422_2325
        withUnsafeBytes(of: id.uuid) { bytes in
            for b in bytes { h = (h ^ UInt64(b)) &* 0x0000_0100_0000_01B3 }
        }
        return h
    }

    static func rank(_ s: ShelfRecipe, ratings: [String: Int], favoriteTitles: Set<String>, prefs: Preferences, seed: UInt64) -> Double {
        var score = prefs.weight(forCuisine: s.cuisine)
        let title = norm(s.recipe.title)
        switch ratings[s.recipe.title.lowercased()] ?? ratings[title] {
        case 5?: score += 0.40
        case 4?: score += 0.30
        default: break
        }
        if favoriteTitles.contains(where: { norm($0) == title }) { score += 0.10 }
        let unit = Double(mix(seed ^ fold(s.id)) >> 11) / Double(1 << 53)
        return score + unit * 0.10
    }

    // MARK: - Keyword match

    private static let stopWords: Set<String> = [
        "the", "and", "for", "with", "that", "this", "from", "have", "want", "some", "something", "like", "make",
        "can", "you", "our", "get", "give", "need", "night", "dinner", "dinners", "week", "meal", "meals", "please",
        "tonight", "just", "really", "about", "would", "could", "one", "two", "three", "four", "five", "also", "nice",
        "good", "great", "any", "all", "not", "but", "are", "was", "its", "let", "lets", "maybe", "more", "less"
    ]

    /// Number of distinct transcript keywords found in the recipe's title,
    /// cuisine, or tags. Zero means no overlap.
    static func keywordScore(transcript: String, recipe s: ShelfRecipe) -> Int {
        let wanted = Set(words(transcript).filter { $0.count >= 3 && !stopWords.contains($0) })
        guard !wanted.isEmpty else { return 0 }
        let have = Set(words(s.recipe.title) + words(s.cuisine) + (s.tags ?? []).flatMap(words))
        return wanted.intersection(have).count
    }

    // MARK: - Variety

    private static func varietyOK(_ candidate: ShelfRecipe, against picks: [ShelfRecipe]) -> Bool {
        let cuisine = candidate.cuisine.lowercased()
        if picks.contains(where: { $0.cuisine.lowercased() == cuisine }) { return false }
        let protein = candidate.primaryProtein.lowercased()
        if protein != "none" && picks.filter({ $0.primaryProtein.lowercased() == protein }).count >= 2 { return false }
        return true
    }

    // MARK: - Pick the week

    static func pickWeek(count: Int, shelf: [ShelfRecipe], locked: [ShelfRecipe], history: [PastDinner], ratings: [String: Int],
                         favoriteTitles: Set<String>, prefs: Preferences, budgetTarget: Double, today: Date, calendar: Calendar,
                         seed: UInt64) -> ShelfPickResult {
        pickWeek(count: count, shelf: shelf, locked: locked, history: history, ratings: ratings, favoriteTitles: favoriteTitles,
                 prefs: prefs, budgetTarget: budgetTarget, today: today, calendar: calendar, seed: seed, allowed: nil)
    }

    /// Same as the contract pickWeek, optionally limited to the shelf
    /// recipes whose ids are in `allowed` (the keyword-matched subset).
    /// Eligibility still looks at the whole shelf, so protein lookups for
    /// history entries keep working.
    static func pickWeek(count: Int, shelf: [ShelfRecipe], locked: [ShelfRecipe], history: [PastDinner], ratings: [String: Int],
                         favoriteTitles: Set<String>, prefs: Preferences, budgetTarget: Double, today: Date, calendar: Calendar,
                         seed: UInt64, allowed: Set<UUID>?) -> ShelfPickResult {
        let want = max(0, count)
        let lockedIDs = Set(locked.map(\.id))
        let lockedTitles = Set(locked.map { norm($0.recipe.title) })
        var picks = Array(locked.prefix(want))

        var ranked: [(recipe: ShelfRecipe, score: Double)] = []
        for s in shelf where !lockedIDs.contains(s.id) && !lockedTitles.contains(norm(s.recipe.title)) && (allowed?.contains(s.id) ?? true) {
            let e = eligibility(of: s, shelf: shelf, history: history, ratings: ratings, favoriteTitles: favoriteTitles,
                                prefs: prefs, today: today, calendar: calendar)
            guard e == .eligible else { continue }
            ranked.append((s, rank(s, ratings: ratings, favoriteTitles: favoriteTitles, prefs: prefs, seed: seed)))
        }
        ranked.sort { a, b in
            a.score != b.score ? a.score > b.score : a.recipe.id.uuidString < b.recipe.id.uuidString
        }

        var leftover: [ShelfRecipe] = []
        var seenTitles = Set(picks.map { norm($0.recipe.title) })
        for entry in ranked {
            let candidate = entry.recipe
            let t = norm(candidate.recipe.title)
            if picks.count < want, !seenTitles.contains(t), varietyOK(candidate, against: picks) {
                picks.append(candidate)
                seenTitles.insert(t)
            } else {
                leftover.append(candidate)
            }
        }

        let shortfall = max(0, want - picks.count)
        let enforced = enforceBudget(picks: picks, locked: lockedIDs, pool: leftover, ceiling: budgetTarget)
        return ShelfPickResult(picks: enforced.picks, shortfall: shortfall, budget: enforced.budget)
    }

    // MARK: - Budget

    private static func cents(_ x: Double) -> Int { Int((x * 100).rounded()) }

    private static func total(_ picks: [ShelfRecipe]) -> Double {
        (picks.reduce(0.0) { $0 + $1.estCost } * 100).rounded() / 100
    }

    static func enforceBudget(picks: [ShelfRecipe], locked: Set<UUID>, pool: [ShelfRecipe], ceiling: Double) -> (picks: [ShelfRecipe], budget: ShelfBudgetStatus) {
        var current = picks
        var available = pool
        while cents(total(current)) > cents(ceiling) {
            // Costliest unlocked pick; ties go to the later index.
            var offender: Int?
            for (i, p) in current.enumerated() where !locked.contains(p.id) {
                if let o = offender {
                    if p.estCost >= current[o].estCost { offender = i }
                } else {
                    offender = i
                }
            }
            guard let o = offender else {
                return (current, .overBudget(offenderIndex: max(0, current.count - 1), total: total(current), ceiling: ceiling))
            }
            let rest = current.enumerated().filter { $0.offset != o }.map(\.element)
            let restTitles = Set(rest.map { norm($0.recipe.title) })
            if let r = available.firstIndex(where: {
                $0.estCost < current[o].estCost && !restTitles.contains(norm($0.recipe.title)) && varietyOK($0, against: rest)
            }) {
                current[o] = available.remove(at: r)
            } else {
                return (current, .overBudget(offenderIndex: o, total: total(current), ceiling: ceiling))
            }
        }
        return (current, .withinBudget)
    }

    /// Pool entries that could replace picks[index] without breaking the
    /// variety rules against the other picks, best first (pool order). The
    /// budget ceiling is not applied: the swap sheet shows the options and
    /// the caller decides what a pricier one costs.
    static func swapCandidates(for index: Int, picks: [ShelfRecipe], pool: [ShelfRecipe]) -> [ShelfRecipe] {
        guard picks.indices.contains(index) else { return [] }
        let rest = picks.enumerated().filter { $0.offset != index }.map(\.element)
        let taken = Set(picks.map { norm($0.recipe.title) })
        let takenIDs = Set(picks.map(\.id))
        return pool.filter {
            !takenIDs.contains($0.id) && !taken.contains(norm($0.recipe.title)) && varietyOK($0, against: rest)
        }
    }

    // MARK: - Grocery merge (no model call)

    private static func round2(_ x: Double) -> Double { (x * 100).rounded() / 100 }

    static func buildGrocery(picks: [ShelfRecipe], budgetTarget: Double) -> Grocery {
        struct Line {
            var name: String
            /// Lowercased title of the recipe the kept spelling came from.
            var spellingKey: String
            var quals: [String] = []
            var price = 0.0
            var allPantry = true
            var titles: [String] = []
        }
        var order: [String] = []
        var bySection: [String: [Line]] = [:]
        var indexByKey: [String: Int] = [:]

        for pick in picks {
            for item in pick.groceryItems {
                let section = item.section
                let key = section + "\u{1}" + norm(item.name)
                if bySection[section] == nil {
                    bySection[section] = []
                    order.append(section)
                }
                let i: Int
                if let existing = indexByKey[key] {
                    i = existing
                } else {
                    i = bySection[section]!.count
                    bySection[section]!.append(Line(name: item.name, spellingKey: norm(pick.recipe.title)))
                    indexByKey[key] = i
                }
                var line = bySection[section]![i]
                // The kept spelling comes from the alphabetically first
                // recipe title, so it does not depend on pick order and the
                // itemID (section|name) stays stable across swaps.
                let titleKey = norm(pick.recipe.title)
                if titleKey < line.spellingKey {
                    line.name = item.name
                    line.spellingKey = titleKey
                }
                let q = item.qty.trimmingCharacters(in: .whitespacesAndNewlines)
                if !q.isEmpty, !line.quals.contains(where: { $0.caseInsensitiveCompare(q) == .orderedSame }) {
                    line.quals.append(q)
                }
                line.price += item.estPrice
                if !item.pantry { line.allPantry = false }
                if !line.titles.contains(pick.recipe.title) { line.titles.append(pick.recipe.title) }
                bySection[section]![i] = line
            }
        }

        let known = MealPlan.sectionOrder.filter { bySection[$0] != nil }
        let extra = order.filter { !MealPlan.sectionOrder.contains($0) }
        var sections: [GrocerySection] = []
        var spend = 0.0
        var credit = 0.0
        for name in known + extra {
            let items = (bySection[name] ?? []).map { line -> GroceryItem in
                let price = round2(line.price)
                if line.allPantry { credit += price } else { spend += price }
                return GroceryItem(name: line.name, qty: line.quals.joined(separator: " + "), estPrice: price,
                                   pantry: line.allPantry, recipes: line.titles)
            }
            sections.append(GrocerySection(name: name, items: items))
        }
        return Grocery(budgetTarget: budgetTarget, estimatedTotal: round2(spend), pantryCredit: round2(credit),
                       notes: "Built from the shelf", sections: sections)
    }
}
