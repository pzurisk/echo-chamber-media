import XCTest

/// Verifies the freeform grocery item flow end to end through the real UI:
/// add an item with no recipe behind it, see it tagged and checkable like
/// any other row, check it off, then remove it.
final class GroceryListUITests: XCTestCase {

    override func setUp() {
        continueAfterFailure = false
    }

    func testAddCheckAndRemoveFreeformItem() {
        let app = XCUIApplication()
        app.launch()
        completeOnboardingIfNeeded(app)

        let listTab = app.tabBars.buttons["List"]
        XCTAssertTrue(listTab.waitForExistence(timeout: 15), "the List tab never appeared")
        listTab.tap()

        let addButton = app.buttons["Add item"]
        XCTAssertTrue(addButton.waitForExistence(timeout: 10), "no Add item button on the grocery list")
        addButton.tap()

        let nameField = app.textFields["Item, like paper towels"]
        XCTAssertTrue(nameField.waitForExistence(timeout: 10), "no name field on the add item sheet")
        nameField.tap()
        nameField.typeText("Dog food")

        let confirmAdd = app.navigationBars["Add Item"].buttons["Add"]
        XCTAssertTrue(confirmAdd.waitForExistence(timeout: 5), "no Add button on the sheet")
        confirmAdd.tap()

        XCTAssertTrue(
            app.staticTexts["Dog food"].waitForExistence(timeout: 10),
            "freeform item never appeared on the list"
        )
        XCTAssertTrue(
            app.staticTexts["Added by you"].waitForExistence(timeout: 5),
            "no source tag on the freeform item"
        )

        let addedShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        addedShot.name = "freeform-item-added"
        addedShot.lifetime = .keepAlways
        add(addedShot)

        // The whole row is one button. Freeform items carry no qty, so the
        // accessibility label GroceryRow gives it is just the name.
        let row = app.buttons["Dog food"]
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the row is not a tappable button")
        XCTAssertEqual(row.value as? String, "not checked")
        row.tap()
        XCTAssertEqual(row.value as? String, "checked")
        // Give the icon swap and the confetti a beat to actually paint
        // before the screenshot, so the picture is not a mid-render artifact.
        Thread.sleep(forTimeInterval: 1.0)

        let checkedShot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        checkedShot.name = "freeform-item-checked"
        checkedShot.lifetime = .keepAlways
        add(checkedShot)

        row.press(forDuration: 1.0)
        let remove = app.buttons["Remove"]
        XCTAssertTrue(remove.waitForExistence(timeout: 5), "no Remove action in the context menu")
        remove.tap()

        XCTAssertFalse(
            app.staticTexts["Dog food"].waitForExistence(timeout: 5),
            "freeform item was not removed"
        )
    }
}
