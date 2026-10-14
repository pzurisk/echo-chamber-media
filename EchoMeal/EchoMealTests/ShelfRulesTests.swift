import XCTest

@testable import EchoMeal

/// QA (Q) checks for the 2026-10-14 shelf rebuild, written against
/// CONTRACT.md sections 3, 4 and 6. Pure functions only: no AppState, no
/// network, no clock reads (a fixed `today` and a UTC calendar).
final class ShelfRulesTests: XCTestCase {

    // MARK: - Fixtures

    private var calendar: Calendar {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = TimeZone(identifier: "UTC")!
        return c
    }

    /// 2026-10-14 17:00 UTC, the contract's createdAt.
    private let today = Date(timeIntervalSinceReferenceDate: 813_690_000)

    private func daysAgo(_ n: Int) -> Date {
        calendar.date(byAdding: .day, value: -n, to: today)!
    }

    private func prefs(proteinsOff: [String] = [], ingredientsOff: [String] = []) -> Preferences {
        var p = Preferences.defaults(now: today)
        p.proteinsOff = proteinsOff
        p.ingredientsOff = ingredientsOff
        return p
    }

    private func shelfRecipe(_ title: String, cuisine: String, protein: String, cost: Double,
                             ingredients: [String]? = nil, groceryName: String? = nil) -> ShelfRecipe {
        let items = ingredients ?? [protein, "onion", "rice"]
        let recipe = Recipe(day: "", title: title, cookTimeMin: 30, servings: 2,
                            ingredients: items.map { Ingredient(item: $0, qty: "1") },
                            steps: ["Prep so it cooks evenly.", "Sear so it browns.", "Sauce so it is bright.", "Rest so it stays juicy."])
        let line = ShelfGroceryItem(section: "Proteins", name: groceryName ?? "\(title) protein", qty: "1 lb",
                                    estPrice: cost, pantry: false)
        return ShelfRecipe(recipe: recipe, cuisine: cuisine, primaryProtein: protein, method: "sear",
                           ingredientKeys: items, groceryItems: [line], source: "topup", now: today)
    }

    // MARK: - (a) Old plan JSON and itemID

    private let oldPlanJSON = """
    {
      "week": [
        {"day": "Monday", "title": "Sheet Pan Gochujang Chicken Thighs", "cuisine": "Korean", "cookTimeMin": 40, "servings": 2},
        {"day": "Tuesday", "title": "Lemon Garlic Shrimp Orzo", "cuisine": "Mediterranean", "cookTimeMin": 30, "servings": 2}
      ],
      "recipes": [
        {"day": "Monday", "title": "Sheet Pan Gochujang Chicken Thighs", "cookTimeMin": 40, "servings": 2,
         "ingredients": [{"item": "Bone-in chicken thighs", "qty": "1.5 lb"}, {"item": "Gochujang", "qty": "3 tbsp"}, {"item": "Jasmine rice", "qty": "1 cup"}, {"item": "Broccoli", "qty": "2 crowns"}, {"item": "Rice vinegar", "qty": "1 tbsp"}],
         "steps": ["Heat the oven to 450 F so the skin renders and crisps.", "Toss thighs with gochujang and vinegar, then rest 10 minutes so the marinade grips.", "Roast thighs and broccoli on one pan 25 minutes for browned edges.", "Steam rice while the pan roasts so everything lands together."]},
        {"day": "Tuesday", "title": "Lemon Garlic Shrimp Orzo", "cookTimeMin": 30, "servings": 2,
         "ingredients": [{"item": "Large shrimp", "qty": "1 lb"}, {"item": "Orzo", "qty": "1 cup"}, {"item": "Lemon", "qty": "2"}, {"item": "Baby spinach", "qty": "5 oz"}, {"item": "Garlic", "qty": "4 cloves"}],
         "steps": ["Toast the orzo in olive oil 2 minutes for a nutty base.", "Simmer orzo in stock 9 minutes, stirring so it turns creamy.", "Sear shrimp 90 seconds a side so they stay snappy.", "Fold in spinach and lemon off the heat to keep the acid bright."]}
      ],
      "grocery": {"budgetTarget": 100, "estimatedTotal": 37.5, "pantryCredit": 4.0,
        "notes": "Under target. Rice, olive oil, and garlic assumed on hand.",
        "sections": [
          {"name": "Proteins", "items": [
            {"name": "Bone-in chicken thighs", "qty": "1.5 lb", "estPrice": 7.5, "pantry": false},
            {"name": "Large shrimp", "qty": "1 lb", "estPrice": 11.0, "pantry": false}]},
          {"name": "Produce", "items": [
            {"name": "Broccoli", "qty": "2 crowns", "estPrice": 3.5, "pantry": false},
            {"name": "Baby spinach", "qty": "5 oz", "estPrice": 3.0, "pantry": false},
            {"name": "Lemon", "qty": "2", "estPrice": 1.5, "pantry": false},
            {"name": "Garlic", "qty": "1 head", "estPrice": 1.0, "pantry": true}]},
          {"name": "Pantry", "items": [
            {"name": "Gochujang", "qty": "1 tub", "estPrice": 5.5, "pantry": false},
            {"name": "Orzo", "qty": "1 box", "estPrice": 2.5, "pantry": false},
            {"name": "Jasmine rice", "qty": "1 cup", "estPrice": 3.0, "pantry": true},
            {"name": "Rice vinegar", "qty": "1 bottle", "estPrice": 3.0, "pantry": false}]}
        ]}
    }
    """

