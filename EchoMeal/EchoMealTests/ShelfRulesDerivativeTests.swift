import XCTest

@testable import EchoMeal

/// E2 fixes: off-protein derivatives, deterministic merged spelling, swaps
/// on a week that is not built from the shelf, live-plan budget check.
@MainActor
final class ShelfRulesDerivativeTests: XCTestCase {

    private func shelfRecipe(_ title: String, cuisine: String, protein: String, cost: Double,
                             ingredients: [String] = [], grocery: [ShelfGroceryItem]? = nil) -> ShelfRecipe {
        let items = grocery ?? [ShelfGroceryItem(section: "Proteins", name: "\(title) main", qty: "1 lb", estPrice: cost, pantry: false)]
        let r = Recipe(day: "", title: title, cookTimeMin: 30, servings: 2,
                       ingredients: (ingredients.isEmpty ? ["\(title) main"] : ingredients).map { Ingredient(item: $0, qty: "1") },
                       steps: ["a so b", "c so d", "e so f", "g so h"])
        return ShelfRecipe(recipe: r, cuisine: cuisine, primaryProtein: protein, method: "sear",
                           ingredientKeys: ingredients.isEmpty ? [protein] : ingredients, groceryItems: items, source: "topup")
    }

    private func eligibility(_ s: ShelfRecipe, off: [String]) -> ShelfEligibility {
        var prefs = Preferences.defaults(now: Date())
        prefs.proteinsOff = off
        return ShelfRules.eligibility(of: s, shelf: [s], history: [], ratings: [:], favoriteTitles: [], prefs: prefs,
                                      today: Date(), calendar: Calendar.current)
    }

    // MARK: Derivatives

    func testFishSauceInABeefRecipeIsOffProteinWhenFishIsOff() {
        let beef = shelfRecipe("Thai Red Curry Beef", cuisine: "Thai", protein: "beef", cost: 10,
                               ingredients: ["beef sirloin", "Fish sauce", "green beans"])
        XCTAssertEqual(eligibility(beef, off: ["fish"]), .offProtein)
        XCTAssertEqual(eligibility(beef, off: []), .eligible)
        XCTAssertEqual(eligibility(beef, off: ["shellfish"]), .eligible)
    }

    func testOysterSauceAndShrimpPasteAreOffProteinWhenShellfishIsOff() {
        let chicken = shelfRecipe("Thai Basil Chicken", cuisine: "Thai", protein: "chicken", cost: 10,
                                  ingredients: ["chicken thighs", "Oyster sauce", "basil"])
        XCTAssertEqual(eligibility(chicken, off: ["shellfish"]), .offProtein)
        let paste = shelfRecipe("Curry", cuisine: "Thai", protein: "tofu", cost: 8,
                                grocery: [ShelfGroceryItem(section: "Pantry", name: "Shrimp paste", qty: "1 tbsp", estPrice: 2, pantry: false)])
        XCTAssertEqual(eligibility(paste, off: ["shellfish"]), .offProtein)
    }

