import StoreKit
import SwiftUI

/// Shown when someone asks for a plan without an active subscription.
///
/// It appears at the moment of intent, not at launch and not during
/// onboarding. Someone who has already set up a household and tapped the mic
/// has shown they want the thing; that is a better moment to ask for $4.99
/// than a cold open. Everything the app already holds (the week, the recipe
/// box, the grocery list, favorites) stays readable without subscribing.
/// Only generating a new plan is gated.
///
/// Apple requires a paywall to state the price, the billing period, and that
/// the subscription auto-renews, and to give access to the terms and the
/// privacy policy. All of that is on this screen on purpose. Do not trim it
/// for looks.
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
            await subscriptions.loadProduct()
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
            row("iphone.gen3", "Shared with the other phone in your household at no extra cost")
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

    private var priceAndBuy: some View {
        VStack(spacing: 10) {
            Text("\(subscriptions.displayPrice) per month")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)

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
            // A nil product means the App Store never answered. Buying is
            // impossible until it does, so the button says so instead of
            // failing on tap.
            .disabled(subscriptions.isWorking || subscriptions.product == nil)

            if subscriptions.product == nil {
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

    private var smallPrint: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Billed monthly to your Apple Account. It renews automatically until you cancel, which you can do any time in your Apple Account settings. Cancelling stops the next charge and leaves the plans you already made.")
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