    func testOldFormatPlanDecodesAndItemIDIsUnchanged() throws {
        let plan = try JSONDecoder().decode(MealPlan.self, from: Data(oldPlanJSON.utf8))
        XCTAssertEqual(plan.week.count, 2)
        XCTAssertEqual(plan.recipes.count, 2)
        XCTAssertNil(plan.week[0].leftoverNote)
        XCTAssertNil(plan.recipes[0].leftoverYield)
        XCTAssertNil(plan.grocery.sections[0].items[0].recipes)
        XCTAssertEqual(plan.grocery.estimatedTotal, 37.5)
        XCTAssertEqual(MealPlan.itemID(section: "Proteins", item: "Large shrimp"), "Proteins|Large shrimp")
        XCTAssertTrue(plan.allItemIDs.contains("Produce|Garlic"))
        XCTAssertEqual(plan.pantryItemIDs, ["Produce|Garlic", "Pantry|Jasmine rice"])
        XCTAssertEqual(plan.allItemIDs.count, 10)
        // Round trip keeps every itemID.
        let again = try JSONDecoder().decode(MealPlan.self, from: JSONEncoder().encode(plan))
        XCTAssertEqual(again.allItemIDs, plan.allItemIDs)
    }

    func testOldPastDinnerWithoutNewFieldsDecodes() throws {
        let json = #"[{"title": "Meatloaf", "cuisine": "American", "date": 813000000}]"#
        let list = try JSONDecoder().decode([PastDinner].self, from: Data(json.utf8))
        XCTAssertEqual(list.count, 1)
        XCTAssertNil(list[0].cooked)
        XCTAssertNil(list[0].shelfID)
    }

    func testContractShelfRecipeFixtureDecodes() throws {
        let json = """
        {"id": "3F6B2C1A-9D4E-4B7A-8C21-5E0A7D91F4B3", "createdAt": 813690000, "cuisine": "American", "primaryProtein": "pork",
         "method": "sear", "source": "topup", "estCost": 14.5, "tags": [], "ingredientKeys": ["pork chop", "apple", "cabbage", "potato", "cider vinegar"],
         "groceryItems": [
           {"estPrice": 8.5, "name": "Bone-in pork chops", "pantry": false, "qty": "2", "section": "Proteins"},
           {"estPrice": 1, "name": "Green apple", "pantry": false, "qty": "1", "section": "Produce"},
           {"estPrice": 2, "name": "Savoy cabbage", "pantry": false, "qty": "1/2 head", "section": "Produce"},
           {"estPrice": 3, "name": "Baby potatoes", "pantry": false, "qty": "1 lb", "section": "Produce"},
           {"estPrice": 3, "name": "Cider vinegar", "pantry": true, "qty": "1 bottle", "section": "Sauces"}],
         "recipe": {"day": "", "title": "Pan-Seared Pork Chops with Apple Slaw", "cookTimeMin": 35, "servings": 2,
           "ingredients": [{"item": "Bone-in pork chops", "qty": "2"}, {"item": "Green apple", "qty": "1"}],
           "steps": ["a", "b", "c", "d"]}}
        """
        let s = try JSONDecoder().decode(ShelfRecipe.self, from: Data(json.utf8))
        XCTAssertEqual(s.recipe.day, "")
        XCTAssertEqual(ShelfRecipe.cost(of: s.groceryItems), 14.5)
        XCTAssertNil(s.servedAt)
        XCTAssertEqual(s.createdAt, today)
    }

    // MARK: - (b) Fish off means zero fish

