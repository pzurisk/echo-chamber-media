import SwiftUI

/// Tab 2. The week's dinners as cards. Tap a card for the full recipe.
struct WeekView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    @State private var showClearConfirm = false
    /// Recipe titles whose rating nudge was dismissed with the x. Session
    /// only on purpose: a fresh launch may ask once more, and rating the
    /// meal makes the nudge disappear for good on its own.
    @State private var dismissedNudgeTitles: Set<String> = []
    /// The night being swapped. Set by the row's swipe action or context
    /// menu; drives the swap sheet (WeekEntry is Identifiable by day).
    @State private var swapTarget: WeekEntry?

    /// Toolbar destinations pushed by value. Pushing these screens by value
    /// (instead of view-builder NavigationLinks) keeps the stack's value
    /// resolution consistent: the Recipe rows inside them push through the
    /// navigationDestination(for: Recipe.self) declared below, instead of
    /// iOS misresolving a Recipe tap into a duplicate of the covering list.
    enum WeekRoute: Hashable {
        case recipeBox, favorites
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()

                if let plan = appState.plan {
                    // A List instead of a ScrollView, because swipeActions
                    // only exist on List rows. Plain style, hidden
                    // separators, and clear row backgrounds keep it looking
                    // exactly like the old card stack.
                    List {
                        if let nudge = appState.unratedRecent,
                           !dismissedNudgeTitles.contains(nudge.title) {
                            RatingNudgeCard(recipe: nudge) {
                                dismissedNudgeTitles.insert(nudge.title)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 7, leading: 16, bottom: 7, trailing: 16))
                        }

                        ForEach(plan.week) { entry in
                            Group {
                                if let recipe = plan.recipe(forDay: entry.day) {
                                    // Hidden NavigationLink under the card:
                                    // the row still pushes the recipe on tap
                                    // without a List disclosure chevron, and
                                    // the swipe action swipes the whole card.
                                    ZStack {
                                        NavigationLink(value: recipe) { EmptyView() }
                                            .opacity(0)
                                        DinnerCard(
                                            entry: entry,
                                            isFavorite: appState.isFavorite(recipe),
                                            rating: appState.rating(forTitle: entry.title),
                                            isKept: appState.isKept(recipe),
                                            isTonight: isTonight(entry.day)
                                        )
                                    }
                                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                        Button {
                                            swapTarget = entry
                                        } label: {
                                            Label("Swap", systemImage: "arrow.triangle.2.circlepath")
                                        }
                                        .tint(.echoRed)
                                    }
                                    .contextMenu {
                                        Button {
                                            swapTarget = entry
                                        } label: {
                                            Label("Swap this night", systemImage: "arrow.triangle.2.circlepath")
                                        }
                                    }
                                } else {
                                    // No recipe detail for this day (an older or
                                    // incomplete plan). Show the card with a clear
                                    // prompt instead of a card that silently does
                                    // nothing when tapped. No swap either: there
                                    // is no recipe to lock the rest of the week
                                    // around, so regenerate from the Speak tab.
                                    DinnerCard(
                                        entry: entry,
                                        isFavorite: false,
                                        rating: nil,
                                        isKept: false,
                                        isTonight: isTonight(entry.day),
                                        missingRecipe: true
                                    )
                                }
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .listRowInsets(EdgeInsets(top: 7, leading: 16, bottom: 7, trailing: 16))
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                } else {
                    emptyState
                }
            }
            .navigationTitle("This Week")
            .navigationDestination(for: Recipe.self) { recipe in
                RecipeDetailView(recipe: recipe)
            }
            .navigationDestination(for: WeekRoute.self) { route in
                switch route {
                case .recipeBox:
                    RecipeBoxView()
                case .favorites:
                    FavoritesView()
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 16) {
                        NavigationLink(value: WeekRoute.recipeBox) {
                            Image(systemName: "books.vertical.fill")
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                        NavigationLink(value: WeekRoute.favorites) {
                            Image(systemName: "heart.fill")
                                .foregroundStyle(Color.echoRed)
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 16) {
                        if appState.plan != nil {
                            Button {
                                showClearConfirm = true
                            } label: {
                                Image(systemName: "trash")
                                    .foregroundStyle(Color.echoTextSecondary)
                            }
                            .accessibilityLabel("Clear this week")
                        }
                        Button {
                            showSettings = true
                        } label: {
                            Image(systemName: "gearshape")
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                    }
                }
            }
            .confirmationDialog(
                "Clear this week?",
                isPresented: $showClearConfirm,
                titleVisibility: .visible
            ) {
                Button("Clear this week", role: .destructive) {
                    appState.clearWeek()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Your recipes stay saved in the Recipe Box.")
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(item: $swapTarget) { entry in
                SwapNightSheet(entry: entry)
                    .presentationDetents([.medium])
            }
        }
    }

    /// True when a plan day name is today's weekday. On a plan with fewer
    /// dinners than days (a 5 dinner week on a weekend) nothing matches and
    /// nothing highlights, which is the right answer.
    private func isTonight(_ day: String) -> Bool {
        AppState.weekdayNumber(forDayName: day) == Calendar.current.component(.weekday, from: Date())
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "fork.knife")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoTextSecondary)
            Text("No plan yet")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)
            Text("Go to Speak and say what sounds good.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
            Button("Start talking") {
                appState.selectedTab = .speak
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoRed)
            .padding(.top, 6)
        }
    }
}

