import SwiftUI

/// Small and simple. Budget target, dinners per week, household code.
struct SettingsView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @AppStorage(HouseholdConfig.Keys.budgetTarget) private var budgetTarget = 100.0
    @AppStorage(HouseholdConfig.Keys.dinnersPerWeek) private var dinnersPerWeek = 5

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

                Section("Household") {
                    HStack {
                        Text("Code")
                        Spacer()
                        Text(HouseholdConfig.code)
                            .font(.body.monospaced())
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                    Text("Both phones use this code, so you both see the same week, list, and favorites.")
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
        }
        .preferredColorScheme(.dark)
    }
}
