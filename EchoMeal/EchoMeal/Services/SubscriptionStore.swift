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

    /// Must match the product ID created in App Store Connect exactly. A
    /// typo here does not fail the build, it just makes `product` nil and
    /// the paywall unbuyable, so check this first if the paywall looks empty.
    ///
    /// This is the real ID from App Store Connect, in subscription group
    /// "MealTime Pro" (22310219). App Store Connect product IDs are permanent
    /// and cannot be reused after deletion, so the code matches the store, not
    /// the other way around. The same string appears in `MealTime.storekit`
    /// and in `Proxy/worker.js`; all three move together or the paywall and
    /// the relay disagree about what was bought.
    static let productID = "com.echochamber.mealtime.pro.monthly"

    /// Plans included per calendar month. The relay enforces this number
    /// (MONTHLY_GENERATION_CAP in wrangler.toml) and the paywall promises it.
    /// The two have to move together, along with the App Store description.
    static let monthlyPlanAllowance = 20

    enum Status: Equatable {
        /// Entitlements have not been read yet. Never show the paywall on
        /// this: a subscriber would see it for a moment at every launch.
        case unknown
        case subscribed
        case notSubscribed
    }

    @Published private(set) var status: Status = .unknown
    @Published private(set) var product: Product?
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

    /// Loads the product and the current entitlement. Safe to call often;
    /// both reads are local except the first product lookup.
    func refresh() async {
        await loadProduct()
        await refreshEntitlement()
    }

    /// Fetches the subscription product from the App Store. A network
    /// failure leaves `product` nil, which the paywall shows as a retry
    /// rather than an empty price.
    func loadProduct() async {
        guard product == nil else { return }
        do {
            let products = try await Product.products(for: [Self.productID])
            product = products.first
        } catch {
            product = nil
        }
    }

    /// Reads StoreKit's current entitlements and sets `status` and
    /// `transactionID` from them.
    ///
    /// A revoked (refunded) transaction still appears in
    /// `currentEntitlements` in some states, so `revocationDate` is checked
    /// explicitly. Expiry is not checked by hand: StoreKit drops expired
    /// subscriptions from this sequence already, and re-deriving it from
    /// `expirationDate` against the device clock would just add a way to get
    /// it wrong.
    func refreshEntitlement() async {
        for await entitlement in Transaction.currentEntitlements {
            guard case .verified(let transaction) = entitlement else { continue }
            guard transaction.productID == Self.productID else { continue }
            guard transaction.revocationDate == nil else { continue }
            transactionID = String(transaction.originalID)
            status = .subscribed
            return
        }
        transactionID = nil
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

    /// Runs the App Store purchase sheet. Returns true only when the
    /// subscription is active afterwards, so the caller can continue
    /// straight into whatever the user was trying to do.
    @discardableResult
    func purchase() async -> Bool {
        guard let product else {
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

    /// The price to show, or a placeholder while the product loads. Always
    /// comes from StoreKit rather than a hardcoded string, so a price change
    /// in App Store Connect does not need an app update, and the number is
    /// right in every currency and storefront.
    var displayPrice: String {
        product?.displayPrice ?? "$4.99"
    }

    /// The subscription's name, from StoreKit rather than a literal, so the
    /// paywall cannot drift out of step with App Store Connect. The fallback
    /// only shows in the moment before the product loads, and the buy button
    /// is disabled until then anyway.
    var displayName: String {
        product?.displayName ?? "MealTime Pro Monthly"
    }
}
