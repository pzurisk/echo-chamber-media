import XCTest

@testable import EchoMeal

/// Two things a live UI test cannot reach without a deployed relay and a
/// real subscription: that plans saved before leftoverYield/leftoverNote
/// existed still decode, and that the web search paragraph only shows up in
/// the system prompt when it was actually asked for.
final class LeftoverAndWebSearchTests: XCTestCase {

    func testOldRecipeJSONWithoutLeftoverYieldStillDecodes() throws {
        let json = """
        { "day": "Monday", "title": "Seared Chicken", "cookTimeMin": 30, "servings": 2,
          "ingredients": [ { "item": "chicken thighs", "qty": "1 lb" } ],
          "steps": [ "Sear the chicken." ] }
        """
        let recipe = try JSONDecoder().decode(Recipe.self, from: Data(json.utf8))
        XCTAssertNil(recipe.leftoverYield, "an absent field should decode to nil, not fail or default to true")
    }

    func testOldWeekEntryJSONWithoutLeftoverNoteStillDecodes() throws {
        let json = """
        { "day": "Monday", "title": "Seared Chicken", "cuisine": "American", "cookTimeMin": 30, "servings": 2 }
        """
        let entry = try JSONDecoder().decode(WeekEntry.self, from: Data(json.utf8))
        XCTAssertNil(entry.leftoverNote)
    }

    func testNewFieldsRoundTrip() throws {
        let recipe = Recipe(
            day: "Monday", title: "Braised Chicken", cookTimeMin: 45, servings: 2,
            ingredients: [Ingredient(item: "chicken thighs", qty: "2 lb")],
            steps: ["Braise."], leftoverYield: true
        )
        let data = try JSONEncoder().encode(recipe)
        let decoded = try JSONDecoder().decode(Recipe.self, from: data)
        XCTAssertEqual(decoded.leftoverYield, true)
    }

    func testSystemPromptOmitsWebSearchParagraphByDefault() {
        let prompt = ClaudeService.systemPrompt(dinners: 5)
        XCTAssertFalse(prompt.contains("Web search, enabled for this plan"))
        // The leftover-pairing rule is always present, search or not.
        XCTAssertTrue(prompt.contains("leftoverYield"))
    }

    func testSystemPromptIncludesWebSearchParagraphWhenEnabled() {
        let prompt = ClaudeService.systemPrompt(dinners: 5, webSearchEnabled: true)
        XCTAssertTrue(prompt.contains("Web search, enabled for this plan"))
    }
}
