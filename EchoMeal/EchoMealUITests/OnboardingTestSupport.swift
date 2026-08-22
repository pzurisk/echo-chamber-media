import XCTest

extension XCTestCase {

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
    func completeOnboardingIfNeeded(_ app: XCUIApplication) {
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
