import SwiftUI

/// Full recipe: ingredients with quantities, numbered steps, cook time,
/// servings, and a heart to save it to the Favorites library.
struct RecipeDetailView: View {
    @EnvironmentObject private var appState: AppState
    let recipe: Recipe

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(recipe.day.uppercased())
                            .font(.caption.weight(.bold))
                            .tracking(1.2)
                            .foregroundStyle(Color.echoRed)
                        Text(recipe.title)
                            .font(.largeTitle.weight(.bold))
                            .foregroundStyle(.white)
                        HStack(spacing: 14) {
                            Label("\(recipe.cookTimeMin) min", systemImage: "clock")
                            Label("Serves \(recipe.servings)", systemImage: "person.2")
                        }
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Ingredients")
                            .font(.headline)
                            .foregroundStyle(.white)
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(recipe.ingredients, id: \.item) { ingredient in
                                HStack(alignment: .top, spacing: 10) {
                                    Circle()
                                        .fill(Color.echoRed)
                                        .frame(width: 6, height: 6)
                                        .padding(.top, 7)
                                    Text(ingredient.item)
                                        .foregroundStyle(.white)
                                    Spacer()
                                    Text(ingredient.qty)
                                        .foregroundStyle(Color.echoTextSecondary)
                                }
                                .font(.subheadline)
                            }
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .echoCardStyle()
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Steps")
                            .font(.headline)
                            .foregroundStyle(.white)
                        VStack(alignment: .leading, spacing: 14) {
                            ForEach(Array(recipe.steps.enumerated()), id: \.offset) { index, step in
                                HStack(alignment: .top, spacing: 12) {
                                    Text("\(index + 1)")
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(.white)
                                        .frame(width: 26, height: 26)
                                        .background(Circle().fill(Color.echoRed))
                                    Text(step)
                                        .font(.subheadline)
                                        .foregroundStyle(.white)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                        .padding(16)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .echoCardStyle()
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 32)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    appState.toggleFavorite(recipe)
                } label: {
                    Image(systemName: appState.isFavorite(recipe) ? "heart.fill" : "heart")
                        .foregroundStyle(Color.echoRed)
                }
                .accessibilityLabel(appState.isFavorite(recipe) ? "Remove from favorites" : "Save to favorites")
            }
        }
    }
}
