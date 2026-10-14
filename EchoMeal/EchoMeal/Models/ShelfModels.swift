import Foundation

/// Fixed vocabulary. Matching is case-insensitive; proteins and methods are stored lowercase.
enum ShelfVocab {
    static let proteins = ["chicken", "beef", "pork", "fish", "shellfish", "lamb", "turkey", "eggs", "tofu", "beans", "none"]
    static let methods = ["sear", "roast", "braise", "grill", "stirfry", "bake", "simmer", "raw", "other"]
    static let sources = ["topup", "discovery", "import", "fallback"]
    static let sections = MealPlan.sectionOrder
    static let cuisines = ["Italian", "Mexican", "Thai", "Japanese", "Chinese", "Korean", "Vietnamese", "Indian",
                           "Greek", "Mediterranean", "Middle Eastern", "French", "Spanish", "American", "Caribbean", "African"]
    static let shelfCap = 60
    static let defaultWeight = 0.5
    static let discoveryFraction = 0.3
    static let dislikeBanDays = 90
    static let costCeilingFactor = 1.6

    static func canonicalCuisine(_ raw: String) -> String? {
        let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return cuisines.first { $0.caseInsensitiveCompare(t) == .orderedSame }
    }
}

struct ShelfGroceryItem: Codable, Hashable {
    var section, name, qty: String
    var estPrice: Double
    var pantry: Bool
}

/// A Recipe plus picker metadata. recipe.day is "" on the shelf; the day is set at pick time.
struct ShelfRecipe: Codable, Hashable, Identifiable {
    var id: UUID
    var recipe: Recipe
    var cuisine, primaryProtein, method: String
    var ingredientKeys: [String]
    var groceryItems: [ShelfGroceryItem]
    /// Sum of non-pantry estPrice, 2 people, USD. Computed in code, never taken from the model.
    var estCost: Double
    var source: String
    var tags: [String]?
    var createdAt: Date
    var servedAt: Date?
    var cookedAt: Date?
    var score: Double?

    init(recipe: Recipe, cuisine: String, primaryProtein: String, method: String, ingredientKeys: [String],
         groceryItems: [ShelfGroceryItem], source: String, now: Date = Date()) {
        var r = recipe
        r.day = ""
        id = UUID(); self.recipe = r; self.cuisine = cuisine; self.primaryProtein = primaryProtein
        self.method = method; self.ingredientKeys = ingredientKeys; self.groceryItems = groceryItems
        estCost = Self.cost(of: groceryItems); self.source = source; createdAt = now
    }

    static func cost(of items: [ShelfGroceryItem]) -> Double {
        (items.filter { !$0.pantry }.reduce(0.0) { $0 + $1.estPrice } * 100).rounded() / 100
    }

    func recipe(onDay day: String) -> Recipe { var r = recipe; r.day = day; return r }

    func weekEntry(onDay day: String) -> WeekEntry {
        WeekEntry(day: day, title: recipe.title, cuisine: cuisine, cookTimeMin: recipe.cookTimeMin,
                  servings: recipe.servings, leftoverNote: nil)
    }
}

/// Sealed payload of the Shelf record. Hard cap ShelfVocab.shelfCap recipes.
struct ShelfPayload: Codable, Hashable {
    var recipes: [ShelfRecipe]
    var lastTopUpAt: Date?
}

struct WeekOverride: Codable, Hashable {
    var until: Date
    var proteinsOff, ingredientsOff: [String]
}

/// Sealed payload of the Preferences record. Last writer wins by updatedAt.
struct Preferences: Codable, Hashable {
    var cuisineWeights: [String: Double]
    var proteinsOff, ingredientsOff: [String]
    var weekOverride: WeekOverride?
    var cooldownDays, favoriteCooldownDays: Int
    /// nil means use the per-phone UserDefaults value, as today.
    var budgetTarget: Double?
    var dinnersPerWeek: Int?
    var updatedAt: Date

    static func defaults(now: Date = Date()) -> Preferences {
        Preferences(cuisineWeights: Dictionary(uniqueKeysWithValues: ShelfVocab.cuisines.map { ($0, ShelfVocab.defaultWeight) }),
                    proteinsOff: [], ingredientsOff: [], weekOverride: nil, cooldownDays: 14,
                    favoriteCooldownDays: 21, budgetTarget: nil, dinnersPerWeek: nil, updatedAt: now)
    }

    func weight(forCuisine name: String) -> Double {
        min(1, max(0, cuisineWeights[ShelfVocab.canonicalCuisine(name) ?? name] ?? ShelfVocab.defaultWeight))
    }

    func activeOverride(at now: Date) -> WeekOverride? {
        guard let o = weekOverride, now < o.until else { return nil }
        return o
    }

    /// Base list plus a live override, lowercased, trimmed, deduped.
    func offProteins(at now: Date) -> [String] { Self.clean(proteinsOff + (activeOverride(at: now)?.proteinsOff ?? [])) }
    func offIngredients(at now: Date) -> [String] { Self.clean(ingredientsOff + (activeOverride(at: now)?.ingredientsOff ?? [])) }
    func effectiveBudget(fallback: Double) -> Double { budgetTarget ?? fallback }
    func effectiveDinners(fallback: Int) -> Int { dinnersPerWeek ?? fallback }

    private static func clean(_ raw: [String]) -> [String] {
        var seen = Set<String>()
        return raw.map { $0.lowercased().trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty && seen.insert($0).inserted }
    }
}

enum ShelfEligibility: Hashable {
    case eligible, titleCooldown, proteinCuisineCooldown, disliked, offProtein, offIngredient
}

enum ShelfBudgetStatus: Hashable {
    case withinBudget
    /// offenderIndex indexes ShelfPickResult.picks (the costliest unlocked pick).
    case overBudget(offenderIndex: Int, total: Double, ceiling: Double)
}

struct ShelfPickResult: Hashable {
    var picks: [ShelfRecipe]
    /// Dinners the shelf could not fill under the variety rules; the engine fills them with a fallback call.
    var shortfall: Int
    var budget: ShelfBudgetStatus
}

struct ShelfSignals: Codable, Hashable {
    var likedCuisines, likedProteins, likedMethods: [String]
    var dislikedCuisines, dislikedProteins, dislikedMethods: [String]
    var doNotRepeat, proteinsOff, ingredientsOff: [String]
    var perDinnerBudget, discoveryFraction: Double
}

/// One recipe in the top-up reply. servings, leftoverYield, slice are optional; the rest are required.
struct ShelfTopUpRecipe: Codable, Hashable {
    var title: String
    var cookTimeMin: Int
    var servings: Int?
    var cuisine, primaryProtein, method: String
    var ingredientKeys: [String]
    var ingredients: [Ingredient]
    var steps: [String]
    var leftoverYield: Bool?
    var groceryItems: [ShelfGroceryItem]
    var slice: String?
}

/// Decodes recipe by recipe: an element with a missing or mistyped field becomes nil (a rejection).
struct ShelfTopUpResponse: Decodable {
    var recipes: [ShelfTopUpRecipe?]
    private enum CodingKeys: String, CodingKey { case recipes }
    private struct Skip: Decodable { init(from decoder: Decoder) throws {} }

    init(from decoder: Decoder) throws {
        var list = try decoder.container(keyedBy: CodingKeys.self).nestedUnkeyedContainer(forKey: .recipes)
        var out: [ShelfTopUpRecipe?] = []
        while !list.isAtEnd {
            if let r = try? list.decode(ShelfTopUpRecipe.self) { out.append(r) }
            else { _ = try list.decode(Skip.self); out.append(nil) }
        }
        recipes = out
    }
}