    func testPluralAndSingularDerivativesMatch() {
        XCTAssertTrue(ShelfRules.matchesOff(term: "sardine", in: ["Canned sardines"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "anchovy", in: ["Anchovy fillets"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "anchovies", in: ["Anchovies in oil"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "tomato", in: ["Roma tomatoes"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "egg", in: ["Eggplant"]))
        let eggplant = shelfRecipe("Eggplant Parm", cuisine: "Italian", protein: "none", cost: 6, ingredients: ["eggplant", "mozzarella"])
        XCTAssertEqual(eligibility(eggplant, off: ["eggs"]), .eligible)
    }

    func testNegatedMentionsAreNotHits() {
        XCTAssertFalse(ShelfRules.matchesOff(term: "fish", in: ["fish-free soy sauce"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "shrimp", in: ["Shrimp-free curry paste"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "fish", in: ["fish sauce"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "shrimp", in: ["no shrimp"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "fish", in: ["served without fish"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "shrimp", in: ["not shrimp"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "shrimp", in: ["shrimp paste"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "shrimp", in: ["no peanuts", "shrimp"]))
        let clean = shelfRecipe("Soy Noodles", cuisine: "Japanese", protein: "tofu", cost: 8,
                                ingredients: ["tofu", "Fish-free soy sauce", "Shrimp-free curry paste"])
        XCTAssertEqual(eligibility(clean, off: ["fish", "shellfish"]), .eligible)
        let dirty = shelfRecipe("Soy Noodles 2", cuisine: "Japanese", protein: "tofu", cost: 8,
                                ingredients: ["tofu", "Fish sauce"])
        XCTAssertEqual(eligibility(dirty, off: ["fish"]), .offProtein)
    }

    func testOffTermsListsIncludeTheRequiredDerivatives() {
        let fish = ShelfRules.offTerms(forProtein: "Fish")
        for t in ["fish", "fish sauce", "anchovy", "anchovies", "dashi", "bonito", "katsuobushi", "tuna", "salmon", "cod",
                  "tilapia", "halibut", "sardine", "mackerel", "trout", "worcestershire"] { XCTAssertTrue(fish.contains(t), t) }
        let shell = ShelfRules.offTerms(forProtein: "shellfish")
        for t in ["shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "oyster sauce", "shrimp paste", "scallop", "squid", "calamari"] {
            XCTAssertTrue(shell.contains(t), t)
        }
        XCTAssertTrue(ShelfRules.offTerms(forProtein: "pork").contains("bacon"))
        XCTAssertTrue(ShelfRules.offTerms(forProtein: "beef").contains("beef stock"))
        XCTAssertTrue(ShelfRules.offTerms(forProtein: "chicken").contains("chicken stock"))
        XCTAssertEqual(ShelfRules.offTerms(forProtein: "none"), [])
        for p in ShelfVocab.proteins where p != "none" { XCTAssertFalse(ShelfRules.offTerms(forProtein: p).isEmpty, p) }
    }

    // MARK: Deterministic spelling

    func testMergedSpellingComesFromAlphabeticallyFirstRecipeTitleInAnyOrder() {
        func line(_ name: String) -> [ShelfGroceryItem] {
            [ShelfGroceryItem(section: "Produce", name: name, qty: "1 head", estPrice: 1, pantry: false)]
        }
        let alpha = shelfRecipe("Alpha Bowl", cuisine: "Thai", protein: "tofu", cost: 1, grocery: line("Garlic"))
        let zulu = shelfRecipe("zulu Soup", cuisine: "Greek", protein: "lamb", cost: 1, grocery: line("garlic"))
        let one = ShelfRules.buildGrocery(picks: [alpha, zulu], budgetTarget: 100)
        let two = ShelfRules.buildGrocery(picks: [zulu, alpha], budgetTarget: 100)
        XCTAssertEqual(one.sections[0].items[0].name, "Garlic")
        XCTAssertEqual(two.sections[0].items[0].name, "Garlic")
        XCTAssertEqual(MealPlan.itemID(section: "Produce", item: one.sections[0].items[0].name),
                       MealPlan.itemID(section: "Produce", item: two.sections[0].items[0].name))
    }

    // MARK: Non-shelf swap

    private func liveWeek(_ state: AppState) -> MealPlan {
        func item(_ name: String, _ qty: String, _ price: Double, _ tags: [String], section: String = "Proteins") -> GroceryItem {
            GroceryItem(name: name, qty: qty, estPrice: price, pantry: false, recipes: tags)
        }
        let plan = MealPlan(
            week: [
                WeekEntry(day: "Monday", title: "Live A", cuisine: "French", cookTimeMin: 30, servings: 2),
                WeekEntry(day: "Tuesday", title: "Live B", cuisine: "Thai", cookTimeMin: 30, servings: 2)
            ],
            recipes: [
                Recipe(day: "Monday", title: "Live A", cookTimeMin: 30, servings: 2,
                       ingredients: [Ingredient(item: "A main", qty: "1"), Ingredient(item: "Shared onion", qty: "1"), Ingredient(item: "A side", qty: "1")],
                       steps: ["a"]),
                Recipe(day: "Tuesday", title: "Live B", cookTimeMin: 30, servings: 2,
                       ingredients: [Ingredient(item: "B main", qty: "1"), Ingredient(item: "Shared onion", qty: "1")],
                       steps: ["a"])
            ],
            grocery: Grocery(budgetTarget: 100, estimatedTotal: 30, pantryCredit: 0, notes: "n", sections: [
                GrocerySection(name: "Proteins", items: [item("A main", "1 lb", 12, ["Live A"]), item("B main", "1 lb", 9, ["Live B"])]),
                GrocerySection(name: "Produce", items: [item("Shared onion", "1", 4, ["Live A", "Live B"]), item("A side", "1", 5, ["Live A"])])
            ])
        )
        state.plan = plan
        return plan
    }

    private func cleanState() -> AppState {
        for k in [HouseholdConfig.Keys.cachedShelf, HouseholdConfig.Keys.cachedPreferences, HouseholdConfig.Keys.cachedHistory,
                  HouseholdConfig.Keys.cachedPlan, HouseholdConfig.Keys.cachedRecipeBox, HouseholdConfig.Keys.cachedEditDates,
                  HouseholdConfig.Keys.cachedRatings, HouseholdConfig.Keys.cachedKeptRecipes, HouseholdConfig.Keys.cachedFavorites,
                  HouseholdConfig.Keys.cachedPantry] {
            UserDefaults.standard.removeObject(forKey: k)
        }
        let state = AppState()
        var prefs = Preferences.defaults(now: Date())
        prefs.budgetTarget = 100
        state.preferences = prefs
        state.keptRecipes = []; state.favorites = []; state.ratings = [:]; state.pantryItems = []; state.recipeBox = []
        state.pastDinners = []; state.shelf = []; state.phase = .idle
        return state
    }

    func testSwapOnAWeekThatIsNotOnTheShelfReplacesOnlyThatNightAndPatchesGrocery() async {
        let state = cleanState()
        let before = liveWeek(state)
        let cand = shelfRecipe("Shelf Candidate", cuisine: "Greek", protein: "lamb", cost: 7, grocery: [
            ShelfGroceryItem(section: "Proteins", name: "Lamb leg", qty: "1 lb", estPrice: 7, pantry: false),
            ShelfGroceryItem(section: "Produce", name: "shared ONION", qty: "2", estPrice: 1, pantry: false)
        ])
        state.shelf = [cand]
        let onionID = MealPlan.itemID(section: "Produce", item: "Shared onion")
        state.checkedItemIDs = [onionID, "Proteins|B main", "Proteins|A main", "Ghost|item"]

        let ok = await state.swapFromShelf(day: "Monday")
        XCTAssertTrue(ok)
        XCTAssertEqual(state.phase, .idle)
        let plan = state.plan!
        XCTAssertEqual(plan.week[1], before.week[1])
        XCTAssertEqual(plan.recipes[1], before.recipes[1])
        XCTAssertEqual(plan.week[0].title, "Shelf Candidate")
        XCTAssertEqual(plan.recipes[0].day, "Monday")
        let names = plan.grocery.sections.flatMap(\.items).map(\.name)
        XCTAssertFalse(names.contains("A main"))
        XCTAssertFalse(names.contains("A side"))
        XCTAssertTrue(names.contains("B main"))
        XCTAssertTrue(names.contains("Lamb leg"))
        let onion = plan.grocery.sections.flatMap(\.items).first { $0.name == "Shared onion" }!
        XCTAssertEqual(onion.estPrice, 5)
        XCTAssertEqual(onion.qty, "1 + 2")
        XCTAssertEqual(Set(onion.recipes ?? []), ["Live B", "Shelf Candidate"])
        XCTAssertEqual(plan.grocery.estimatedTotal, 9 + 5 + 7)
        XCTAssertTrue(state.checkedItemIDs.contains(onionID))
        XCTAssertTrue(state.checkedItemIDs.contains("Proteins|B main"))
        XCTAssertFalse(state.checkedItemIDs.contains("Proteins|A main"))
        XCTAssertFalse(state.checkedItemIDs.contains("Ghost|item"))
    }

    func testSwapOnANonShelfWeekWithNoCandidateAndNoFallbackChangesNothing() async {
        let state = cleanState()
        let before = liveWeek(state)
        state.shelf = []
        let ok = await state.swapFromShelf(day: "Monday")
        // No shelf, and no relay/subscription in tests: nothing may change,
        // and the caller is told so it can use the live swap as last resort.
        XCTAssertFalse(ok)
        XCTAssertEqual(state.plan, before)
        XCTAssertEqual(state.phase, .idle)
    }

    // MARK: Live budget check

    func testPlanBudgetStatusNamesTheCostliestNightByTaggedShare() {
        let state = cleanState()
        let plan = liveWeek(state)
        // Total 30 vs budget 100: within.
        XCTAssertEqual(state.planBudgetStatus(plan), .withinBudget)
        var over = plan
        over.grocery.estimatedTotal = 130
        // A: 12 + 2 (half of onion) + 5 = 19; B: 9 + 2 = 11.
        let costs = state.nightCosts(of: plan)
        XCTAssertEqual(costs[0], 19, accuracy: 0.001)
        XCTAssertEqual(costs[1], 11, accuracy: 0.001)
        if case .overBudget(let index, let total, let ceiling) = state.planBudgetStatus(over) {
            XCTAssertEqual(index, 0)
            XCTAssertEqual(total, 130)
            XCTAssertEqual(ceiling, 100)
        } else {
            XCTFail("expected overBudget")
        }
        // Pinning A moves the offender to the unpinned night.
        state.keptRecipes = [over.recipes[0]]
        if case .overBudget(let index, _, _) = state.planBudgetStatus(over) { XCTAssertEqual(index, 1) } else { XCTFail("expected overBudget") }
    }
}
