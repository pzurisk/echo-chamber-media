import XCTest

@testable import EchoMeal

/// The pure logic behind Feature 2's "already have this" tagging: forcing
/// pantry: true on a matching grocery item, moving its price into
/// pantryCredit, and the CloudKit legacy-format migration. None of this
/// needs a live plan generation to verify.
final class PantryReconciliationTests: XCTestCase {

    private func samplePlan() -> MealPlan {
        MealPlan(
            week: [WeekEntry(day: "Monday", title: "Chicken Rice", cuisine: "American", cookTimeMin: 30, servings: 2)],
            recipes: [Recipe(
                day: "Monday", title: "Chicken Rice", cookTimeMin: 30, servings: 2,
                ingredients: [Ingredient(item: "rice", qty: "2 cups")],
                steps: ["Cook it."]
            )],
            grocery: Grocery(
                budgetTarget: 100, estimatedTotal: 50, pantryCredit: 0, notes: "",
                sections: [GrocerySection(name: "Pantry", items: [
                    GroceryItem(name: "Rice", qty: "2 cups", estPrice: 4, pantry: false, recipes: ["Chicken Rice"]),
                    GroceryItem(name: "Chicken thighs", qty: "1 lb", estPrice: 8, pantry: false, recipes: ["Chicken Rice"]),
                ])]
            )
        )
    }

    func testInStockItemGetsTaggedAndCreditedByName() {
        let plan = samplePlan()
        let reconciled = plan.reconciledWithPantryInventory([
            PantryItem(name: "rice", category: "Pantry", inStock: true)
        ])
        let rice = reconciled.grocery.sections[0].items.first { $0.name == "Rice" }
        XCTAssertEqual(rice?.pantry, true)
        XCTAssertEqual(reconciled.grocery.pantryCredit, 4)
        XCTAssertEqual(reconciled.grocery.estimatedTotal, 46)
        // The other item is untouched: no match, no tag, no credit shift.
        let chicken = reconciled.grocery.sections[0].items.first { $0.name == "Chicken thighs" }
        XCTAssertEqual(chicken?.pantry, false)
    }

    func testOutOfStockItemIsNotTagged() {
        let plan = samplePlan()
        let reconciled = plan.reconciledWithPantryInventory([
            PantryItem(name: "rice", category: "Pantry", inStock: false)
        ])
        let rice = reconciled.grocery.sections[0].items.first { $0.name == "Rice" }
        XCTAssertEqual(rice?.pantry, false, "an item marked out should reappear as a normal thing to buy")
        XCTAssertEqual(reconciled.grocery.pantryCredit, 0)
    }

    func testAlreadyClaudeTaggedItemIsNeverUntagged() {
        var plan = samplePlan()
        plan.grocery.sections[0].items[1].pantry = true // Claude's own guess on chicken
        let reconciled = plan.reconciledWithPantryInventory([
            PantryItem(name: "rice", category: "Pantry", inStock: true)
        ])
        let chicken = reconciled.grocery.sections[0].items.first { $0.name == "Chicken thighs" }
        XCTAssertEqual(chicken?.pantry, true, "reconciliation must never flip an existing pantry tag back off")
    }

    func testEmptyInventoryLeavesPlanUnchanged() {
        let plan = samplePlan()
        let reconciled = plan.reconciledWithPantryInventory([])
        XCTAssertEqual(reconciled, plan)
    }
}
