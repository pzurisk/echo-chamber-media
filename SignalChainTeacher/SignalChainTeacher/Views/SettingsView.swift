import SwiftUI

struct SettingsView: View {
    @State private var apiKeyInput = ""
    @State private var hasStoredKey = KeychainService.hasAPIKey
    @State private var savedNotice = false

    var body: some View {
        Form {
            Section("Anthropic API Key") {
                VStack(alignment: .leading, spacing: 8) {
                    Text("The teacher runs on the Anthropic API. Get a key at [console.anthropic.com](https://console.anthropic.com), under API Keys, then paste it below. It is stored only in the macOS Keychain, never in this app's files or logs.")
                        .font(.callout)
                        .foregroundStyle(.secondary)

                    if hasStoredKey {
                        Label("A key is stored", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    } else {
                        Label("No key stored yet", systemImage: "exclamationmark.circle")
                            .foregroundStyle(.orange)
                    }

                    SecureField("sk-ant-...", text: $apiKeyInput)
                        .textFieldStyle(.roundedBorder)

                    HStack {
                        Button("Save to Keychain") {
                            let trimmed = apiKeyInput.trimmingCharacters(in: .whitespacesAndNewlines)
                            guard !trimmed.isEmpty else { return }
                            KeychainService.save(apiKey: trimmed)
                            apiKeyInput = ""
                            hasStoredKey = true
                            savedNotice = true
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(Theme.brass)

                        if hasStoredKey {
                            Button("Remove key", role: .destructive) {
                                KeychainService.deleteAPIKey()
                                hasStoredKey = false
                            }
                        }
                    }

                    if savedNotice {
                        Text("Saved.").font(.caption).foregroundStyle(.green)
                    }
                }
                .padding(.vertical, 6)
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Settings")
        .frame(minWidth: 420, minHeight: 260)
    }
}