    /// 20 recipes, 8 of them fish (40 percent), cuisines spread so five
    /// non-fish picks always fit the variety rules.
    private func fishHeavyShelf() -> [ShelfRecipe] {
        let cuisines = ShelfVocab.cuisines
        var shelf: [ShelfRecipe] = []
        for i in 0..<8 {
            shelf.append(shelfRecipe("Fish Dish \(i)", cuisine: cuisines[i], protein: "fish", cost: 10,
                                     ingredients: ["salmon", "lemon", "rice"]))
        }
        let others = ["chicken", "beef", "pork", "turkey", "tofu", "beans"]
        for i in 0..<12 {
            shelf.append(shelfRecipe("Land Dish \(i)", cuisine: cuisines[(i + 4) % cuisines.count], protein: others[i % others.count], cost: 10))
        }
        return shelf
    }

    func testFishOffGivesZeroFishAcrossFiftySeeds() {
        let shelf = fishHeavyShelf()
        XCTAssertEqual(shelf.filter { $0.primaryProtein == "fish" }.count * 10, shelf.count * 4)
        let p = prefs(proteinsOff: ["Fish"])
        var fishPicks = 0
        var totalPicks = 0
        for seed in UInt64(0)..<UInt64(60) {
            let result = ShelfRules.pickWeek(count: 5, shelf: shelf, locked: [], history: [], ratings: [:], favoriteTitles: [],
                                             prefs: p, budgetTarget: 1000, today: today, calendar: calendar, seed: seed)
            XCTAssertEqual(result.picks.count, 5)
            XCTAssertEqual(result.shortfall, 0)
            fishPicks += result.picks.filter { $0.primaryProtein == "fish" }.count
            totalPicks += result.picks.count
        }
        XCTAssertEqual(fishPicks, 0)
        XCTAssertEqual(totalPicks, 300)
        for s in shelf where s.primaryProtein == "fish" {
            XCTAssertEqual(ShelfRules.eligibility(of: s, shelf: shelf, history: [], ratings: [:], favoriteTitles: [], prefs: p,
                                                  today: today, calendar: calendar), .offProtein)
        }
    }

    /// Control: the same shelf with nothing off does pick fish, so the
    /// zero above is the filter working and not a shelf that never would.
    func testControlFishOnDoesPickFish() {
        let shelf = fishHeavyShelf()
        var fishPicks = 0
        for seed in UInt64(0)..<UInt64(60) {
            let result = ShelfRules.pickWeek(count: 5, shelf: shelf, locked: [], history: [], ratings: [:], favoriteTitles: [],
                                             prefs: prefs(), budgetTarget: 1000, today: today, calendar: calendar, seed: seed)
            fishPicks += result.picks.filter { $0.primaryProtein == "fish" }.count
        }
        XCTAssertGreaterThan(fishPicks, 0)
    }

    func testWeekOverrideTurnsFishOffUntilItExpires() {
        var p = prefs()
        p.weekOverride = WeekOverride(until: calendar.date(byAdding: .day, value: 3, to: today)!, proteinsOff: ["fish"], ingredientsOff: [])
        let fish = shelfRecipe("Salmon Bowl", cuisine: "Japanese", protein: "fish", cost: 10)
        XCTAssertEqual(ShelfRules.eligibility(of: fish, shelf: [fish], history: [], ratings: [:], favoriteTitles: [], prefs: p,
                                              today: today, calendar: calendar), .offProtein)
        let later = calendar.date(byAdding: .day, value: 4, to: today)!
        XCTAssertEqual(ShelfRules.eligibility(of: fish, shelf: [fish], history: [], ratings: [:], favoriteTitles: [], prefs: p,
                                              today: later, calendar: calendar), .eligible)
    }

    // MARK: - (c) Cooldowns: favorite 21 days, otherwise 14

    private func eligibilityAfter(days: Int, favorite: Bool) -> ShelfEligibility {
        let meatloaf = shelfRecipe("Meatloaf", cuisine: "American", protein: "beef", cost: 12)
        let history = [PastDinner(title: "Meatloaf", cuisine: "American", date: daysAgo(days), cooked: nil, shelfID: nil)]
        return ShelfRules.eligibility(of: meatloaf, shelf: [meatloaf], history: history, ratings: [:],
                                      favoriteTitles: favorite ? ["meatloaf"] : [], prefs: prefs(), today: today, calendar: calendar)
    }

    func testFavoriteMeatloafCooldown() {
        XCTAssertEqual(prefs().favoriteCooldownDays, 21)
        XCTAssertEqual(eligibilityAfter(days: 20, favorite: true), .titleCooldown)
        XCTAssertEqual(eligibilityAfter(days: 21, favorite: true), .titleCooldown)
        XCTAssertEqual(eligibilityAfter(days: 22, favorite: true), .eligible)
    }

