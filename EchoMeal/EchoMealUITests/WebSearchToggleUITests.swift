import XCTest

/// Verifies the "Find viral recipes" toggle on the Speak tab flips state and
/// its label updates. Does not exercise an actual plan generation, since
/// that needs a live relay deploy and a real subscription, neither of which
/// this test can assume.
final class WebSearchToggleUITests: XCTestCase {

    override func setUp() {
        continueAfterFailure = false
    }

    func testToggleFlipsLabelAndState() {
        let app = XCUIApplication()
        app.launch()
        completeOnboardingIfNeeded(app)

        let speakTab = app.tabBars.buttons["Speak"]
        XCTAssertTrue(speakTab.waitForExistence(timeout: 15), "the Speak tab never appeared")
        speakTab.tap()

        let toggle = app.buttons["Viral recipe search off"]
        XCTAssertTrue(toggle.waitForExistence(timeout: 10), "no web search toggle on the Speak tab")
        XCTAssertTrue(app.staticTexts["Find viral recipes"].exists, "toggle did not open in the off state")

        toggle.tap()

        let onToggle = app.buttons["Viral recipe search on"]
        XCTAssertTrue(onToggle.waitForExistence(timeout: 5), "toggle never flipped to the on accessibility label")
        XCTAssertTrue(app.staticTexts["Finding viral recipes"].exists, "label never updated to Finding viral recipes")

        let onShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        onShot.name = "web-search-toggle-on"
        onShot.lifetime = .keepAlways
        add(onShot)

        onToggle.tap()
        XCTAssertTrue(
            app.buttons["Viral recipe search off"].waitForExistence(timeout: 5),
            "toggle never flipped back off"
        )
        XCTAssertTrue(app.staticTexts["Find viral recipes"].exists, "label never reverted")
    }
}
