import Foundation
import StoreKit

/// Owns the MealTime subscription: what it costs, whether this phone has it,
/// and the identifier the relay counts generations against.
///
/// Why a subscription exists at all: every plan is a Claude call that costs
/// real money, and the relay (see Proxy/worker.js) refuses any request that
/// does not carry a subscriber's transaction ID. Without this file the app
/// cannot plan anything.
///
/// The transaction ID sent to the relay is `Transaction.originalID`, which
/// stays the same across every renewal of one subscription. Using the
/// per-renewal `id` instead would silently hand the subscriber a fresh
/// allowance every month a renewal posted, which is not what they bought.
///
/// Verification happens twice, on purpose. On this device
/// `Transaction.currentEntitlements` yields `VerificationResult` values that
/// Apple has already checked against its signing keys, so an unverified
/// result is dropped rather than trusted. On the relay the same ID is checked
/// again against Apple's App Store Server API before a single token is spent,
/// because the header is just a string and the app token that accompanies it
/// ships inside every copy of the .ipa. Neither check is redundant: the first
/// keeps this phone honest about what it shows, the second keeps a repackaged
/// build from spending Billy's money.
@MainActor
final class SubscriptionStore: ObservableObject {

    /// The two plans, which must match App Store Connect exactly. A typo here
    /// does not fail the build, it just makes the product nil and the paywall
    /// unbuyable, so check this first if the paywall looks empty.
    ///
    /// These are the real IDs from App Store Connect, in subscription group
    /// "MealTime Pro" (22310219). App Store Connect product IDs are permanent
    /// and cannot be reused after deletion, so the code matches the store, not
    /// the other way around. The same strings appear in `MealTime.storekit`
    /// and in `Proxy/worker.js`; all three move together or the paywall and
    /// the relay disagree about what was bought.
    static let monthlyProductID = "com.echochamber.mealtime.pro.monthly"
    static let annualProductID = "com.echochamber.mealtime.pro.annual"

    /// Everything that counts as a MealTime subscription. Deliberately used
    /// for both the store lookup and the entitlement check below, because
    /// those two falling out of step is the expensive bug: a plan that can be
    /// bought but not recognised afterwards takes someone's money and leaves
    /// them staring at the paywall. One set, both jobs, so they cannot drift.
    static let productIDs: Set<String> = [monthlyProductID, annualProductID]

    /// Plans included per calendar month, on either plan. The relay enforces
    /// this number (MONTHLY_GENERATION_CAP in wrangler.toml) and the paywall
    /// promises it. The two have to move together, along with the App Store
    /// descriptions.
    ///
    /// The annual plan gets this same monthly allowance rather than a yearly
    /// bucket, and that needed no relay change: the quota key there is
    /// `sub-<txnId>-<month>`, per transaction per calendar month, with no
    /// product in it. An annual subscriber gets this allowance twelve times.
    static let monthlyPlanAllowance = 20

    enum Status: Equatable {
        /// Entitlements have not been read yet. Never show the paywall on
        /// this: a subscriber would see it for a moment at every launch.
        case unknown
        case subscribed
        case notSubscribed
    }

    @Published private(set) var status: Status = .unknown

    #if DEBUG || TEST_UNLOCK
    /// Test-only paywall bypass. Exists so the app can be exercised end to
    /// end on a device before the App Store subscription is purchasable,
    /// which it is not while both products sit in MISSING_METADATA and no
    /// sandbox tester exists.
    ///
    /// Compiled in two ways and no others: any Debug build, or a Release
    /// build made with `-DTEST_UNLOCK` passed on the xcodebuild command
    /// line. The archive step in the documented upload method passes
    /// neither, so a shipped build cannot contain this. Do not add
    /// TEST_UNLOCK to project.yml or to the scheme; the whole guarantee is
    /// that it lives on the command line of a build made by hand.
    ///
    /// It sets `status` only. `transactionID` stays nil, because there is no
    /// transaction, and inventing a plausible one would be a lie the relay
    /// would then have to catch. Planning still works because the relay's
    /// subscription gate is currently off (REQUIRE_SUBSCRIPTION = "0",
    /// verified against the deployed worker 2026-08-28). If that gate is
    /// turned back on, this unlock shows a subscribed UI and still fails to
    /// plan, which is the correct and honest failure.
    static let testUnlockKey = "testProUnlock"

