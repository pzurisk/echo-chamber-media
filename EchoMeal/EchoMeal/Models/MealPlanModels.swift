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

    /// Recipe for a given weekday, matched by day name.
    func recipe(forDay day: String) -> Recipe? {
        recipes.first { $0.day == day }
    }
}
