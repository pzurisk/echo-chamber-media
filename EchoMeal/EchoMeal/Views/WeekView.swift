import SwiftUI

/// Tab 2. The week's dinners as cards. Tap a card for the full recipe.
struct WeekView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showSettings = false

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
                                        DinnerCard(entry: entry, isFavorite: appState.isFavorite(recipe))
                                    }
                                    .buttonStyle(.plain)
                                } else {
                                    DinnerCard(entry: entry, isFavorite: false)
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
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    NavigationLink {
                        FavoritesView()
                    } label: {
                        Image(systemName: "heart.fill")
                            .foregroundStyle(Color.echoRed)
                    }
                }
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

/// One night's dinner card: day, dish title, cuisine, cook time.
struct DinnerCard: View {
    let entry: WeekEntry
    let isFavorite: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(entry.day.uppercased())
                    .font(.caption.weight(.bold))
                    .tracking(1.2)
                    .foregroundStyle(Color.echoRed)
                Spacer()
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
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .echoCardStyle()
    }
}