    func testNonFavoriteCooldown() {
        XCTAssertEqual(prefs().cooldownDays, 14)
        XCTAssertEqual(eligibilityAfter(days: 14, favorite: false), .titleCooldown)
        XCTAssertEqual(eligibilityAfter(days: 15, favorite: false), .eligible)
    }

    /// A shelf pick that was planned but never cooked stops blocking after a week.
    func testPlannedNotCookedStopsBlockingAfterSevenDays() {
        let s = shelfRecipe("Birria Tacos", cuisine: "Mexican", protein: "beef", cost: 15)
        func at(_ d: Int) -> ShelfEligibility {
            let h = [PastDinner(title: "Birria Tacos", cuisine: "Mexican", date: daysAgo(d), cooked: false, shelfID: s.id)]
            return ShelfRules.eligibility(of: s, shelf: [s], history: h, ratings: [:], favoriteTitles: [], prefs: prefs(),
                                          today: today, calendar: calendar)
        }
        XCTAssertEqual(at(6), .titleCooldown)
        XCTAssertEqual(at(8), .eligible)
    }

    // MARK: - (d) Budget: exactly one pick changes

    func testEnforceBudgetSwapsOnlyTheCostliestPick() {
        let picks = [
            shelfRecipe("P0", cuisine: "Italian", protein: "chicken", cost: 20),
            shelfRecipe("P1", cuisine: "Mexican", protein: "beef", cost: 20),
            shelfRecipe("P2", cuisine: "Thai", protein: "pork", cost: 20),
            shelfRecipe("P3", cuisine: "Japanese", protein: "tofu", cost: 20),
            shelfRecipe("P4", cuisine: "Indian", protein: "turkey", cost: 30)
        ]
        let pool = [
            shelfRecipe("Not cheaper", cuisine: "French", protein: "beans", cost: 30),
            shelfRecipe("Cuisine clash", cuisine: "Italian", protein: "beans", cost: 10),
            shelfRecipe("Fits", cuisine: "Greek", protein: "beans", cost: 12),
            shelfRecipe("Also fits", cuisine: "Spanish", protein: "beans", cost: 5)
        ]
        let out = ShelfRules.enforceBudget(picks: picks, locked: [], pool: pool, ceiling: 100)
        let changed = zip(picks, out.picks).filter { $0.0 != $0.1 }.count
        XCTAssertEqual(changed, 1)
        XCTAssertEqual(out.picks.count, 5)
        XCTAssertEqual(Array(out.picks.prefix(4)), Array(picks.prefix(4)))
        XCTAssertEqual(out.picks[4].recipe.title, "Fits")
        let total = out.picks.reduce(0.0) { $0 + $1.estCost }
        XCTAssertLessThanOrEqual(total, 100)
        XCTAssertEqual(out.budget, .withinBudget)
    }

    func testEnforceBudgetSkipsLockedAndReportsWhenStuck() {
        let picks = [
            shelfRecipe("P0", cuisine: "Italian", protein: "chicken", cost: 20),
            shelfRecipe("P1", cuisine: "Mexican", protein: "beef", cost: 25),
            shelfRecipe("Locked", cuisine: "Indian", protein: "turkey", cost: 60)
        ]
        let out = ShelfRules.enforceBudget(picks: picks, locked: [picks[2].id], pool: [], ceiling: 100)
        XCTAssertEqual(out.picks, picks)
        XCTAssertEqual(out.budget, .overBudget(offenderIndex: 1, total: 105, ceiling: 100))
    }

    // MARK: - (e) Grocery merge

