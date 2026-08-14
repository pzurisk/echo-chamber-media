import Foundation

// MARK: - Top level plan

/// Mirrors the JSON schema Claude is instructed to return.
struct MealPlan: Codable, Hashable {
    var week: [WeekEntry]
    var recipes: [Recipe]
    var grocery: Grocery
}

// MARK: - Week

struct WeekEntry: Codable, Hashable, Identifiable {
    var day: String
    var title: String
    var cuisine: String
    var cookTimeMin: Int
    var servings: Int

    var id: String { day }
}

// MARK: - Recipes

struct Recipe: Codable, Hashable, Identifiable {
    var day: String
    var title: String
    var cookTimeMin: Int
    var servings: Int
    var ingredients: [Ingredient]
    var steps: [String]

    var id: String { title }
}

struct Ingredient: Codable, Hashable {
    var item: String
    var qty: String
}

// MARK: - Grocery

struct Grocery: Codable, Hashable {
    var budgetTarget: Double
    var estimatedTotal: Double
    var pantryCredit: Double
    var notes: String
    var sections: [GrocerySection]
}

struct GrocerySection: Codable, Hashable {
    var name: String
    var items: [GroceryItem]
}

struct GroceryItem: Codable, Hashable {
    var name: String
    var qty: String
    var estPrice: Double
    var pantry: Bool
    /// Titles of the recipes in this plan that use the item. Optional so
    /// plans saved before this field existed (including the week already
    /// on both phones) still decode; nil or empty falls back to local
    /// ingredient matching at display time.
    var recipes: [String]?
}

// MARK: - Taste history

/// One dinner the app has planned before. The rolling history feeds the
/// taste notes sent to Claude so suggestions improve over time.
struct PastDinner: Codable, Hashable {
    var title: String
    var cuisine: String
    var date: Date
}

// MARK: - Helpers

extension MealPlan {
    /// Fixed display order for grocery sections.
    static let sectionOrder = ["Proteins", "Produce", "Pantry", "Dairy", "Bread", "Sauces"]

    /// Sections sorted into the fixed store-walk order. Unknown names go last.
    var orderedSections: [GrocerySection] {
        grocery.sections.sorted { a, b in
            let ia = Self.sectionOrder.firstIndex(of: a.name) ?? Int.max
            let ib = Self.sectionOrder.firstIndex(of: b.name) ?? Int.max
            if ia == ib { return a.name < b.name }
            return ia < ib
        }
    }

    /// Stable identifier for a grocery item, unique across the plan and
    /// identical on both phones, so checked state can sync by ID.
    static func itemID(section: String, item: String) -> String {
        "\(section)|\(item)"
    }

    /// Items the plan believes are already in the pantry start pre-checked.
    var pantryItemIDs: Set<String> {
        var ids = Set<String>()
        for section in grocery.sections {
            for item in section.items where item.pantry {
                ids.insert(Self.itemID(section: section.name, item: item.name))
            }
        }
        return ids
    }

    /// Every grocery item ID on the plan. A swap uses this to carry the
    /// household's check-offs forward: only IDs that still exist on the
    /// new list survive the intersection.
    var allItemIDs: Set<String> {
        var ids = Set<String>()
        for section in grocery.sections {
            for item in section.items {
                ids.insert(Self.itemID(section: section.name, item: item.name))
            }
        }
        return ids
    }

    /// Recipe for a given weekday, matched by day name.
    func recipe(forDay day: String) -> Recipe? {
        recipes.first { $0.day == day }
    }

