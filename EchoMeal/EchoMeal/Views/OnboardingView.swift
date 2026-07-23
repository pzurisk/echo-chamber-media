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

            VStack(spacing: 28) {
                Spacer()

                switch step {
                case .choose:
                    chooseStep
                case .created(let code):
                    createdStep(code)
                case .join:
                    joinStep
                }

                Spacer()
                Spacer()
            }
            .padding(.horizontal, 28)
        }
        .preferredColorScheme(.dark)
    }

    // MARK: - Choose

    private var chooseStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 12) {
                Text("MealTime")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
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
                .tint(.echoRed)

                Button {
                    step = .join
                } label: {
                    Text("Join with a code")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                }
                .buttonStyle(.bordered)
                .tint(.white)
            }

            Text("You can find or change your household code later in Settings.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Created

    private func createdStep(_ code: String) -> some View {
        VStack(spacing: 24) {
            Text("Your household code")
                .font(.headline)
                .foregroundStyle(Color.echoTextSecondary)

            Text(code)
                .font(.system(size: 38, weight: .bold, design: .monospaced))
                .foregroundStyle(.white)
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .padding(.vertical, 20)
                .padding(.horizontal, 24)
                .frame(maxWidth: .infinity)
                .echoCardStyle()

            Text("Share this code with your partner so their phone joins yours.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)

            ShareLink(item: code) {
                Label("Share code", systemImage: "square.and.arrow.up")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.bordered)
            .tint(.white)

            Button {
                dismiss()
            } label: {
                Text("Continue")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoRed)
        }
    }

    // MARK: - Join

    private var joinStep: some View {
        VStack(spacing: 24) {
            Text("Enter your household code")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)

            TextField("MEAL-ABC123", text: $joinCode)
                .font(.title3.monospaced())
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
                    .foregroundStyle(.orange)
                    .multilineTextAlignment(.center)
            }

            Button(action: attemptJoin) {
                Text("Join")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoRed)

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
            joinError = "That code looks too short. Double check it and try again."
        }
    }
}
