import StoreKit
import StoreKitTest
import XCTest

@testable import EchoMeal

/// Checks the parts of the paid-subscription setup that can actually fail
/// silently.
///
/// Why this exists: everything else about the subscription was verified by
/// reading files. The expensive failure here is a product ID that does not
/// resolve. It does not break the build, it does not throw, and it does not
/// log anything. `Product.products(for:)` simply returns an empty array, the
/// paywall's buy button stays disabled forever, and App Review rejects the
/// app under 2.1 for not working. These tests fail loudly instead.
///
/// # What this file covers, and what it deliberately does not
///
/// Covered: the product ID resolves, and the three things guideline 3.1.2
/// requires on the purchase screen (name, price, billing period) are all
/// present and non-empty, and no introductory offer has appeared.
///
/// Not covered, because it cannot be, on this machine as of 2026-08-16:
///
/// 1. `Product.purchase()`. It presents App Store UI from a live window
///    scene. In a hosted unit test it never returns, and it hung the whole
///    suite until the per-test timeout killed it.
/// 2. Every `SKTestSession` method that changes state: `buyProduct`,
///    `expireSubscription`, `refundTransaction`. All of them fail with
///    `StoreKitError.notEntitled` (domain `StoreKit.StoreKitError`, code 5),
///    and `session.storefront` reads back empty even after being assigned.
///    Reads work, writes do not.
///
/// That second one was chased properly before being written off. It is not
/// the scheme's StoreKit configuration conflicting with the session (removing
/// it from the Run action changed nothing), and it is not the configuration
/// looking like an App Store Connect synced file (blanking
/// `_applicationInternalID` changed nothing). It is the simulator on this
/// Mac. Do not spend another hour on it without a new idea.
///
/// So the purchase flow itself is verified by hand on TestFlight, per
/// Section 2 of AppStoreSubmission.md, and the relay half of the story is
/// covered by `Proxy/test/verify-test.mjs`, which does run.
@MainActor
final class SubscriptionStoreTests: XCTestCase {

    private var session: SKTestSession!

    override func setUpWithError() throws {
        try super.setUpWithError()
        // Named without the extension. MealTime.storekit is a resource of
        // this test bundle, not of the app, so it still never ships.
        session = try SKTestSession(configurationFileNamed: "MealTime")
        session.disableDialogs = true
        session.askToBuyEnabled = false
    }

    override func tearDownWithError() throws {
        session = nil
        try super.tearDownWithError()
    }

    /// The single most expensive mistake available here. If this fails, the
    /// ID in `SubscriptionStore`, in `MealTime.storekit`, and in App Store
    /// Connect are not all the same string.
    func testTheProductIdInTheCodeActuallyResolves() async throws {
        let store = SubscriptionStore()
        await store.loadProduct()

        let product = try XCTUnwrap(
            store.product,
            "Nothing came back for \(SubscriptionStore.productID). That ID has to be identical in SubscriptionStore.swift, MealTime.storekit, Proxy/worker.js, and App Store Connect."
        )
        XCTAssertEqual(product.id, SubscriptionStore.productID)
    }

    /// Guideline 3.1.2 wants the subscription's name, its length, and its
    /// price all visible before anyone can buy. The paywall reads all three
    /// from StoreKit rather than hardcoding them, so an empty value here is a
    /// blank label on the purchase screen.
    func testThePaywallHasANamePriceAndMonthlyPeriod() async throws {
        let store = SubscriptionStore()
        await store.loadProduct()
        let product = try XCTUnwrap(store.product)

        XCTAssertFalse(store.displayName.isEmpty, "The paywall would show a blank title.")
        XCTAssertFalse(store.displayPrice.isEmpty, "The paywall would show a blank price.")

        let period = try XCTUnwrap(product.subscription?.subscriptionPeriod)
        XCTAssertEqual(period.unit, .month)
        XCTAssertEqual(period.value, 1, "The paywall says 'per month' in plain text, so anything else makes it a lie.")
    }

    /// No free trial and no introductory offer, deliberately. A trial hands a
    /// month of API spend to anyone who cancels on day one. If this fails,
    /// someone added an offer and the margin behind the $4.99 price no longer
    /// holds.
    func testThereIsNoIntroductoryOffer() async throws {
        let store = SubscriptionStore()
        await store.loadProduct()
        let product = try XCTUnwrap(store.product)

        XCTAssertNil(
            product.subscription?.introductoryOffer,
            "An introductory offer appeared. That was a deliberate no."
        )
    }
}
