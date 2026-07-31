import SwiftUI

/// Tab 2. The week's dinners as cards. Tap a card for the full recipe.
struct WeekView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false
    @State private var showClearConfirm = false

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
                    ScrollView {
                        VStack(spacing: 14) {
                            ForEach(plan.week) { entry in
                                if let recipe = plan.recipe(forDay: entry.day) {
                                    NavigationLink(value: recipe) {
                                        DinnerCard(
                                            entry: entry,
                                            isFavorite: appState.isFavorite(recipe),
                                            rating: appState.rating(forTitle: entry.title),
                                            isKept: appState.isKept(recipe)
                                        )
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    // No recipe detail for this day (an older or
                                    // incomplete plan). Show the card with a clear
                                    // prompt instead of a card that silently does
                                    // nothing when tapped.
                                    DinnerCard(
                                        entry: entry,
                                        isFavorite: false,
                                        rating: nil,
                                        isKept: false,
                                        missingRecipe: true
                                    )
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 24)
                    }
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
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "fork.knife")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoTextSecondary)
            Text("No plan yet")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
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
    /// True when the plan has no recipe detail for this day, so the card
    /// cannot open a recipe. Shows a prompt to regenerate rather than
    /// looking tappable but doing nothing.
    var missingRecipe: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(entry.day.uppercased())
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
                    .foregroundStyle(.yellow)
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
                .foregroundStyle(.white)
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
                    .foregroundStyle(.orange)
                    .padding(.top, 2)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .echoCardStyle()
    }
}
