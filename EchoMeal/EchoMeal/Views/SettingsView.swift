import SwiftUI

/// Small and simple. Budget target, dinners per week, pantry staples,
/// household code.
struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var subscriptions: SubscriptionStore
    @Environment(\.dismiss) private var dismiss

    @AppStorage(HouseholdConfig.Keys.budgetTarget) private var budgetTarget = 100.0
    @AppStorage(HouseholdConfig.Keys.dinnersPerWeek) private var dinnersPerWeek = 5
    /// Per-phone, not per-household. The two phones can disagree, on purpose.
    @AppStorage(HouseholdConfig.Keys.themeChoice) private var theme: AppTheme = .hearth

    @State private var showNewHouseholdConfirm = false
    /// Collapsed on every open. The QR is the household key, so showing it
    /// is a deliberate act, not a remembered preference.
    @State private var showHouseholdQR = false
    @State private var joinCode = ""
    @State private var joinError: String?
    @State private var newStaple = ""
    @State private var showDeleteConfirm = false
    @State private var isDeleting = false
    @State private var deleteError: String?
    @State private var showPaywall = false
    @State private var restoreMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                subscriptionSection

                Section("Appearance") {
                    ForEach(AppTheme.allCases) { option in
                        Button {
                            theme = option
                        } label: {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(option.label)
                                        .foregroundStyle(Color.echoText)
                                    Text(option.detail)
                                        .font(.caption)
                                        .foregroundStyle(Color.echoTextSecondary)
                                }
                                Spacer()
                                if theme == option {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(Color.echoAccentText)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(theme == option ? [.isButton, .isSelected] : .isButton)
                    }
                }

                Section("Weekly budget") {
                    HStack {
                        Text("Target")
                        Spacer()
                        Text(String(format: "$%.0f", budgetTarget))
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                    Slider(value: $budgetTarget, in: 40...300, step: 5) {
                        Text("Budget target")
                    }
                    .tint(.echoAccent)
                }

                Section("Dinners per week") {
                    Stepper(value: $dinnersPerWeek, in: 3...7) {
                        Text("\(dinnersPerWeek) dinners")
                    }
                    Text("Applies to the next plan you speak.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                }

                Section("Pantry staples") {
                    Text("Things you always have at home. Plans will skip buying these.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                    ForEach(appState.pantryStaples, id: \.self) { staple in
                        Text(staple)
                    }
                    .onDelete { offsets in
                        appState.removeStaples(atOffsets: offsets)
                    }
                    HStack {
                        TextField("Add a staple, like rice", text: $newStaple)
                            .submitLabel(.done)
                            .onSubmit(addStaple)
                        Button("Add") { addStaple() }
                            .buttonStyle(.borderless)
                            .disabled(newStaple.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }

                Section("Household") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Code")
                            Spacer()
                            // Shares the code as text, not the join link. A
                            // custom URL scheme is not reliably tappable in
                            // Messages, and pasted text normalizes back to
                            // the same code anyway.
                            ShareLink(item: appState.householdDisplayCode) {
                                Image(systemName: "square.and.arrow.up")
                            }
                            .tint(.echoAccentText)
                        }
                        Text(appState.householdDisplayCode)
                            .font(.footnote.monospaced())
                            .foregroundStyle(Color.echoTextSecondary)
                            .textSelection(.enabled)
                    }

                    // Behind a tap on purpose. The QR is the whole key in
                    // one glance, so it should not be sitting open on a
                    // screen anyone can shoulder-read.
                    if let url = appState.householdJoinURL {
                        DisclosureGroup("Show QR code", isExpanded: $showHouseholdQR) {
                            VStack(spacing: 10) {
                                HouseholdQRView(url: url, side: 180)
                                Text("Point the other phone's camera at this to join.")
                                    .font(.caption)
                                    .foregroundStyle(Color.echoTextSecondary)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                        }
                    }

                    Text("Both phones use this code, so you both see the same week, list, and favorites. It is also the key your data is encrypted with, so anyone who has it can read and edit your plan, and nobody can recover it for you if both phones lose it.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                    Button("Start a new household", role: .destructive) {
                        showNewHouseholdConfirm = true
                    }
                }

                Section("Join a different household") {
                    TextField("MEAL-XXXX-XXXX-...", text: $joinCode)
                        .font(.footnote.monospaced())
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .submitLabel(.join)
                        .onSubmit(attemptJoin)
                    if let joinError {
                        Text(joinError)
                            .font(.caption)
                            .foregroundStyle(Color.echoWarning)
                    }
                    Button("Join") { attemptJoin() }
                        .disabled(joinCode.trimmingCharacters(in: .whitespaces).isEmpty)
                    Text("Scanning the other phone's QR code does this for you. Joining switches this phone to that household's shared plan, list, and favorites.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                }

                Section("Sync") {
                    HStack {
                        Text("iCloud")
                        Spacer()
                        if appState.iCloudAvailable {
                            Label("Connected", systemImage: "checkmark.circle.fill")
                                .foregroundStyle(Color.echoGreen)
                        } else {
                            Label("Signed out", systemImage: "icloud.slash")
                                .foregroundStyle(Color.echoWarning)
                        }
                    }
                    if !appState.iCloudAvailable {
                        Text("Sign into iCloud in the Settings app to sync with the other phone.")
                            .font(.caption)
                            .foregroundStyle(Color.echoWarning)
                    }
                }

                Section("Delete all data") {
                    Text("Erases this household's week, grocery list, favorites, recipe box, ratings, and history from iCloud and from this phone. Because the data is shared, it goes for the other phone in your household too.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                    if let deleteError {
                        Text(deleteError)
                            .font(.caption)
                            .foregroundStyle(Color.echoWarning)
                    }
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        if isDeleting {
                            HStack {
                                ProgressView()
                                Text("Deleting")
                            }
                        } else {
                            Text("Delete all my data")
                        }
                    }
                    .disabled(isDeleting)
                }
            }
            .sheet(isPresented: $showPaywall) {
                PaywallView()
                    .environmentObject(subscriptions)
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
            .alert("Start a new household?", isPresented: $showNewHouseholdConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Start new", role: .destructive) {
                    appState.leaveHouseholdAndStartNew()
                }
            } message: {
                Text("This disconnects this phone from the current shared data and makes a fresh code. Your partner keeps the old data. Continue?")
            }
            .alert("Delete all your data?", isPresented: $showDeleteConfirm) {
                Button("Cancel", role: .cancel) {}
                Button("Delete everything", role: .destructive) {
                    deleteEverything()
                }
            } message: {
                Text("This permanently erases your week, grocery list, favorites, recipe box, ratings, and history from iCloud and from this phone. It also deletes them for the other phone in your household, and it forgets the code, which is the only key to that data. This cannot be undone.")
            }
        }
    }

    /// Subscription status, the way to buy, the way to cancel, and Restore
    /// Purchases. Apple requires a restore control to be reachable in the
    /// app, and requires a link out to manage or cancel the subscription.
    /// Both live here.
    ///
    /// The subscription belongs to the Apple Account, not the household, so
    /// this section deliberately says nothing about the other phone: two
    /// people sharing a household code each need their own subscription to
    /// generate, and both can read whatever either one generates.
    private var subscriptionSection: some View {
        Section("Subscription") {
            HStack {
                Text("Status")
                Spacer()
                switch subscriptions.status {
                case .subscribed:
                    Label("Active", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(Color.echoGreen)
                case .notSubscribed:
                    Text("Not subscribed")
                        .foregroundStyle(Color.echoTextSecondary)
                case .unknown:
                    ProgressView()
                }
            }

            if subscriptions.status == .subscribed {
                // Describes the plan that was actually bought, not whatever
                // the paywall last highlighted. Reading displayPrice here
                // would tell an annual subscriber they are billed monthly.
                Text(subscriptions.entitlementSummary)
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
                Link("Manage or cancel", destination: SubscriptionStore.manageSubscriptionsURL)
                    .tint(.echoAccentText)
            } else {
                Text("A subscription covers building new plans. Your saved week, recipes, and grocery list stay readable either way.")
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
                Button("Subscribe") { showPaywall = true }
            }

            Button {
                Task {
                    let restored = await subscriptions.restore()
                    restoreMessage = restored
                        ? "Your subscription is active again."
                        : (subscriptions.errorMessage ?? "Nothing was restored.")
                }
            } label: {
                if subscriptions.isWorking {
                    HStack {
                        ProgressView()
                        Text("Restoring")
                    }
                } else {
                    Text("Restore purchases")
                }
            }
            .disabled(subscriptions.isWorking)

            if let restoreMessage {
                Text(restoreMessage)
                    .font(.caption)
                    .foregroundStyle(subscriptions.status == .subscribed ? Color.echoGreen : Color.echoWarning)
            }
        }
    }

    /// Deletes the household's cloud records and then this phone. The button
    /// stays disabled while it runs, and a failure shows inline rather than
    /// leaving the user to guess, because the data is still there when this
    /// throws. On success the app drops back to onboarding, so this sheet
    /// dismisses to get out of the way of it.
    private func deleteEverything() {
        isDeleting = true
        deleteError = nil
        Task {
            do {
                try await appState.deleteEverything()
                isDeleting = false
                dismiss()
            } catch {
                isDeleting = false
                deleteError = "Could not delete your data. Nothing was removed. Check your internet connection and iCloud sign-in, then try again."
            }
        }
    }

    /// Shared by the staple field's submit and the Add button. AppState
    /// trims, ignores empties, and dedupes, so the field just clears.
    private func addStaple() {
        appState.addStaple(newStaple)
        newStaple = ""
    }

    /// Shared by the text field's submit and the Join button. On success
    /// the field clears; on an incomplete code an inline error shows.
    private func attemptJoin() {
        if appState.joinHousehold(code: joinCode) {
            joinError = nil
            joinCode = ""
        } else {
            joinError = "That is not a complete code. It has 26 characters after MEAL, so scanning the QR is the easy way."
        }
    }
}
