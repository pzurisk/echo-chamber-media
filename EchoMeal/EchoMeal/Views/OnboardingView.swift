import SwiftUI

/// First-launch setup, shown full screen until this phone belongs to a
/// household. One phone starts the household and gets a code; the other
/// phone types that code to join. Dismisses itself once setup is done.
struct OnboardingView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    private enum Step {
        case choose
        case created(String)
        case join
    }

    @State private var step: Step = .choose
    @State private var joinCode = ""
    @State private var joinError: String?

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            // Scrolls only when it has to. The created step carries a QR
            // code now and overflows a small phone; the other two steps
            // still sit centred, because minHeight pins the stack to the
            // screen and the spacers do the centring inside it.
            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 28) {
                        Spacer(minLength: 12)

                        switch step {
                        case .choose:
                            chooseStep
                        case .created(let code):
                            createdStep(code)
                        case .join:
                            joinStep
                        }

                        Spacer(minLength: 24)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 28)
                    .frame(maxWidth: .infinity, minHeight: geometry.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
        }
    }

    // MARK: - Choose

    private var chooseStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 12) {
                Text("MealTime")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.echoText)
                Text("Plan the week by talking. Share one list with your favorite person.")
                    .font(.headline)
                    .foregroundStyle(Color.echoTextSecondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 14) {
                Button {
                    let code = appState.createHousehold()
                    step = .created(code)
                } label: {
                    Text("Start our household")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                .buttonStyle(.borderedProminent)
                .tint(Color.echoAccent)

                Button {
                    step = .join
                } label: {
                    Text("Join with a code")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                .buttonStyle(.bordered)
                .tint(Color.echoText)
            }

            Text("You can find or change your household code later in Settings.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Created

    private func createdStep(_ code: String) -> some View {
        VStack(spacing: 20) {
            Text("Your household code")
                .font(.headline)
                .foregroundStyle(Color.echoTextSecondary)

            if let url = HouseholdCrypto.joinURL(for: code) {
                HouseholdQRView(url: url, side: 170)
            }

            Text("Point the other phone's camera at this to join. No app needed, the built-in Camera does it.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)

            // The code itself, for the times a camera is not an option.
            // Selectable so it can be copied out by hand.
            Text(HouseholdCrypto.formatted(code))
                .font(.system(.footnote, design: .monospaced))
                .foregroundStyle(Color.echoText)
                .multilineTextAlignment(.center)
                .textSelection(.enabled)
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
                .frame(maxWidth: .infinity)
                .echoCardStyle()

            // Shares the code as text rather than the link, because a custom
            // scheme is not reliably tappable in Messages. Pasted into the
            // join field it normalizes back to the same code.
            ShareLink(item: HouseholdCrypto.formatted(code)) {
                Label("Share code", systemImage: "square.and.arrow.up")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.bordered)
            .tint(Color.echoText)

            Text("Write it down somewhere safe. It is the only key to your data, and nobody can recover it for you.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)

            Button {
                dismiss()
            } label: {
                Text("Continue")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.echoAccent)
        }
    }

    // MARK: - Join

    private var joinStep: some View {
        VStack(spacing: 24) {
            Text("Enter your household code")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)

            Text("Easier: point this phone's camera at the QR code on the other one.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)

            TextField("MEAL-XXXX-XXXX-...", text: $joinCode)
                .font(.footnote.monospaced())
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .multilineTextAlignment(.center)
                .submitLabel(.join)
                .onSubmit(attemptJoin)
                .padding(.vertical, 16)
                .padding(.horizontal, 20)
                .echoCardStyle()

            if let joinError {
                Text(joinError)
                    .font(.subheadline)
                    .foregroundStyle(Color.echoWarning)
                    .multilineTextAlignment(.center)
            }

            Button(action: attemptJoin) {
                Text("Join")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.echoAccent)

            Button("Back") {
                joinError = nil
                step = .choose
            }
            .font(.subheadline)
            .foregroundStyle(Color.echoTextSecondary)
        }
    }

    private func attemptJoin() {
        if appState.joinHousehold(code: joinCode) {
            joinError = nil
            dismiss()
        } else {
            joinError = "That is not a complete code. It has 26 characters after MEAL, so scanning the QR is the easy way."
        }
    }
}
