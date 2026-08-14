import SwiftUI

/// Full recipe: ingredients with quantities, numbered steps, cook time,
/// servings, a heart to save it to the Favorites library, and a pin to
/// keep it in the next generated week.
struct RecipeDetailView: View {
    @EnvironmentObject private var appState: AppState
    let recipe: Recipe
    @State private var showCookMode = false
    @State private var showEdit = false

    /// The freshest copy of this recipe anywhere in the app, so a saved
    /// edit shows here immediately. The plan wins, then the Recipe Box
    /// archive, then the copy this screen was pushed with.
    private var currentRecipe: Recipe {
        if let fromPlan = appState.plan?.recipes.first(where: {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }) {
            return fromPlan
        }
        if let fromBox = appState.recipeBox.first(where: {
            $0.title.caseInsensitiveCompare(recipe.title) == .orderedSame
        }) {
            return fromBox
        }
        return recipe
    }

    var body: some View {
        // Shadows the stored copy so everything below, including Cook
        // Mode and the toolbar, renders the freshest version right after
        // an edit is saved.
        let recipe = currentRecipe
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(recipe.day.uppercased())
                            .font(.caption.weight(.bold))
                            .tracking(1.2)
                            .foregroundStyle(Color.echoAccentText)
                        Text(recipe.title)
                            .font(.largeTitle.weight(.bold))
                            .foregroundStyle(Color.echoText)
                        HStack(spacing: 14) {
                            Label("\(recipe.cookTimeMin) min", systemImage: "clock")
                            Label("Serves \(recipe.servings)", systemImage: "person.2")
                        }
                        .font(.subheadline)
                        .foregroundStyle(Color.echoTextSecondary)
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        let currentRating = appState.rating(for: recipe)
                        HStack {
                            Text("How was it?")
                                .font(.headline)
                                .foregroundStyle(Color.echoText)
                            Spacer()
                            if currentRating > 0 && currentRating <= 2 {
                                Text("Won't be suggested again")
                                    .font(.caption)
                                    .foregroundStyle(Color.echoAccentText)
                            }
                        }
                        StarRating(rating: currentRating) { stars in
                            appState.rate(recipe, stars: stars)
                        }
                        Text("Rate it after you cook it. 4 and 5 stars bring more meals like this. 1 and 2 stars mean it never comes back. Tap your rating again to clear it.")
                            .font(.caption)
                            .foregroundStyle(Color.echoTextSecondary)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .echoCardStyle()

                    Button {
                        showCookMode = true
                    } label: {
                        Label("Start cooking", systemImage: "flame.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.echoAccent)

                    VStack(alignment: .leading, spacing: 10) {
                        Text("Ingredients")
                            .font(.headline)
                            .foregroundStyle(Color.echoText)
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(recipe.ingredients, id: \.item) { ingredient in
                                HStack(alignment: .top, spacing: 10) {
                                    Circle()
                                        .fill(Color.echoAccent)
                                        .frame(width: 6, height: 6)
                                        .padding(.top, 7)
                                    Text(ingredient.item)
                                        .foregroundStyle(Color.echoText)
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
                            .foregroundStyle(Color.echoText)
                        VStack(alignment: .leading, spacing: 14) {
                            ForEach(Array(recipe.steps.enumerated()), id: \.offset) { index, step in
                                HStack(alignment: .top, spacing: 12) {
                                    // The number sits on the accent fill, so it
                                    // takes the on-accent role instead of the
                                    // normal body text color.
                                    Text("\(index + 1)")
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(Color.echoOnAccent)
                                        .frame(width: 26, height: 26)
                                        .background(Circle().fill(Color.echoAccent))
                                    Text(step)
                                        .font(.subheadline)
                                        .foregroundStyle(Color.echoText)
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
        .fullScreenCover(isPresented: $showCookMode) {
            CookModeView(recipe: recipe)
        }
        .sheet(isPresented: $showEdit) {
            RecipeEditView(recipe: recipe)
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showEdit = true
                } label: {
                    Image(systemName: "pencil")
                        .foregroundStyle(Color.echoAccentText)
                }
                .accessibilityLabel("Edit recipe")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    appState.toggleKeep(recipe)
                } label: {
                    Image(systemName: appState.isKept(recipe) ? "pin.fill" : "pin")
                        .foregroundStyle(Color.echoAccentText)
                }
                .accessibilityLabel(appState.isKept(recipe) ? "Remove from next week" : "Keep in next week")
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    appState.toggleFavorite(recipe)
                } label: {
                    Image(systemName: appState.isFavorite(recipe) ? "heart.fill" : "heart")
                        .foregroundStyle(Color.echoAccentText)
                }
                .accessibilityLabel(appState.isFavorite(recipe) ? "Remove from favorites" : "Save to favorites")
            }
        }
    }
}

// MARK: - Edit sheet

/// Hand-edit a recipe: swap ingredients, rewrite steps, adjust cook time
/// and servings. The title and day stay fixed on purpose so ratings,
/// pins, favorites, and taste history keep matching by title. Saving
/// pushes the edit through AppState.updateRecipe, which syncs the plan,
/// the grocery list, the Recipe Box, and the other phone.
private struct RecipeEditView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    let recipe: Recipe

    /// Editable rows carry their own stable identity so SwiftUI keeps
    /// focus and animation sane while rows are added and deleted.
    private struct EditableIngredient: Identifiable {
        let id = UUID()
        var item: String
        var qty: String
    }

    private struct EditableStep: Identifiable {
        let id = UUID()
        var text: String
    }

    @State private var ingredients: [EditableIngredient]
    @State private var steps: [EditableStep]
    @State private var cookTimeMin: Int
    @State private var servings: Int

    init(recipe: Recipe) {
        self.recipe = recipe
        _ingredients = State(initialValue: recipe.ingredients.map {
            EditableIngredient(item: $0.item, qty: $0.qty)
        })
        _steps = State(initialValue: recipe.steps.map { EditableStep(text: $0) })
        _cookTimeMin = State(initialValue: recipe.cookTimeMin)
        _servings = State(initialValue: recipe.servings)
    }

    /// Rows with real text in them, trimmed and ready to save.
    private var cleanIngredients: [Ingredient] {
        ingredients
            .map {
                Ingredient(
                    item: $0.item.trimmingCharacters(in: .whitespacesAndNewlines),
                    qty: $0.qty.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            }
            .filter { !$0.item.isEmpty }
    }

    private var cleanSteps: [String] {
        steps
            .map { $0.text.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    /// A recipe with no ingredients or no steps cannot be cooked, so it
    /// cannot be saved either.
    private var canSave: Bool {
        !cleanIngredients.isEmpty && !cleanSteps.isEmpty
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Basics") {
                    Stepper("Cook time: \(cookTimeMin) min", value: $cookTimeMin, in: 5...240, step: 5)
                    Stepper("Serves \(servings)", value: $servings, in: 1...12)
                }

                Section {
                    ForEach($ingredients) { $ingredient in
                        HStack(spacing: 10) {
                            TextField("Ingredient", text: $ingredient.item)
                            TextField("Qty", text: $ingredient.qty)
                                .frame(width: 110)
                                .multilineTextAlignment(.trailing)
                                .foregroundStyle(Color.echoTextSecondary)
                        }
                    }
                    .onDelete { ingredients.remove(atOffsets: $0) }
                    Button {
                        ingredients.append(EditableIngredient(item: "", qty: ""))
                    } label: {
                        Label("Add ingredient", systemImage: "plus.circle.fill")
                    }
                    .foregroundStyle(Color.echoAccentText)
                } header: {
                    Text("Ingredients")
                } footer: {
                    Text("Swap anything you don't like. Swipe left to remove a row. Anything new lands on the grocery list under From recipes.")
                }

                Section {
                    ForEach($steps) { $step in
                        TextField("Step", text: $step.text, axis: .vertical)
                    }
                    .onDelete { steps.remove(atOffsets: $0) }
                    Button {
                        steps.append(EditableStep(text: ""))
                    } label: {
                        Label("Add step", systemImage: "plus.circle.fill")
                    }
                    .foregroundStyle(Color.echoAccentText)
                } header: {
                    Text("Steps")
                }
            }
            .navigationTitle("Edit Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        var edited = recipe
                        edited.ingredients = cleanIngredients
                        edited.steps = cleanSteps
                        edited.cookTimeMin = cookTimeMin
                        edited.servings = servings
                        appState.updateRecipe(edited)
                        dismiss()
                    }
                    .disabled(!canSave)
                }
            }
        }
    }
}
