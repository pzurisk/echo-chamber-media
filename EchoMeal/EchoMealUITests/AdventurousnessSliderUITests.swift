import XCTest

/// Verifies the adventurousness slider on the Speak tab actually moves and
/// its label updates, driven by accessibility value rather than pixel
/// coordinates (unreliable in this simulator setup).
final class AdventurousnessSliderUITests: XCTestCase {

    override func setUp() {
        continueAfterFailure = false
    }

    func testSliderMovesAndLabelUpdates() {
        let app = XCUIApplication()
        app.launch()
        completeOnboardingIfNeeded(app)

        let speakTab = app.tabBars.buttons["Speak"]
        XCTAssertTrue(speakTab.waitForExistence(timeout: 15), "the Speak tab never appeared")
        speakTab.tap()

        let slider = app.sliders["How adventurous tonight"]
        XCTAssertTrue(slider.waitForExistence(timeout: 10), "no adventurousness slider on the Speak tab")

        // UserDefaults persist across test runs on the same simulator
        // install, so a prior test can leave this at any position. Force it
        // to the middle rather than assuming the Balanced default.
        slider.adjust(toNormalizedSliderPosition: 0.5)
        XCTAssertTrue(
            app.staticTexts["Balanced"].waitForExistence(timeout: 5),
            "slider did not land on Balanced at the midpoint"
        )

        let beforeShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        beforeShot.name = "adventurousness-balanced"
        beforeShot.lifetime = .keepAlways
        add(beforeShot)

        slider.adjust(toNormalizedSliderPosition: 1.0)
        XCTAssertTrue(
            app.staticTexts["Wild card"].waitForExistence(timeout: 5),
            "label never updated to Wild card at the top of the slider"
        )

        let afterShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        afterShot.name = "adventurousness-wild-card"
        afterShot.lifetime = .keepAlways
        add(afterShot)

        slider.adjust(toNormalizedSliderPosition: 0.0)
        XCTAssertTrue(
            app.staticTexts["Familiar"].waitForExistence(timeout: 5),
            "label never updated to Familiar at the bottom of the slider"
        )
    }
}
