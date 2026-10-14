import XCTest

@testable import EchoMeal

/// QA (Q) check 4: AppState.swapFromShelf(day:) changes only that night,
/// keeps the other nights byte-identical, keeps check-offs by itemID
/// intersection, and makes no model call (it returns without suspending on
/// any network work and never enters .planning).
@MainActor
final class ShelfSwapStateTests: XCTestCase {

    private func recipe(_ title: String, cuisine: String, protein: String, cost: Double) -> ShelfRecipe {
        let r = Recipe(day: "", title: title, cookTimeMin: 30, servings: 2,
                       ingredients: [Ingredient(item: "\(title) main", qty: "1 lb"), Ingredient(item: "Shared onion", qty: "1"),
                                     Ingredient(item: "\(title) side", qty: "1 cup")],
                       steps: ["a so b", "c so d", "e so f", "g so h"])
        return ShelfRecipe(recipe: r, cuisine: cuisine, primaryProtein: protein, method: "sear",
                           ingredientKeys: [protein, "onion"],
                           groceryItems: [
                               ShelfGroceryItem(section: "Proteins", name: "\(title) main", qty: "1 lb", estPrice: cost, pantry: false),
                               ShelfGroceryItem(section: "Produce", name: "Shared onion", qty: "1", estPrice: 1, pantry: false),
                               ShelfGroceryItem(section: "Pantry", name: "\(title) side", qty: "1 cup", estPrice: 2, pantry: false)
                           ],
                           source: "topup")
    }

    func testSwapFromShelfChangesOnlyThatNight() async {
        let state = AppState()
        let a = recipe("QA Alpha", cuisine: "Italian", protein: "chicken", cost: 8)
        let b = recipe("QA Bravo", cuisine: "Mexican", protein: "beef", cost: 9)
        let c = recipe("QA Charlie", cuisine: "Thai", protein: "pork", cost: 7)
        let d = recipe("QA Delta", cuisine: "Greek", protein: "lamb", cost: 6)
        let e = recipe("QA Echo", cuisine: "Korean", protein: "tofu", cost: 5)

        var prefs = Preferences.defaults(now: Date())
        prefs.budgetTarget = 100
        state.preferences = prefs
        state.keptRecipes = []
        state.favorites = []
        state.ratings = [:]
        state.pantryItems = []
        state.recipeBox = []
        state.shelf = [a, b, c, d, e]
        state.phase = .idle

        let days = ["Monday", "Tuesday", "Wednesday"]
        let picks = [a, b, c]
        let plan = MealPlan(
            week: zip(days, picks).map { $1.weekEntry(onDay: $0) },
            recipes: zip(days, picks).map { $1.recipe(onDay: $0) },
            grocery: ShelfRules.buildGrocery(picks: picks, budgetTarget: 100)
        ).reconciledWithRecipes()
        state.plan = plan
        // Planned two days ago (a same-day entry for the dropped title is
        // scrubbed by recordHistory's same-day dedupe, by design). Bravo
        // starts as nil so the swap's "planned, never cooked" mark shows.
        let twoDaysAgo = Date().addingTimeInterval(-2 * 86_400)
        state.pastDinners = picks.map {
            PastDinner(title: $0.recipe.title, cuisine: $0.cuisine, date: twoDaysAgo,
                       cooked: $0.recipe.title == "QA Bravo" ? nil : false, shelfID: $0.id)
        }

        let alphaID = MealPlan.itemID(section: "Proteins", item: "QA Alpha main")
        let bravoID = MealPlan.itemID(section: "Proteins", item: "QA Bravo main")
        let charlieID = MealPlan.itemID(section: "Pantry", item: "QA Charlie side")
        let onionID = MealPlan.itemID(section: "Produce", item: "Shared onion")
        let ghostID = "Produce|Not On Any List"
        XCTAssertTrue(plan.allItemIDs.isSuperset(of: [alphaID, bravoID, charlieID, onionID]))
        state.checkedItemIDs = [alphaID, bravoID, charlieID, onionID, ghostID]

        let ok = await state.swapFromShelf(day: "Tuesday")
        XCTAssertTrue(ok)
        XCTAssertNotEqual(state.phase, .planning)
        guard let after = state.plan else { return XCTFail("plan vanished") }

        // Only Tuesday changed.
        XCTAssertEqual(after.week.count, 3)
        XCTAssertEqual(after.week[0], plan.week[0])
        XCTAssertEqual(after.week[2], plan.week[2])
        XCTAssertEqual(after.recipe(forDay: "Monday"), plan.recipe(forDay: "Monday"))
        XCTAssertEqual(after.recipe(forDay: "Wednesday"), plan.recipe(forDay: "Wednesday"))
        XCTAssertEqual(after.week[1].day, "Tuesday")
        XCTAssertNotEqual(after.week[1].title, "QA Bravo")
        XCTAssertTrue(["QA Delta", "QA Echo"].contains(after.week[1].title))
        XCTAssertEqual(after.recipe(forDay: "Tuesday")?.title, after.week[1].title)

        // Check-offs: kept where the item survives, dropped where it does not.
        XCTAssertTrue(state.checkedItemIDs.contains(alphaID))
        XCTAssertTrue(state.checkedItemIDs.contains(charlieID))
        XCTAssertTrue(state.checkedItemIDs.contains(onionID))
        XCTAssertFalse(state.checkedItemIDs.contains(bravoID))
        XCTAssertFalse(state.checkedItemIDs.contains(ghostID))
        XCTAssertFalse(after.allItemIDs.contains(bravoID))

        // History logs only the new dinner; the dropped one stays "not cooked".
        XCTAssertEqual(state.pastDinners.filter { $0.title == after.week[1].title }.count, 1)
        XCTAssertEqual(state.pastDinners.first { $0.title == "QA Bravo" }?.cooked, false)
    }

    /// Updated by E2: a week with a night that is not a shelf recipe no
    /// longer refuses. The swap still replaces only that night, from the
    /// shelf, and patches the grocery list in code.
    func testSwapFromShelfOnANonShelfNightStillReplacesOnlyThatNight() async {
        let state = AppState()
        let a = recipe("QA Solo", cuisine: "Italian", protein: "chicken", cost: 8)
        state.shelf = [a]
        state.phase = .idle
        let plan = MealPlan(
            week: [WeekEntry(day: "Monday", title: "Something Live", cuisine: "French", cookTimeMin: 30, servings: 2)],
            recipes: [Recipe(day: "Monday", title: "Something Live", cookTimeMin: 30, servings: 2, ingredients: [], steps: [])],
            grocery: Grocery(budgetTarget: 100, estimatedTotal: 0, pantryCredit: 0, notes: "", sections: [])
        )
        state.plan = plan
        let ok = await state.swapFromShelf(day: "Monday")
        XCTAssertTrue(ok)
        XCTAssertEqual(state.plan?.week.map(\.title), ["QA Solo"])
        XCTAssertEqual(state.phase, .idle)
    }
}