    static var testUnlockActive: Bool {
        UserDefaults.standard.bool(forKey: testUnlockKey)
    }

    /// The code typed in Settings to turn the bypass on.
    static let testUnlockCode = "MEALTIME-DEV"

    /// Turns the bypass on or off and re-reads entitlements, so the UI moves
    /// the moment it is set rather than at the next launch.
    func setTestUnlock(_ on: Bool) async {
        UserDefaults.standard.set(on, forKey: Self.testUnlockKey)
        await refreshEntitlement()
    }
    #endif

    /// Everything that resolved from the App Store, annual first. Empty means
    /// the lookup failed or has not run, which the paywall shows as a retry
    /// rather than an empty price.
    ///
    /// A partial result is kept on purpose. If only one of the two resolves,
    /// selling that one beats selling nothing.
    @Published private(set) var products: [Product] = []

    /// Which plan the paywall has highlighted. Nil until the products load.
    /// This drives what gets bought and what the paywall's price line says,
    /// and it is not what the customer owns. For that, see `entitledProduct`.
    @Published var selectedProductID: String?

    /// The product ID behind the active entitlement, or nil when there is no
    /// subscription. Kept separate from `selectedProductID` because Settings
    /// has to describe what was actually bought: telling an annual subscriber
    /// they are billed monthly is a false statement to a paying customer.
    @Published private(set) var entitledProductID: String?

    /// The `originalID` of the active subscription, as a string, or nil when
    /// there is no entitlement. This is what rides in the x-txn-id header.
    @Published private(set) var transactionID: String?
    /// True while a purchase or restore is in flight, so the paywall can
    /// disable its buttons instead of letting a second tap start a second
    /// StoreKit sheet.
    @Published private(set) var isWorking = false
    /// Set when a purchase or restore fails in a way worth showing. Cleared
    /// by the paywall when it is displayed or dismissed.
    @Published var errorMessage: String?
    /// Set when a purchase needs someone else's approval (Ask to Buy). The
    /// purchase is not finished and not failed, so it needs its own message.
    @Published var isAwaitingApproval = false

    /// Watches for renewals, cancellations, refunds, and purchases made on
    /// another device. Kept for the lifetime of the app.
    private var updatesTask: Task<Void, Never>?

    init() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                guard let self else { return }
                // A verified update means the entitlement picture changed.
                // Finish the transaction so StoreKit stops replaying it, then
                // re-read entitlements rather than trying to patch state from
                // this one transaction.
                if case .verified(let transaction) = update {
                    await transaction.finish()
                }
                await self.refresh()
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    // MARK: - Reading state

    /// Loads the products and the current entitlement. Safe to call often;
    /// both reads are local except the first product lookup.
    func refresh() async {
        await loadProducts()
        await refreshEntitlement()
    }

    /// Fetches both plans from the App Store. A network failure leaves
    /// `products` empty, which the paywall shows as a retry rather than an
    /// empty price.
    func loadProducts() async {
        guard products.isEmpty else { return }
        do {
            let fetched = try await Product.products(for: Self.productIDs)
            // Annual first. It is the better deal for the customer and the
            // better outcome for the business, and a picker's first row is
            // the one people read. Sorted by explicit rank rather than by a
            // "is this the annual" predicate, which is not a valid ordering
            // and is only accidentally right for two elements.
            let order = [Self.annualProductID, Self.monthlyProductID]
            let rank = { (product: Product) in order.firstIndex(of: product.id) ?? order.count }
            products = fetched.sorted { rank($0) < rank($1) }
            selectDefaultPlanIfNeeded()
        } catch {
            products = []
        }
    }

    /// Picks the highlighted plan once products exist, and repairs a
    /// selection pointing at something that did not resolve. Annual is the
    /// default because it is the one being promoted; monthly stands in when
    /// annual is the plan that failed to load.
    private func selectDefaultPlanIfNeeded() {
        if let current = selectedProductID, products.contains(where: { $0.id == current }) {
            return
        }
        selectedProductID = products.first(where: { $0.id == Self.annualProductID })?.id
            ?? products.first?.id
    }