    /// Recipe titles to show under a grocery item, in plan order. Prefers
    /// the titles the model tagged on the item (filtered to titles that
    /// actually exist in this plan, so a hallucinated tag never shows).
    /// When there are no usable tags, falls back to matching the item
    /// name against every recipe's ingredients with the same normalized
    /// containment matching reconciliation uses, so plans generated
    /// before tagging existed get labels too. General items that match
    /// nothing return empty and show no tag line.
    func recipeTitles(for item: GroceryItem) -> [String] {
        let knownTitles = Set(recipes.map { $0.title.lowercased() })
        if let tagged = item.recipes {
            let valid = tagged.filter { knownTitles.contains($0.lowercased()) }
            if !valid.isEmpty { return valid }
        }
        let name = Self.normalizedForMatching(item.name)
        guard !name.isEmpty else { return [] }
        var titles: [String] = []
        for recipe in recipes {
            let uses = recipe.ingredients.contains { ingredient in
                let ing = Self.normalizedForMatching(ingredient.item)
                guard !ing.isEmpty else { return false }
                return ing.contains(name) || name.contains(ing)
            }
            if uses { titles.append(recipe.title) }
        }
        return titles
    }

    /// Section that collects recipe ingredients missing from the list.
    static let reconciledSectionName = "From recipes"

    /// Lowercased, trimmed, and reduced to a rough singular (a trailing
    /// "es" or "s" is dropped) so "Tomatoes" matches "tomato". Nothing
    /// fancy on purpose; both sides of a comparison get the same treatment.
    private static func normalizedForMatching(_ name: String) -> String {
        var n = name.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        if n.hasSuffix("es") {
            n = String(n.dropLast(2))
        } else if n.hasSuffix("s") {
            n = String(n.dropLast())
        }
        return n
    }

    /// Returns a copy of the plan where every recipe ingredient is
    /// guaranteed to appear on the grocery list. This exists because the
    /// model occasionally omits recipe ingredients from the list, and the
    /// household must never have to double check by hand. An ingredient
    /// counts as covered when any grocery item name contains it or it
    /// contains the grocery item name, after normalizing both sides.
    /// Anything uncovered lands in a "From recipes" section, deduped by
    /// normalized name (first qty wins). The new items carry estPrice 0
    /// on purpose: estimatedTotal is a stored value from Claude, and
    /// pricing the extras at 0 keeps the budget bar math honest.
    /// pantryStaples are things the household always has at home (Pantry
    /// Memory). They are deliberately absent from the grocery list, so an
    /// ingredient whose normalized name matches a normalized staple (same
    /// containment matching as coverage) is skipped instead of re-added.
    func reconciledWithRecipes(pantryStaples: [String] = []) -> MealPlan {
        let staples = pantryStaples
            .map(Self.normalizedForMatching)
            .filter { !$0.isEmpty }
        var groceryNames: [String] = []
        for section in grocery.sections {
            for item in section.items {
                let normalized = Self.normalizedForMatching(item.name)
                if !normalized.isEmpty {
                    groceryNames.append(normalized)
                }
            }
        }

        var missing: [GroceryItem] = []
        var missingIndexByName: [String: Int] = [:]
        for recipe in recipes {
            for ingredient in recipe.ingredients {
                let name = Self.normalizedForMatching(ingredient.item)
                guard !name.isEmpty else { continue }
                if let index = missingIndexByName[name] {
                    // Another recipe uses the same missing ingredient, so
                    // its title joins the item's recipe tags.
                    var tags = missing[index].recipes ?? []
                    if !tags.contains(recipe.title) {
                        tags.append(recipe.title)
                        missing[index].recipes = tags
                    }
                    continue
                }
                let isStaple = staples.contains { staple in
                    staple.contains(name) || name.contains(staple)
                }
                guard !isStaple else { continue }
                let covered = groceryNames.contains { grocery in
                    grocery.contains(name) || name.contains(grocery)
                }
                guard !covered else { continue }
                missingIndexByName[name] = missing.count
                missing.append(GroceryItem(
                    name: ingredient.item,
                    qty: ingredient.qty,
                    estPrice: 0,
                    pantry: false,
                    recipes: [recipe.title]
                ))
            }
        }

        guard !missing.isEmpty else { return self }

        var copy = self
        if let index = copy.grocery.sections.firstIndex(where: { $0.name == Self.reconciledSectionName }) {
            copy.grocery.sections[index].items.append(contentsOf: missing)
        } else {
            copy.grocery.sections.append(GrocerySection(name: Self.reconciledSectionName, items: missing))
        }
        return copy
    }
}