/// One night's dinner card: day, dish title, cuisine, cook time. Shows a
/// pin when the recipe is kept for the next generation.
struct DinnerCard: View {
    let entry: WeekEntry
    let isFavorite: Bool
    let rating: Int?
    let isKept: Bool
    /// True when this entry's day is today. The day label reads TONIGHT
    /// and the card border warms up so tonight's dinner jumps out.
    var isTonight: Bool = false
    /// True when the plan has no recipe detail for this day, so the card
    /// cannot open a recipe. Shows a prompt to regenerate rather than
    /// looking tappable but doing nothing.
    var missingRecipe: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(isTonight ? "TONIGHT" : entry.day.uppercased())
                    .font(.caption.weight(.bold))
                    .tracking(1.2)
                    .foregroundStyle(Color.echoRed)
                Spacer()
                if let rating {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                        Text("\(rating)")
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(Color.echoWarning)
                }
                if isKept {
                    Image(systemName: "pin.fill")
                        .font(.caption)
                        .foregroundStyle(Color.echoTextSecondary)
                }
                if isFavorite {
                    Image(systemName: "heart.fill")
                        .font(.caption)
                        .foregroundStyle(Color.echoRed)
                }
            }

            Text(entry.title)
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)
                .multilineTextAlignment(.leading)

            HStack(spacing: 14) {
                Label(entry.cuisine, systemImage: "globe")
                Label("\(entry.cookTimeMin) min", systemImage: "clock")
                Label("Serves \(entry.servings)", systemImage: "person.2")
            }
            .font(.footnote)
            .foregroundStyle(Color.echoTextSecondary)

            if missingRecipe {
                Label("Recipe details didn't load. Regenerate this week on the Speak tab.", systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(Color.echoWarning)
                    .padding(.top, 2)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .echoCardStyle()
        .overlay {
            if isTonight {
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.echoRed.opacity(0.5), lineWidth: 1.5)
            }
        }
    }
}

