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
/// Covered: both product IDs resolve, the three things guideline 3.1.2
/// requires on the purchase screen (name, price, billing period) are present
/// and non-empty on every plan, the annual savings badge is arithmetic rather
/// than a hardcoded claim, Settings describes the entitlement rather than the
/// paywall's selection, and no introductory offer has appeared on either plan.
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
/// # These tests read App Store Connect, not MealTime.storekit
///
/// Established 2026-08-17 by probe, because it is not obvious and it makes
/// the file look broken: the names, descriptions, and prices these tests see
/// come from App Store Connect over the network, **not** from the local
/// `MealTime.storekit`, even though the scheme points at that file.
///
/// The probe: the annual's `displayName` in the file was set to
/// "ZZPROBE Annual" and its `displayPrice` to "11.11". `Product.displayName`
/// still returned "Annual" and the savings figure still computed against
/// $39.99. Erasing the simulator first changed nothing, so it is not a
/// device cache. The file is a synced configuration and its localizations
/// and prices are inert.
///
/// Two consequences. First, this is stronger coverage than it looks: these
/// assertions genuinely prove the IDs exist in App Store Connect, which a
/// purely local file never could. Second, **editing MealTime.storekit to fix
/// a failing assertion here will not work.** Change App Store Connect. And
/// `testTheAnnualSavingsBadgeIsTrue` pins 33, so a real price change in App
/// Store Connect is supposed to fail it.
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
    /// IDs in `SubscriptionStore`, in `MealTime.storekit`, and in App Store
    /// Connect are not all the same strings.
    func testBothProductIdsInTheCodeActuallyResolve() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()

        let resolved = Set(store.products.map(\.id))
        XCTAssertEqual(
            resolved,
            SubscriptionStore.productIDs,
            "Missing: \(SubscriptionStore.productIDs.subtracting(resolved)). Every ID has to be identical in SubscriptionStore.swift, MealTime.storekit, Proxy/worker.js, and App Store Connect."
        )
    }

    /// Annual leads the picker. It is the plan being promoted, and the first
    /// row is the one people read.
    func testAnnualIsListedFirstAndSelectedByDefault() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()

        XCTAssertEqual(store.products.first?.id, SubscriptionStore.annualProductID)
        XCTAssertEqual(store.selectedProductID, SubscriptionStore.annualProductID)
    }

    /// Guideline 3.1.2 wants the subscription's name, its length, and its
    /// price all visible before anyone can buy. With two plans on screen that
    /// has to hold for both rows. The paywall reads all of it from StoreKit
    /// rather than hardcoding it, so an empty value here is a blank label on
    /// the purchase screen.
    ///
    /// These assertions are only meaningful because `displayName` and
    /// `displayPrice` have no placeholder behind them. When they fell back to
    /// "MealTime Pro Monthly" and "$4.99", a non-empty result proved nothing.
    func testEveryPlanHasANamePriceAndPeriod() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()
        XCTAssertFalse(store.products.isEmpty, "Nothing resolved, so the rest of this test is vacuous.")

        for product in store.products {
            store.selectedProductID = product.id

            XCTAssertFalse(store.displayName.isEmpty, "\(product.id) would show a blank title.")
            XCTAssertFalse(store.displayPrice.isEmpty, "\(product.id) would show a blank price.")

            let period = try XCTUnwrap(product.subscription?.subscriptionPeriod)
            XCTAssertEqual(period.value, 1, "\(product.id) is not a single billing unit, so the paywall's period text is a lie.")

            switch product.id {
            case SubscriptionStore.annualProductID:
                XCTAssertEqual(period.unit, .year)
                XCTAssertEqual(store.billingPeriodDescription, "billed yearly")
            case SubscriptionStore.monthlyProductID:
                XCTAssertEqual(period.unit, .month)
                XCTAssertEqual(store.billingPeriodDescription, "billed monthly")
            default:
                XCTFail("Unexpected product \(product.id) with no period expectation.")
            }
        }
    }

    /// The savings badge on the annual row is a price claim on a purchase
    /// screen, so it has to be arithmetic rather than a hardcoded number.
    /// At $39.99 against twelve months of $4.99 the honest figure is 33.
    func testTheAnnualSavingsBadgeIsTrue() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()

        let saved = try XCTUnwrap(store.annualSavingsPercent, "No savings figure, so the badge would not render.")
        XCTAssertEqual(saved, 33)
    }

    /// Settings has to describe the plan that was bought. Reading the
    /// paywall's selection there would tell an annual subscriber they are
    /// billed monthly, which is a false statement to a paying customer.
    func testSettingsCopyFollowsTheEntitlementNotTheSelection() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()

        // No entitlement in a unit test (SKTestSession cannot buy on this
        // Mac, see the note above), so this pins the no-price fallback: it
        // must never print a number that might belong to the other plan.
        store.selectedProductID = SubscriptionStore.annualProductID
        XCTAssertFalse(store.entitlementSummary.contains("39.99"))
        XCTAssertFalse(store.entitlementSummary.contains("billed"))
        XCTAssertTrue(store.entitlementSummary.contains("\(SubscriptionStore.monthlyPlanAllowance) meal plans a month"))
    }

    /// No free trial and no introductory offer on either plan, deliberately.
    /// A trial hands a month of API spend to anyone who cancels on day one.
    /// If this fails, someone added an offer and the margin behind these
    /// prices no longer holds.
    func testThereIsNoIntroductoryOfferOnEitherPlan() async throws {
        let store = SubscriptionStore()
        await store.loadProducts()
        XCTAssertFalse(store.products.isEmpty, "Nothing resolved, so the rest of this test is vacuous.")

        for product in store.products {
            XCTAssertNil(
                product.subscription?.introductoryOffer,
                "An introductory offer appeared on \(product.id). That was a deliberate no."
            )
        }
    }
}