    func testBuildGroceryMergesSharedGarlicAndExcludesPantryFromTotal() {
        let noodles = ShelfRecipe(
            recipe: Recipe(day: "", title: "Garlic Noodles", cookTimeMin: 25, servings: 2,
                           ingredients: [Ingredient(item: "Garlic", qty: "1 head")], steps: ["a", "b", "c", "d"]),
            cuisine: "Vietnamese", primaryProtein: "none", method: "stirfry", ingredientKeys: ["garlic", "noodle"],
            groceryItems: [
                ShelfGroceryItem(section: "Produce", name: "Garlic", qty: "1 head", estPrice: 1.00, pantry: false),
                ShelfGroceryItem(section: "Pantry", name: "Olive oil", qty: "1 bottle", estPrice: 6.00, pantry: true)
            ], source: "topup", now: today)
        let toum = ShelfRecipe(
            recipe: Recipe(day: "", title: "Toum Chicken", cookTimeMin: 40, servings: 2,
                           ingredients: [Ingredient(item: "garlic", qty: "3 cloves")], steps: ["a", "b", "c", "d"]),
            cuisine: "Middle Eastern", primaryProtein: "chicken", method: "roast", ingredientKeys: ["chicken", "garlic"],
            groceryItems: [
                ShelfGroceryItem(section: "Produce", name: "garlic ", qty: "3 cloves", estPrice: 0.50, pantry: false),
                ShelfGroceryItem(section: "Proteins", name: "Chicken thighs", qty: "1 lb", estPrice: 5.00, pantry: false)
            ], source: "topup", now: today)

        let g = ShelfRules.buildGrocery(picks: [noodles, toum], budgetTarget: 100)
        XCTAssertEqual(g.sections.map(\.name), ["Proteins", "Produce", "Pantry"])
        let produce = g.sections.first { $0.name == "Produce" }!
        XCTAssertEqual(produce.items.count, 1)
        let garlic = produce.items[0]
        XCTAssertEqual(garlic.name, "Garlic")
        XCTAssertEqual(garlic.estPrice, 1.5, accuracy: 0.0001)
        XCTAssertEqual(garlic.qty, "1 head + 3 cloves")
        XCTAssertEqual(garlic.recipes, ["Garlic Noodles", "Toum Chicken"])
        XCTAssertFalse(garlic.pantry)
        XCTAssertEqual(g.estimatedTotal, 6.5, accuracy: 0.0001)
        XCTAssertEqual(g.pantryCredit, 6.0, accuracy: 0.0001)
        XCTAssertEqual(g.budgetTarget, 100)
        XCTAssertEqual(g.notes, "Built from the shelf")

        let plan = MealPlan(week: [], recipes: [], grocery: g)
        XCTAssertTrue(plan.allItemIDs.contains("Produce|Garlic"))
        XCTAssertEqual(plan.pantryItemIDs, ["Pantry|Olive oil"])
    }

    func testBuildGroceryMixedPantryFlagIsNotPantry() {
        let a = shelfRecipe("A", cuisine: "Thai", protein: "tofu", cost: 0)
        var b = shelfRecipe("B", cuisine: "Korean", protein: "beef", cost: 0)
        var aa = a
        aa.groceryItems = [ShelfGroceryItem(section: "Sauces", name: "Soy sauce", qty: "1 bottle", estPrice: 3, pantry: true)]
        b.groceryItems = [ShelfGroceryItem(section: "Sauces", name: "Soy Sauce", qty: "2 tbsp", estPrice: 3, pantry: false)]
        let g = ShelfRules.buildGrocery(picks: [aa, b], budgetTarget: 50)
        let line = g.sections[0].items[0]
        XCTAssertEqual(g.sections[0].items.count, 1)
        XCTAssertFalse(line.pantry)
        XCTAssertEqual(g.estimatedTotal, 6, accuracy: 0.0001)
        XCTAssertEqual(g.pantryCredit, 0, accuracy: 0.0001)
    }

    // MARK: - (f) matchesOff word boundaries

    func testEggNeverMatchesEggplant() {
        XCTAssertFalse(ShelfRules.matchesOff(term: "egg", in: ["eggplant"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "egg", in: ["Eggplant Parmesan", "Japanese eggplants"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "egg", in: ["2 large eggs"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "Egg", in: ["Egg yolk"]))
        XCTAssertTrue(ShelfRules.matchesOff(term: "cilantro", in: ["Fresh Cilantro, chopped"]))
        XCTAssertFalse(ShelfRules.matchesOff(term: "", in: ["anything"]))

        let eggplant = shelfRecipe("Miso Eggplant", cuisine: "Japanese", protein: "none", cost: 8,
                                   ingredients: ["eggplant", "miso", "rice"], groceryName: "Japanese eggplant")
        XCTAssertEqual(ShelfRules.eligibility(of: eggplant, shelf: [eggplant], history: [], ratings: [:], favoriteTitles: [],
                                              prefs: prefs(ingredientsOff: ["egg"]), today: today, calendar: calendar), .eligible)
        let omelet = shelfRecipe("Rolled Omelet", cuisine: "Korean", protein: "eggs", cost: 6,
                                 ingredients: ["egg", "scallion", "rice"])
        XCTAssertEqual(ShelfRules.eligibility(of: omelet, shelf: [omelet], history: [], ratings: [:], favoriteTitles: [],
                                              prefs: prefs(ingredientsOff: ["egg"]), today: today, calendar: calendar), .offIngredient)
    }
}
