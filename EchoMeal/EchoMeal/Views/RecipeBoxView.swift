import SwiftUI

/// The archive of every recipe the app has ever generated, newest first,
/// synced through CloudKit with the same household key. Recipes stay here
/// until deleted by hand. Pin a recipe to lock it into the next generation.
struct RecipeBoxView: View {
    @EnvironmentObject private var appState: AppState
    @State private var searchText = ""
    @State private var recipePendingDelete: Recipe?
    @State private var mode: Mode = .recipes

    /// Recipes you have generated, or the shelf of recipes stocked ahead.
    enum Mode: String, CaseIterable, Identifiable {
        case recipes = "Recipes"
        case shelf = "Shelf"
        var id: String { rawValue }
    }

    private var filteredRecipes: [Recipe] {
        guard !searchText.isEmpty else { return appState.recipeBox }
        return appState.recipeBox.filter {
            $0.title.localizedCaseInsensitiveContains(searchText)
        }
    }

    /// Shelf entries, newest first, narrowed by the search text.
    private var shelfRecipes: [ShelfRecipe] {
        let sorted = appState.shelf.sorted { $0.createdAt > $1.createdAt }
        guard !searchText.isEmpty else { return sorted }
        return sorted.filter { $0.recipe.title.localizedCaseInsensitiveContains(searchText) }
    }

    var body: some View {
        VStack(spacing: 0) {
            Picker("Show", selection: $mode) {
                ForEach(Mode.allCases) { option in
                    Text(option.rawValue).tag(option)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.echoBackground)

            if mode == .shelf {
                shelfList
            } else {
                recipeBoxList
            }
        }
        .background(Color.echoBackground.ignoresSafeArea())
        .searchable(text: $searchText, prompt: mode == .shelf ? "Search the shelf" : "Search recipes")
        .navigationTitle("Recipe Box")
        .toolbar {
            if mode == .recipes && !appState.recipeBox.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    EditButton()
                }
            }
        }
        // This screen is pushed by value (WeekRoute.recipeBox) from the Week
        // tab, and recipe taps resolve through the
        // navigationDestination(for: Recipe.self) declared on that stack's
        // root, so a tap pushes the detail instead of a duplicate list.
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

    private var recipeBoxList: some View {
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
                        .onDelete { offsets in
                            // Edit-mode delete goes through the same
                            // confirmation as the swipe path. Offsets index
                            // the filtered array currently on screen, which
                            // may be a search subset of the full box.
                            let displayed = filteredRecipes
                            if let index = offsets.first, displayed.indices.contains(index) {
                                recipePendingDelete = displayed[index]
                            }
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
            }
        }
    }

    // MARK: - Shelf

    /// Recipes stocked ahead of time, newest first. Tapping one opens the
    /// same detail screen with no day label, since a shelf recipe has not
    /// been given a night yet.
    private var shelfList: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            if appState.shelf.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "books.vertical")
                        .font(.system(size: 44))
                        .foregroundStyle(Color.echoTextSecondary)
                    Text("The shelf is empty")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(Color.echoText)
                    Text(shelfFooter)
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
            } else {
                List {
                    ForEach(shelfRecipes) { entry in
                        shelfRow(for: entry)
                    }
                    Text(shelfFooter)
                        .font(.footnote)
                        .foregroundStyle(Color.echoTextSecondary)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
            }
        }
    }

    private var shelfFooter: String {
        guard let stocked = appState.shelfLastTopUpAt else {
            return "Stocks itself when you open the app"
        }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return "Last stocked \(formatter.localizedString(for: stocked, relativeTo: Date()))"
    }

    private func shelfRow(for entry: ShelfRecipe) -> some View {
        NavigationLink(value: entry.recipe(onDay: "")) {
            VStack(alignment: .leading, spacing: 8) {
                Text(entry.recipe.title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Color.echoText)
                    .multilineTextAlignment(.leading)
                HStack(spacing: 14) {
                    Label(entry.cuisine, systemImage: "globe")
                    if entry.primaryProtein.lowercased() != "none" {
                        Label(entry.primaryProtein.capitalized, systemImage: "fork.knife")
                    }
                    Label(String(format: "$%.0f for two", entry.estCost), systemImage: "dollarsign.circle")
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
    }

    // MARK: - Pieces

    private func row(for recipe: Recipe) -> some View {
        NavigationLink(value: recipe) {
            HStack(spacing: 10) {
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
                Spacer()
                if appState.isKept(recipe) {
                    Image(systemName: "pin.fill")
                        .font(.subheadline)
                        .foregroundStyle(Color.echoAccentText)
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
            .tint(.echoAccent)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "books.vertical")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoTextSecondary)
            Text("No recipes yet")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)
            Text("Every recipe you generate lands here automatically and stays until you delete it.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
        }
    }
}
