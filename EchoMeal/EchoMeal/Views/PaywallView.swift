import StoreKit
import SwiftUI

/// Shown when someone asks for a plan without an active subscription.
///
/// It appears at the moment of intent, not at launch and not during
/// onboarding. Someone who has already set up a household and tapped the mic
/// has shown they want the thing; that is a better moment to ask for money
/// than a cold open. Everything the app already holds (the week, the recipe
/// box, the grocery list, favorites) stays readable without subscribing.
/// Only generating a new plan is gated.
///
/// Apple requires a paywall to state the price, the billing period, and that
/// the subscription auto-renews, and to give access to the terms and the
/// privacy policy. All of that is on this screen on purpose. Do not trim it
/// for looks. With two plans on offer it has to hold for both rows, which is
/// why each one carries its own name, price, and period rather than letting
/// the highlighted row speak for both.
struct PaywallView: View {
    @EnvironmentObject private var subscriptions: SubscriptionStore
    @Environment(\.dismiss) private var dismiss

    /// Called after a successful purchase, so the caller can pick up
    /// whatever the user was trying to do when the paywall interrupted.
    var onSubscribed: () -> Void = {}

    private let terms = URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!
    private let privacy = URL(string: "https://echochambermedia.com/mealtime/privacy")!

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    included
                    priceAndBuy
                    if subscriptions.isAwaitingApproval {
                        notice("This purchase is waiting for approval. Your plans unlock as soon as it goes through.", color: .echoInfo)
                    }
                    if let error = subscriptions.errorMessage {
                        notice(error, color: .echoWarning)
                    }
                    smallPrint
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .task {
            await subscriptions.loadProducts()
        }
        .onDisappear {
            subscriptions.errorMessage = nil
        }
    }

    // MARK: - Pieces

    private var header: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Keep planning dinner")
                .font(.title2.weight(.bold))
                .foregroundStyle(Color.echoText)
                .padding(.top, 26)

            Text("Every plan MealTime builds is a real request to Claude, and those cost money to run. A subscription covers them.")
                .font(.subheadline)
                .foregroundStyle(Color.echoText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var included: some View {
        VStack(alignment: .leading, spacing: 12) {
            row("calendar", "\(SubscriptionStore.monthlyPlanAllowance) meal plans a month, which is a fresh week every week with room to change your mind")
            row("mic.fill", "Speak your cravings and get a full week of dinners with recipes")
            row("checklist", "One combined grocery list, sorted for the store")
            // Careful with this line. The subscription belongs to one Apple
            // Account, so the second phone in a household can read everything
            // and cannot generate without its own. An earlier version promised
            // sharing "at no extra cost", which was not true and is exactly
            // the kind of purchase-screen claim that draws a 2.3.1 rejection
            // and refund requests. Say what is actually shared.
            row("iphone.gen3", "Everything you make shows up on the other phone in your household, which reads it all for free")
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .echoCardStyle()
    }

    private func row(_ symbol: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: symbol)
                .font(.subheadline)
                .foregroundStyle(Color.echoAccentText)
                .frame(width: 22)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.echoText)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// One row per plan. Guideline 3.1.2 wants the subscription's title, its
    /// length, and its price all visible before anyone can buy, and with two
    /// plans on screen that has to be true of both rows, not just the
    /// highlighted one. Every string here comes from StoreKit when the
    /// products load, so it matches App Store Connect without a second copy
    /// to keep in sync.
    private var planPicker: some View {
        VStack(spacing: 10) {
            ForEach(subscriptions.products, id: \.id) { product in
                planRow(product)
            }
        }
    }

    private func planRow(_ product: Product) -> some View {
        let isSelected = product.id == subscriptions.selectedProductID

        return Button {
            subscriptions.selectedProductID = product.id
        } label: {
            HStack(alignment: .firstTextBaseline, spacing: 12) {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(isSelected ? Color.echoAccentText : Color.echoTextSecondary)

                VStack(alignment: .leading, spacing: 3) {
                    Text(product.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.echoText)
                    Text("\(product.displayPrice) \(periodPhrase(product))")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                }

                Spacer(minLength: 8)

                // Only shown when both prices resolved, because it is
                // computed from the pair. A savings badge that cannot be
                // checked against a real monthly price does not go on screen.
                if product.id == SubscriptionStore.annualProductID,
                   let saved = subscriptions.annualSavingsPercent {
                    Text("Save \(saved)%")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.echoOnAccent)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.echoAccent, in: Capsule())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(
                        isSelected ? Color.echoAccent : Color.echoTextSecondary.opacity(0.3),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
        .disabled(subscriptions.isWorking)
        .accessibilityAddTraits(isSelected ? [.isSelected] : [])
    }

    /// "per year" or "per month", from the product's own period rather than
    /// from its ID, so the line stays true if a duration ever changes.
    private func periodPhrase(_ product: Product) -> String {
        guard let unit = product.subscription?.subscriptionPeriod.unit else { return "" }
        switch unit {
        case .year: return "per year"
        case .month: return "per month"
        case .week: return "per week"
        case .day: return "per day"
        @unknown default: return ""
        }
    }

    private var priceAndBuy: some View {
        VStack(spacing: 10) {
            planPicker

            Button {
                Task {
                    if await subscriptions.purchase() {
                        onSubscribed()
                        dismiss()
                    }
                }
            } label: {
                Group {
                    if subscriptions.isWorking {
                        ProgressView()
                            .tint(Color.echoOnAccent)
                    } else {
                        Text("Subscribe")
                            .font(.headline)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoAccent)
            // No selected product means the App Store never answered. Buying
            // is impossible until it does, so the button says so instead of
            // failing on tap.
            .disabled(subscriptions.isWorking || subscriptions.selectedProduct == nil)

            if subscriptions.selectedProduct == nil {
                Text("Loading the subscription from the App Store.")
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
            }

            Button("Restore purchases") {
                Task {
                    if await subscriptions.restore() {
                        onSubscribed()
                        dismiss()
                    }
                }
            }
            .font(.subheadline)
            .foregroundStyle(Color.echoAccentText)
            .disabled(subscriptions.isWorking)

            Button("Not now") { dismiss() }
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
        }
        .padding(.top, 4)
    }

    private func notice(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.caption)
            .foregroundStyle(color)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Follows the highlighted plan. This sentence used to hardcode "Billed
    /// monthly", which turns into a false statement on the purchase screen
    /// the moment someone selects the annual row.
    private var billingSentence: String {
        let period = subscriptions.billingPeriodDescription
        guard !period.isEmpty else { return "Billed to your Apple Account." }
        return "\(period.prefix(1).uppercased() + period.dropFirst()) to your Apple Account."
    }

    private var smallPrint: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("\(billingSentence) It renews automatically until you cancel, which you can do any time in your Apple Account settings. Cancelling stops the next charge and leaves the plans you already made.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .fixedSize(horizontal: false, vertical: true)

            Text("Your week, recipes, and grocery list stay readable whether or not you subscribe. The subscription covers building new plans.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 16) {
                Link("Terms of use", destination: terms)
                Link("Privacy policy", destination: privacy)
            }
            .font(.caption)
            .foregroundStyle(Color.echoAccentText)
        }
        .padding(.top, 4)
    }
}