    /// The plan the paywall will buy, or nil while nothing has loaded.
    var selectedProduct: Product? {
        products.first { $0.id == selectedProductID }
    }

    /// The plan this Apple Account actually owns, or nil with no entitlement.
    /// Can also be nil for a real subscriber if the store lookup failed, so
    /// anything reading it needs a story for that case.
    var entitledProduct: Product? {
        products.first { $0.id == entitledProductID }
    }

    /// Reads StoreKit's current entitlements and sets `status`,
    /// `transactionID`, and `entitledProductID` from them.
    ///
    /// A revoked (refunded) transaction still appears in
    /// `currentEntitlements` in some states, so `revocationDate` is checked
    /// explicitly. Expiry is not checked by hand: StoreKit drops expired
    /// subscriptions from this sequence already, and re-deriving it from
    /// `expirationDate` against the device clock would just add a way to get
    /// it wrong.
    ///
    /// The membership test is against `productIDs` rather than one string.
    /// Comparing against a single plan would ignore the other one, so a
    /// customer who bought it would be treated as never having subscribed.
    func refreshEntitlement() async {
        #if DEBUG || TEST_UNLOCK
        // Checked before StoreKit, not after, so the bypass works on a phone
        // where the products do not resolve at all. That is the exact
        // situation it exists for.
        if Self.testUnlockActive {
            transactionID = nil
            entitledProductID = Self.annualProductID
            status = .subscribed
            return
        }
        #endif

        for await entitlement in Transaction.currentEntitlements {
            guard case .verified(let transaction) = entitlement else { continue }
            guard Self.productIDs.contains(transaction.productID) else { continue }
            guard transaction.revocationDate == nil else { continue }
            transactionID = String(transaction.originalID)
            entitledProductID = transaction.productID
            status = .subscribed
            return
        }
        transactionID = nil
        entitledProductID = nil
        status = .notSubscribed
    }

    /// The identifier to send with a planning request, or nil when this
    /// phone has no active subscription. Always re-reads entitlements, so a
    /// subscription that lapsed or was cancelled since launch is caught
    /// before a request goes out and comes back refused.
    func activeTransactionID() async -> String? {
        await refreshEntitlement()
        return transactionID
    }

    // MARK: - Buying

    /// Runs the App Store purchase sheet for the highlighted plan. Returns
    /// true only when the subscription is active afterwards, so the caller
    /// can continue straight into whatever the user was trying to do.
    @discardableResult
    func purchase() async -> Bool {
        guard let product = selectedProduct else {
            errorMessage = "The subscription is not loading from the App Store. Check your connection and try again."
            return false
        }
        guard !isWorking else { return false }
        isWorking = true
        errorMessage = nil
        isAwaitingApproval = false
        defer { isWorking = false }

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    // StoreKit could not verify Apple's own signature. Do not
                    // grant anything on an unverified purchase.
                    errorMessage = "That purchase could not be verified with the App Store. You have not been charged for an active subscription. Try again."
                    return false
                }
                // Finishing tells StoreKit the app has delivered what was
                // bought. An unfinished transaction is replayed at every
                // launch forever.
                await transaction.finish()
                await refreshEntitlement()
                return status == .subscribed

            case .pending:
                // Ask to Buy, or a payment method that needs approval. The
                // Transaction.updates listener picks it up if it completes.
                isAwaitingApproval = true
                return false

            case .userCancelled:
                return false

