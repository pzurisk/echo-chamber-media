import SwiftUI

/// Small and simple. Budget target, dinners per week, pantry staples,
/// household code.
struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @AppStorage(HouseholdConfig.Keys.budgetTarget) private var budgetTarget = 100.0
    @AppStorage(HouseholdConfig.Keys.dinnersPerWeek) private var dinnersPerWeek = 5

    @State private var showNewHouseholdConfirm = false
    @State private var joinCode = ""
    @State private var joinError: String?
    @State private var newStaple = ""

    var body: some View {
        NavigationStack {
            Form {
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
                    .tint(.echoRed)
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
                    HStack {
                        Text("Code")
                        Spacer()
                        Text(appState.householdCode)
                            .font(.body.monospaced())
                            .foregroundStyle(Color.echoTextSecondary)
                        ShareLink(item: appState.householdCode) {
                            Image(systemName: "square.and.arrow.up")
                        }
                        .tint(.echoRed)
                    }
                    Text("Both phones use this code, so you both see the same week, list, and favorites. Share it only with your household; anyone who has it can see and edit your plan.")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                    Button("Start a new household", role: .destructive) {
                        showNewHouseholdConfirm = true
                    }
                }

                Section("Join a different household") {
                    TextField("MEAL-ABC123", text: $joinCode)
                        .font(.body.monospaced())
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .submitLabel(.join)
                        .onSubmit(attemptJoin)
                    if let joinError {
                        Text(joinError)
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                    Button("Join") { attemptJoin() }
                        .disabled(joinCode.trimmingCharacters(in: .whitespaces).isEmpty)
                    Text("Joining switches this phone to that household's shared plan, list, and favorites.")
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
                                .foregroundStyle(.orange)
                        }
                    }
                    if !appState.iCloudAvailable {
                        Text("Sign into iCloud in the Settings app to sync with the other phone.")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                }
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
        }
        .preferredColorScheme(.dark)
    }

    /// Shared by the staple field's submit and the Add button. AppState
    /// trims, ignores empties, and dedupes, so the field just clears.
    private func addStaple() {
        appState.addStaple(newStaple)
        newStaple = ""
    }

    /// Shared by the text field's submit and the Join button. On success
    /// the field clears; on a too-short code an inline error shows.
    private func attemptJoin() {
        if appState.joinHousehold(code: joinCode) {
            joinError = nil
            joinCode = ""
        } else {
            joinError = "That code looks too short. Double check it and try again."
        }
    }
}