/// Swap One Night sheet. Replaces a single dinner while every other night
/// and the grocery check-offs stay put. Three paths in: speak it, type it,
/// or let Claude surprise the household. Each path submits the swap and
/// dismisses right away; progress shows through the global planning banner.
private struct SwapNightSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    /// The sheet's own recorder, separate from the Speak tab's, so the two
    /// screens can never fight over one recognition session.
    @StateObject private var recorder = SpeechRecorder()
    let entry: WeekEntry
    @State private var typedText = ""

    private var trimmedTyped: String {
        typedText.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.echoBackground.ignoresSafeArea()
                VStack(spacing: 16) {
                    Text("Only \(entry.day) changes. Every other night stays, and check-offs stay for items that keep their name on the new list.")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                        .multilineTextAlignment(.center)

                    if !appState.aiNoticeAccepted {
                        // Same gate as SpeakView: nothing goes to Claude
                        // before the one-time notice. A swap only exists
                        // after a first plan, so this should never show in
                        // practice; belt and suspenders.
                        Text("First plan needs the one-time notice on the Speak tab.")
                            .font(.footnote)
                            .foregroundStyle(Color.echoWarning)
                            .multilineTextAlignment(.center)
                    } else {
                        if appState.phase != .planning {
                            micSection
                        }
                        typeSection
                        Button {
                            submit("")
                        } label: {
                            Label("Just surprise us", systemImage: "sparkles")
                                .font(.subheadline.weight(.semibold))
                                .padding(.horizontal, 18)
                                .padding(.vertical, 10)
                        }
                        .buttonStyle(.bordered)
                        .tint(.echoRed)
                    }

                    Spacer()
                }
                .padding(.horizontal, 24)
                .padding(.top, 18)
            }
            .navigationTitle("Swap \(entry.day)'s dinner")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.echoTextSecondary)
                }
            }
            .onAppear {
                recorder.onFinish = { transcript in
                    submit(transcript)
                }
            }
            .onDisappear {
                // Cancelling mid-recording must not leave the mic running,
                // and a final recognition result landing after dismissal
                // must not fire the swap the user just walked away from.
                recorder.onFinish = nil
                if recorder.isRecording {
                    recorder.stop()
                }
            }
        }
    }

    /// Tap to talk, tap again to stop, live transcript underneath. Ending
    /// the recording submits the swap through recorder.onFinish.
    private var micSection: some View {
        VStack(spacing: 10) {
            Button {
                recorder.toggle()
            } label: {
                ZStack {
                    Circle()
                        .fill(Color.echoRed)
                        .frame(width: 74, height: 74)
                        .shadow(color: Color.echoRed.opacity(0.35), radius: 14, y: 4)
                    Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(Color.echoOnAccent)
                }
            }
            .buttonStyle(.plain)
            .accessibilityLabel(recorder.isRecording ? "Stop listening" : "Say what you want instead")

            if recorder.isRecording {
                Text(recorder.transcript.isEmpty
                    ? "Listening. Tap again when you're done."
                    : recorder.transcript)
                    .font(.footnote)
                    .foregroundStyle(Color.echoTextSecondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
            } else if let error = recorder.errorMessage {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Color.echoWarning)
                    .multilineTextAlignment(.center)
            } else {
                Text("Tap to say what you want instead.")
                    .font(.footnote)
                    .foregroundStyle(Color.echoTextSecondary)
            }
        }
    }

    /// Typed fallback for loud rooms, same idea as the Speak tab's.
    private var typeSection: some View {
        HStack(spacing: 10) {
            TextField("Something that is not fish", text: $typedText)
                .font(.body)
                .foregroundStyle(Color.echoText)
                .padding(12)
                .echoCardStyle()
            Button("Swap") {
                submit(trimmedTyped)
            }
            .buttonStyle(.borderedProminent)
            .tint(.echoRed)
            .disabled(trimmedTyped.isEmpty)
        }
    }

    /// One exit for all three paths. The notice guard mirrors SpeakView's
    /// submit; the sheet dismisses immediately so the global planning
    /// banner takes over as the progress indicator.
    private func submit(_ transcript: String) {
        guard appState.aiNoticeAccepted else { return }
        appState.swapNight(day: entry.day, transcript: transcript)
        dismiss()
    }
}

/// Slim, dismissible prompt to rate the most recent dinner that has no
/// stars yet. One banner at a time, kept quiet: footnote text, an inline
/// star row, and an x. Rating the meal removes it naturally because it is
/// no longer unrated.
private struct RatingNudgeCard: View {
    @EnvironmentObject private var appState: AppState
    let recipe: Recipe
    let onDismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                Text("How was the \(recipe.title)?")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.echoText)
                    .multilineTextAlignment(.leading)
                Spacer()
                Button(action: onDismiss) {
                    Image(systemName: "xmark")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color.echoTextSecondary)
                        .padding(4)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Dismiss rating prompt")
            }
            StarRating(rating: appState.rating(for: recipe)) { stars in
                appState.rate(recipe, stars: stars)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .echoCardStyle()
    }
}