            @unknown default:
                return false
            }
        } catch {
            errorMessage = "The purchase could not be completed. \(error.localizedDescription)"
            return false
        }
    }

    /// Restore Purchases. Apple requires a visible restore control in any
    /// app that sells a non-consumable or a subscription, which is why this
    /// exists in Settings even though StoreKit usually restores on its own.
    ///
    /// `AppStore.sync()` prompts for an App Store password, so it is only
    /// ever called from an explicit tap, never automatically.
    @discardableResult
    func restore() async -> Bool {
        guard !isWorking else { return false }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }

        do {
            try await AppStore.sync()
        } catch {
            // A cancelled password prompt lands here too, which is not worth
            // an error message, so check entitlements before complaining.
            await refreshEntitlement()
            if status == .subscribed { return true }
            errorMessage = "Nothing was restored. If you subscribed with a different Apple Account, sign in with that one and try again."
            return false
        }

        await refreshEntitlement()
        if status != .subscribed {
            errorMessage = "No active MealTime subscription was found on this Apple Account."
        }
        return status == .subscribed
    }

    /// Deep link to the system screen where a subscription is cancelled or
    /// changed. Apple wants this reachable from inside the app.
    static let manageSubscriptionsURL = URL(string: "https://apps.apple.com/account/subscriptions")!

    // MARK: - Display

    /// The highlighted plan's price, empty until it loads. Always comes from
    /// StoreKit rather than a hardcoded string, so a price change in App
    /// Store Connect does not need an app update, and the number is right in
    /// every currency and storefront.
    ///
    /// There is deliberately no placeholder behind these two. An earlier
    /// version fell back to "MealTime Pro Monthly" and "$4.99", which made
    /// the paywall look identical whether or not the App Store had answered,
    /// and inverted a UI test that waited on the name as proof of loading.
    /// A fallback exists to make the failure state look correct, which is the
    /// same property that makes it impossible to test against.
    var displayPrice: String {
        selectedProduct?.displayPrice ?? ""
    }

    /// The highlighted plan's name, from StoreKit rather than a literal, so
    /// the paywall cannot drift out of step with App Store Connect.
    var displayName: String {
        selectedProduct?.displayName ?? ""
    }

    /// How often the highlighted plan bills, as a phrase the paywall can put
    /// after the price. Read from StoreKit's own period rather than inferred
    /// from the product ID, so it stays true if a duration ever changes.
    var billingPeriodDescription: String {
        periodDescription(for: selectedProduct)
    }

    /// What percent an annual subscriber saves against twelve monthly
    /// charges, or nil when both prices are not available to compare.
    ///
    /// Computed from StoreKit's decimals rather than hardcoded, so it stays
    /// honest in every currency and after any price change. It truncates
    /// instead of rounding, because the only safe direction to be wrong about
    /// a discount on a purchase screen is downward. Overstating one is how
    /// you earn a 2.3.1 rejection.
    var annualSavingsPercent: Int? {
        guard let monthly = products.first(where: { $0.id == Self.monthlyProductID }),
              let annual = products.first(where: { $0.id == Self.annualProductID })
        else { return nil }

        let twelveMonths = monthly.price * 12
        guard twelveMonths > 0, annual.price < twelveMonths else { return nil }

        // Round the Decimal down before converting, rather than converting
        // and letting Int truncate. Dividing here produces a repeating
        // decimal ($39.99 against $59.88 gives 33.2164...), and
        // NSDecimalNumber.intValue returns 0 rather than 33 once the value
        // carries that many significant digits. That silently hid the badge
        // instead of failing, which is why this rounds first.
        var fraction = (twelveMonths - annual.price) / twelveMonths * 100
        var truncated = Decimal()
        NSDecimalRound(&truncated, &fraction, 0, .down)

        let percent = NSDecimalNumber(decimal: truncated).intValue
        return percent > 0 ? percent : nil
    }

    /// One line describing the active subscription for Settings. Reads the
    /// entitled product, never the paywall's selection, so someone on the
    /// annual plan is not told they are billed monthly.
    ///
    /// Falls back to a line with no price when the store lookup failed for a
    /// real subscriber. Saying less is better than printing a number that
    /// might belong to the plan they did not buy.
    var entitlementSummary: String {
        let allowance = "\(Self.monthlyPlanAllowance) meal plans a month"
        guard let product = entitledProduct else {
            return "\(allowance). Manage it in your Apple Account."
        }
        return "\(allowance), \(product.displayPrice) \(periodDescription(for: product)) to your Apple Account."
    }

    /// "billed monthly" or "billed yearly", from the product's real
    /// subscription period. Empty for a nil product so callers can put it in
    /// a string without printing a stray word.
    private func periodDescription(for product: Product?) -> String {
        guard let unit = product?.subscription?.subscriptionPeriod.unit else { return "" }
        switch unit {
        case .year: return "billed yearly"
        case .month: return "billed monthly"
        case .week: return "billed weekly"
        case .day: return "billed daily"
        @unknown default: return ""
        }
    }
}
