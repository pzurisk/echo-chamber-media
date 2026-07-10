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
                        .foregroundStyle(.white)
                    Text("Tap the heart on any recipe to save it here.")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                }
            } else {
                ScrollView {
                    VStack(spacing: 14) {
                        ForEach(appState.favorites) { recipe in
                            NavigationLink(value: recipe) {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(recipe.title)
                                        .font(.title3.weight(.semibold))
                                        .foregroundStyle(.white)
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
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    .padding(.bottom, 24)
                }
            }
        }
        .navigationTitle("Favorites")
        // Recipe taps resolve through the navigationDestination declared on
        // the Week tab's NavigationStack, which owns this view.
    }
}
