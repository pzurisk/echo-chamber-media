import SwiftUI

/// Tab 1. One large red circular button, centered, on a dark background.
/// Tap once to listen, tap again to stop. There is no auto-stop. While
/// Claude plans, shows "Planning your week."
struct SpeakView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var recorder = SpeechRecorder()
    @State private var showSettings = false
    @State private var pulse = false
    @State private var showAINotice = false
    /// What to run once the one-time AI notice is accepted.
    @State private var pendingTranscript: String?
    @State private var pendingSurprise = false

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

                    Spacer()
                    Spacer()
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .onAppear {
                recorder.onFinish = { transcript in
                    if appState.aiNoticeAccepted {
                        appState.generatePlan(from: transcript)
                    } else {
                        pendingTranscript = transcript
                        showAINotice = true
                    }
                }
            }
            .sheet(isPresented: $showAINotice, onDismiss: {
                // Swiping the sheet down skips the buttons. Treat it as
                // "Not now" so a stale transcript cannot fire later.
                if !appState.aiNoticeAccepted {
                    pendingTranscript = nil
                    pendingSurprise = false
                }
            }) {
                AINoticeSheet(
                    onAccept: {
                        appState.acceptAINotice()
                        showAINotice = false
                        if let transcript = pendingTranscript {
                            pendingTranscript = nil
                            appState.generatePlan(from: transcript)
                        } else if pendingSurprise {
                            pendingSurprise = false
                            appState.surpriseMe()
                        }
                    },
                    onDecline: {
                        pendingTranscript = nil
                        pendingSurprise = false
                        showAINotice = false
                    }
                )
                .presentationDetents([.medium, .large])
            }
            .alert(
                "Something went wrong",
                isPresented: Binding(
                    get: { if case .error = appState.phase { return true } else { return false } },
                    set: { if !$0 { appState.clearError() } }
                )
            ) {
                Button("OK") { appState.clearError() }
            } message: {
                if case .error(let message) = appState.phase {
                    Text(message)
                }
            }
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
                    let count = appState.keptRecipes.count
                    Text(count == 1
                        ? "Keeping 1 pinned dinner in your next week."
                        : "Keeping \(count) pinned dinners in your next week.")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color.echoRed)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
            }
        }
        .frame(minHeight: 90)
    }

    /// Idea hints learned from favorites and history, plus a button that
    /// plans a week with no talking at all.
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
                    showAINotice = true
                }
            } label: {
                Label("Surprise me", systemImage: "sparkles")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.bordered)
            .tint(.echoRed)
        }
    }

    /// One-time disclosure shown before the first plan generation. Apple
    /// requires clear notice before user content is sent to a third-party
    /// AI, and it is the honest thing to do anyway.
    private struct AINoticeSheet: View {
        let onAccept: () -> Void
        let onDecline: () -> Void

        var body: some View {
            ZStack {
                Color.echoBackground.ignoresSafeArea()
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

                    Spacer()

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

    private var planningState: some View {
        VStack(spacing: 20) {
            ProgressView()
                .controlSize(.large)
                .tint(.echoRed)
            Text("Planning your week.")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Building 5 dinners and one grocery list.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
        }
    }
}
