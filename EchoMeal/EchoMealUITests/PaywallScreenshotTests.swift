import XCTest

/// Captures the paywall for App Store Connect's subscription review screenshot.
///
/// Apple wants one image of the screen where the purchase actually happens.
/// There is a chicken and egg problem in getting it: the subscription stays in
/// MISSING_METADATA until the screenshot is uploaded, and a product in that
/// state does not resolve, so on TestFlight `SubscriptionStore.selectedProduct` is nil,
/// PaywallView disables Subscribe and shows "Loading the subscription from the
/// App Store." Screenshotting that would hand the reviewer a dead button.
///
/// The simulator breaks the loop. MealTime.storekit supplies the name, price,
/// and period locally, with no App Store Connect involvement, so the button is
/// live and the price is the real $4.99.
///
/// Run it:
///
///     xcodebuild test -project EchoMeal.xcodeproj -scheme EchoMeal \
///       -destination 'id=<simulator udid>' \
///       -resultBundlePath <path>.xcresult \
///       -only-testing:EchoMealUITests/PaywallScreenshotTests
///
/// then pull the PNG out with
/// `xcrun xcresulttool export attachments --path <path>.xcresult --output-path <dir>`.
///
/// This depends on the scheme's test action carrying the StoreKit configuration,
/// which XcodeGen does not write. See scripts/patch-test-storekit.sh.
final class PaywallScreenshotTests: XCTestCase {

    override func setUp() {
        continueAfterFailure = false
    }

    func testCapturePaywallForAppStoreReview() {
        let app = XCUIApplication()
        app.launch()
        completeOnboardingIfNeeded(app)

        // The gear sits in the Speak tab's trailing toolbar slot. SwiftUI gives
        // an Image(systemName:) button no title, so match on the navigation bar
        // rather than guessing at a label. It is the only button up there.
        let gear = app.navigationBars.buttons.firstMatch
        XCTAssertTrue(gear.waitForExistence(timeout: 30), "the settings gear never appeared")
        gear.tap()

        // Settings opens as a sheet. The subscription section sits below the
        // fold on shorter phones, so scroll if the button is not already up.
        let subscribeRow = app.buttons["Subscribe"]
        if !subscribeRow.waitForExistence(timeout: 10) {
            app.swipeUp()
        }
        XCTAssertTrue(subscribeRow.waitForExistence(timeout: 10), "no Subscribe button in Settings")
        subscribeRow.tap()

        // Wait on the paywall's header rather than on its Subscribe button. The
        // Settings row we just tapped carries the same title and is still in the
        // hierarchy underneath, so a button query here would be ambiguous.
        let header = app.staticTexts["Keep planning dinner"]
        XCTAssertTrue(header.waitForExistence(timeout: 20), "the paywall never appeared")

        // Wait on the buy button becoming enabled, because that is the only
        // thing on this screen that distinguishes a loaded product from a
        // missing one.
        //
        // History worth keeping: every visible string here used to have a
        // hardcoded fallback in SubscriptionStore, displayName to "MealTime
        // Pro Monthly" and displayPrice to "$4.99", so the screen looked
        // right whether or not the App Store had answered. An earlier version
        // of this test waited for the literal "MealTime Pro Monthly", which
        // was the fallback, so it passed when StoreKit had failed and failed
        // when it had worked. Those fallbacks are gone now and the strings
        // are empty until a product loads, but keep asserting on the button:
        // PaywallView drives .disabled off `selectedProduct == nil`, and that
        // is state with no default behind it at all.
        //
        // Scope the query to the container holding the paywall's header. The
        // Settings row that opened this sheet is also titled Subscribe and is
        // still in the hierarchy underneath.
        let paywall = app.otherElements
            .containing(.staticText, identifier: "Keep planning dinner")
            .firstMatch
        let buyButton = paywall.buttons["Subscribe"]
        XCTAssertTrue(buyButton.waitForExistence(timeout: 20), "no Subscribe button on the paywall")

        let enabled = expectation(
            for: NSPredicate(format: "isEnabled == true"),
            evaluatedWith: buyButton
        )
        let loaded = XCTWaiter().wait(for: [enabled], timeout: 45) == .completed

        // Attach the screenshot before asserting. If StoreKit did not answer,
        // the picture of what it looked like is the fastest way to tell why.
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = loaded ? "paywall" : "paywall-product-missing"
        shot.lifetime = .keepAlways
        add(shot)

        XCTAssertTrue(loaded, "Subscribe stayed disabled, so the product never loaded from MealTime.storekit")
        XCTAssertFalse(
            app.staticTexts["Loading the subscription from the App Store."].exists,
            "the paywall still says it is loading, so Subscribe is disabled"
        )
    }

    /// Gets past the first launch cover by actually creating a household.
    ///
    /// This used to be one launch argument, `-householdCode TESTHOME`, which
    /// worked because HouseholdConfig read the code out of UserDefaults and a
    /// `-key value` argument writes the argument domain. It reads the Keychain
    /// now, which no launch argument can reach, and TESTHOME is not a valid
    /// code anyway: they are twenty-six characters and validated before use.
    ///
    /// The tempting fix is a debug hook that lets the code be set from outside
    /// the app. Do not add one. A way to force a known household code from
    /// outside is the exact shape of the ZURISK-KITCHEN hole this app just
    /// spent a release closing, and a hook added for a screenshot is a hook
    /// that ships. Tapping through the real two button flow costs a couple of
    /// seconds and leaves no back door.
    ///
    /// Skipped when the household already exists. The simulator's Keychain
    /// survives app reinstalls, so only the first run on a given simulator
    /// sees onboarding. Erase the simulator if you need the fresh path back.
    private func completeOnboardingIfNeeded(_ app: XCUIApplication) {
        XCTAssertTrue(
            app.wait(for: .runningForeground, timeout: 30),
            "the app never came to the foreground"
        )

        // The cover is presented from onAppear, so it is up on the first
        // render or it is never coming. No need to wait the full launch
        // budget again here.
        let start = app.buttons["Start our household"]
        guard start.waitForExistence(timeout: 10) else { return }
        start.tap()

        // createHousehold generates the code and dismisses on Continue. The
        // CloudKit work it kicks off is in a detached Task and the simulator
        // has no iCloud account, so nothing here waits on the network.
        let cont = app.buttons["Continue"]
        XCTAssertTrue(cont.waitForExistence(timeout: 20), "the new household code never appeared")
        cont.tap()
    }
}
