import SwiftUI

/// Saved recipes library, synced through CloudKit with the same household key.
struct FavoritesView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            if appState.favorites.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "heart")
                        .font(.system(size: 44))
                        .foregroundStyle(Color.echoTextSecondary)
                    Text("No favorites yet")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(Color.echoText)
                    Text("Tap the heart on any recipe to save it here.")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                }
            } else {
                List {
                    ForEach(appState.favorites) { recipe in
                        row(for: recipe)
                    }
                    .onDelete { offsets in
                        // No confirmation here: unfavoriting is reversible
                        // from the recipe's heart, nothing is lost.
                        let removed = offsets.compactMap { index in
                            appState.favorites.indices.contains(index)
                                ? appState.favorites[index] : nil
                        }
                        for recipe in removed {
                            appState.toggleFavorite(recipe)
                        }
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Favorites")
        .toolbar {
            if !appState.favorites.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    EditButton()
                }
            }
        }
        // This screen is pushed by value (WeekRoute.favorites) from the Week
        // tab, and recipe taps resolve through the
        // navigationDestination(for: Recipe.self) declared on that stack's
        // root, so a tap pushes the detail instead of a duplicate list.
    }

    private func row(for recipe: Recipe) -> some View {
        NavigationLink(value: recipe) {
            VStack(alignment: .leading, spacing: 8) {
                Text(recipe.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Color.echoText)
                    .multilineTextAlignment(.leading)
                HStack(spacing: 14) {
                    Label("\(recipe.cookTimeMin) min", systemImage: "clock")
                    Label("Serves \(recipe.servings)", systemImage: "person.2")
                }
                .font(.footnote)
                .foregroundStyle(Color.echoTextSecondary)
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .echoCardStyle()
        }
        .buttonStyle(.plain)
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 7, leading: 16, bottom: 7, trailing: 16))
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button {
                appState.toggleFavorite(recipe)
            } label: {
                Label("Remove", systemImage: "heart.slash")
            }
            .tint(.echoAccent)
        }
    }
}
