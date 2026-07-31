import SwiftUI

/// Tab 1. One large red circular button, centered, on a dark background.
/// Tap once to listen, tap again to stop. There is no auto-stop. While
/// Claude plans, shows "Planning your week." with a Cancel button. A typed
/// alternative sits under the Surprise button for loud rooms.
struct SpeakView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var recorder = SpeechRecorder()
    @State private var pulse = false

    /// The one sheet this screen can show. Driving all three presentations
    /// through a single item means they can never collide or swallow each
    /// other's dismissal.
    private enum ActiveSheet: Identifiable {
        case settings, aiNotice, typeIn
        var id: Self { self }
    }

    @State private var activeSheet: ActiveSheet?
    /// Which sheet was showing, remembered for onDismiss. The item binding
    /// is already nil by the time onDismiss runs, so it cannot tell us.
    @State private var lastSheet: ActiveSheet?
    /// What to run once the one-time AI notice is accepted.
    @State private var pendingTranscript: String?
    @State private var pendingSurprise = false
    /// Draft in the type-in sheet. Kept on cancel so nothing typed is lost.
    @State private var typedText = ""
    /// Set by the type-in sheet's Plan button. Submitted from onDismiss,
    /// not before, so the AI notice can present cleanly afterward if needed.
    @State private var typedSubmission: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()

                VStack(spacing: 28) {
                    if !appState.iCloudAvailable {
                        ICloudBanner()
                    }

                    Spacer()

                    switch appState.phase {
                    case .planning:
                        planningState
                    default:
                        micButton
                        statusText
                        if !recorder.isRecording {
                            ideasAndSurprise
                        }
                    }

                    if let status = appState.statusMessage {
                        Text(status)
                            .font(.caption)
                            .foregroundStyle(.orange)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }

                    Spacer()
                    Spacer()
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        show(.settings)
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }
            }
            .onAppear {
                recorder.onFinish = { transcript in
                    submit(transcript)
                }
            }
            .sheet(item: $activeSheet, onDismiss: handleSheetDismiss) { sheet in
                switch sheet {
                case .settings:
                    SettingsView()
                case .aiNotice:
                    AINoticeSheet(
                        onAccept: {
                            appState.acceptAINotice()
                            activeSheet = nil
                            if let transcript = pendingTranscript {
                                pendingTranscript = nil
                                appState.generatePlan(from: transcript)
                            } else if pendingSurprise {
                                pendingSurprise = false
                                appState.surpriseMe()
                            }
                        },
                        onDecline: {
                            activeSheet = nil
                        }
                    )
                    .presentationDetents([.large])
                case .typeIn:
                    TypeInSheet(text: $typedText) { text in
                        typedSubmission = text
                        activeSheet = nil
                    }
                }
            }
        }
    }

    // MARK: - Flow

    /// Presents a sheet and remembers which one, for handleSheetDismiss.
    private func show(_ sheet: ActiveSheet) {
        lastSheet = sheet
        activeSheet = sheet
    }

    /// The single gate between captured input (spoken or typed) and plan
    /// generation. Goes straight to planning once the one-time AI notice
    /// has been accepted; otherwise stashes the transcript and shows the
    /// notice first.
    private func submit(_ transcript: String) {
        if appState.aiNoticeAccepted {
            appState.generatePlan(from: transcript)
        } else {
            pendingTranscript = transcript
            show(.aiNotice)
        }
    }

    /// Runs after any sheet fully dismisses, whether by button or swipe.
    private func handleSheetDismiss() {
        let dismissed = lastSheet
        lastSheet = nil
        switch dismissed {
        case .aiNotice:
            // Declining, or swiping the notice away, must never be silent.
            // Drop the stashed input and say plainly that nothing happened.
            if !appState.aiNoticeAccepted {
                pendingTranscript = nil
                pendingSurprise = false
                appState.flashStatus("Your week was not planned. Tap the button when you are ready.")
            }
        case .typeIn:
            if let text = typedSubmission {
                typedSubmission = nil
                typedText = ""
                submit(text)
            }
        case .settings, nil:
            break
        }
    }

    // MARK: - Pieces

    private var micButton: some View {
        Button {
            recorder.toggle()
        } label: {
            ZStack {
                // Subtle pulse ring while listening.
                Circle()
                    .fill(Color.echoRed.opacity(0.25))
                    .frame(width: 230, height: 230)
                    .scaleEffect(recorder.isRecording && pulse ? 1.18 : 1.0)
                    .opacity(recorder.isRecording ? 1 : 0)
                    .animation(
                        recorder.isRecording
                            ? .easeInOut(duration: 0.9).repeatForever(autoreverses: true)
                            : .default,
                        value: pulse
                    )

                Circle()
                    .fill(
                        LinearGradient(
                            colors: [Color.echoRed, Color.echoRed.opacity(0.78)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 210, height: 210)
                    .shadow(color: Color.echoRed.opacity(0.45), radius: 30, y: 8)

                Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                    .font(.system(size: 62, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(.plain)
        .onChange(of: recorder.isRecording) { _, recording in
            pulse = recording
        }
        .accessibilityLabel(recorder.isRecording ? "Stop listening" : "Start listening")
    }

    private var statusText: some View {
        VStack(spacing: 12) {
            if recorder.isRecording {
                Text("Listening. Take your time. Tap again when you're done.")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                if !recorder.transcript.isEmpty {
                    Text(recorder.transcript)
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                        .multilineTextAlignment(.center)
                        .lineLimit(4)
                        .padding(.horizontal, 32)
                }
            } else if let error = recorder.errorMessage {
                Text(error)
                    .font(.subheadline)
                    .foregroundStyle(.orange)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            } else {
                Text("Tell me what sounds good this week.")
                    .font(.headline)
                    .foregroundStyle(.white)
                Text("Tap once to talk, tap again when you're done.")
                    .font(.subheadline)
                    .foregroundStyle(Color.echoTextSecondary)
                Text("Old recipes are never lost. They live in the Recipe Box on the Week tab.")
                    .font(.caption)
                    .foregroundStyle(Color.echoTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                if !appState.keptRecipes.isEmpty {
                    // Report what actually rides along, not the raw pin count.
                    // generatePlan caps the locked set one short of the week so
                    // at least one dinner is always new, and anything over the
                    // cap waits for the week after. Saying "keeping 5" when only
                    // 4 ride is the kind of small lie that makes a plan look
                    // broken.
                    let count = appState.keptRecipes.count
                    let riding = min(count, max(0, appState.dinnersPerWeek - 1))
                    let waiting = count - riding
                    VStack(spacing: 4) {
                        Text(riding == 1
                            ? "Keeping 1 pinned dinner in your next week."
                            : "Keeping \(riding) pinned dinners in your next week.")
                        if waiting > 0 {
                            Text(waiting == 1
                                ? "1 more pin waits for the week after, so every week gets at least one new dinner."
                                : "\(waiting) more pins wait for the week after, so every week gets at least one new dinner.")
                                .font(.caption)
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                    }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.echoRed)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
                }
            }
        }
        .frame(minHeight: 90)
    }

    /// Idea hints learned from favorites and history, a button that plans a
    /// week with no talking at all, and a typed fallback for loud rooms.
    private var ideasAndSurprise: some View {
        VStack(spacing: 12) {
            if !appState.suggestionIdeas.isEmpty {
                Text("Ideas: " + appState.suggestionIdeas.joined(separator: " · "))
                    .font(.footnote)
                    .foregroundStyle(Color.echoTextSecondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
            }
            Button {
                if appState.aiNoticeAccepted {
                    appState.surpriseMe()
                } else {
                    pendingSurprise = true
                    show(.aiNotice)
                }
            } label: {
                Label("Surprise me", systemImage: "sparkles")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(.echoRed)

            Button {
                show(.typeIn)
            } label: {
                Label("Type it instead", systemImage: "keyboard")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(.echoTextSecondary)
        }
    }

    /// One-time disclosure shown before the first plan generation. Apple
    /// requires clear notice before user content is sent to a third-party
    /// AI, and it is the honest thing to do anyway. The content scrolls and
    /// the sheet opens at the large detent, so the accept button can never
    /// be clipped on small screens.
    private struct AINoticeSheet: View {
        let onAccept: () -> Void
        let onDecline: () -> Void

        var body: some View {
            ZStack {
                Color.echoBackground.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text("Before your first plan")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                            .padding(.top, 26)

                        Text("MealTime sends the words you speak (as text), along with your budget, taste notes, and meal history, to Anthropic's Claude AI to build your dinner plan and grocery list. No audio ever leaves your phone, and nothing is used for ads or tracking.")
                            .font(.subheadline)
                            .foregroundStyle(.white)
                            .fixedSize(horizontal: false, vertical: true)

                        Link("Read the full privacy policy",
                             destination: URL(string: "https://echochambermedia.com/mealtime/privacy")!)
                            .font(.subheadline)
                            .foregroundStyle(Color.echoRed)

                        Button {
                            onAccept()
                        } label: {
                            Text("Sounds good, plan my week")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 6)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.echoRed)
                        .padding(.top, 10)

                        Button("Not now", action: onDecline)
                            .font(.subheadline)
                            .foregroundStyle(Color.echoTextSecondary)
                            .frame(maxWidth: .infinity)
                            .padding(.bottom, 14)
                    }
                    .padding(.horizontal, 24)
                }
            }
        }
    }

    /// Typed alternative to the mic, for loud rooms or quiet moments.
    /// Cancel keeps the draft; Plan hands the text back to the parent,
    /// which submits it after the sheet has fully dismissed.
    private struct TypeInSheet: View {
        @Binding var text: String
        let onPlan: (String) -> Void
        @Environment(\.dismiss) private var dismiss
        @FocusState private var focused: Bool

        private var trimmed: String {
            text.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        var body: some View {
            NavigationStack {
                ZStack {
                    Color.echoBackground.ignoresSafeArea()
                    VStack(spacing: 20) {
                        TextField(
                            "What sounds good this week?",
                            text: $text,
                            axis: .vertical
                        )
                        .lineLimit(3...8)
                        .font(.body)
                        .foregroundStyle(.white)
                        .padding(14)
                        .echoCardStyle()
                        .focused($focused)

                        Button {
                            onPlan(trimmed)
                        } label: {
                            Text("Plan")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 6)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.echoRed)
                        .disabled(trimmed.isEmpty)

                        Spacer()
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 20)
                }
                .navigationTitle("Type your week")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }
                .onAppear { focused = true }
            }
            .preferredColorScheme(.dark)
        }
    }

    private var planningState: some View {
        VStack(spacing: 20) {
            ProgressView()
                .controlSize(.large)
                .tint(.echoRed)
            Text("Planning your week.")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Building \(appState.dinnersPerWeek) dinners and one grocery list.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
            Text("This usually takes under a minute.")
                .font(.caption)
                .foregroundStyle(Color.echoTextSecondary)
            Button("Cancel") {
                appState.cancelPlanning()
            }
            .buttonStyle(.bordered)
            .tint(.echoTextSecondary)
            .padding(.top, 8)
        }
    }
}
