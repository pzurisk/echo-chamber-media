import SwiftUI

/// The archive of every recipe the app has ever generated, newest first,
/// synced through CloudKit with the same household key. Recipes stay here
/// until deleted by hand. Pin a recipe to lock it into the next generation.
struct RecipeBoxView: View {
    @EnvironmentObject private var appState: AppState
    @State private var searchText = ""
    @State private var recipePendingDelete: Recipe?

    private var filteredRecipes: [Recipe] {
        guard !searchText.isEmpty else { return appState.recipeBox }
        return appState.recipeBox.filter {
            $0.title.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            if appState.recipeBox.isEmpty {
                emptyState
            } else {
                List {
                    Section {
                        ForEach(filteredRecipes) { recipe in
                            row(for: recipe)
                        }
                    } header: {
                        Text("Every recipe you generate is saved here automatically. Pin one to keep it in your next week. Deleting is up to you, nothing is removed on its own.")
                            .font(.footnote)
                            .foregroundStyle(Color.echoTextSecondary)
                            .textCase(nil)
                    }
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .searchable(text: $searchText, prompt: "Search recipes")
            }
        }
        .navigationTitle("Recipe Box")
        // Recipe taps resolve through the navigationDestination declared on
        // the Week tab's NavigationStack, which owns this view.
        .alert(
            "Delete this recipe for good?",
            isPresented: Binding(
                get: { recipePendingDelete != nil },
                set: { if !$0 { recipePendingDelete = nil } }
            ),
            presenting: recipePendingDelete
        ) { recipe in
            Button("Delete", role: .destructive) {
                appState.deleteFromRecipeBox(recipe)
            }
            Button("Cancel", role: .cancel) {}
        } message: { recipe in
            Text("\(recipe.title) will also be removed from Favorites and unpinned if it was kept.")
        }
    }

    // MARK: - Pieces

    private func row(for recipe: Recipe) -> some View {
        NavigationLink(value: recipe) {
            HStack(spacing: 10) {
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
                Spacer()
                if appState.isKept(recipe) {
                    Image(systemName: "pin.fill")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoRed)
                }
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
            // Not role: .destructive on purpose. The destructive role makes the
            // row animate out before the confirmation alert, then snap back on
            // cancel. A plain red button just opens the alert.
            Button {
                recipePendingDelete = recipe
            } label: {
                Label("Delete", systemImage: "trash")
            }
            .tint(.red)
            Button {
                appState.toggleKeep(recipe)
            } label: {
                Label(
                    appState.isKept(recipe) ? "Unpin" : "Keep",
                    systemImage: appState.isKept(recipe) ? "pin.slash" : "pin.fill"
                )
            }
            .tint(.echoRed)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "books.vertical")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoTextSecondary)
            Text("No recipes yet")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Every recipe you generate lands here automatically and stays until you delete it.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
    }
}
