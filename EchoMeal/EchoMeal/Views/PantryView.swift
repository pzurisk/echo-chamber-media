import SwiftUI

/// Feature 2's full manual pantry inventory: add items, mark them out when
/// they run out, mark them restocked when they come back. Grouped by the
/// same categories the grocery list uses, in-stock items first within each
/// group so what still needs restocking sinks to the bottom.
struct PantryView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showAddItem = false

    private var groupedCategories: [(name: String, items: [PantryItem])] {
        var byCategory: [String: [PantryItem]] = [:]
        for item in appState.pantryItems {
            byCategory[item.category, default: []].append(item)
        }
        return MealPlan.freeformCategories.compactMap { name in
            guard let items = byCategory[name], !items.isEmpty else { return nil }
            let sorted = items.sorted { a, b in
                if a.inStock != b.inStock { return a.inStock && !b.inStock }
                return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
            }
            return (name, sorted)
        }
    }

    var body: some View {
        ZStack {
            Color.echoBackground.ignoresSafeArea()

            if appState.pantryItems.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(groupedCategories, id: \.name) { group in
                        Section(group.name) {
                            ForEach(group.items) { item in
                                PantryRow(item: item)
                            }
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
            }
        }
        .navigationTitle("Pantry")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showAddItem = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Add pantry item")
            }
        }
        .sheet(isPresented: $showAddItem) {
            AddPantryItemSheet()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "cabinet")
                .font(.system(size: 44))
                .foregroundStyle(Color.echoTextSecondary)
            Text("No pantry items yet")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.echoText)
            Text("Add what you always have on hand. Plans will tag it and skip the cost.")
                .font(.subheadline)
                .foregroundStyle(Color.echoTextSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Button("Add an item") { showAddItem = true }
                .buttonStyle(.borderedProminent)
                .tint(.echoRed)
                .padding(.top, 6)
        }
    }
}

/// One pantry item: name, in-stock/out state, and the actions to flip it.
private struct PantryRow: View {
    @EnvironmentObject private var appState: AppState
    let item: PantryItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name)
                    .font(.body)
                    .foregroundStyle(Color.echoText)
                Text(item.inStock ? "In stock" : "Out, buy again next time")
                    .font(.caption)
                    .foregroundStyle(item.inStock ? Color.echoGreen : Color.echoWarning)
            }
            Spacer()
        }
        .contentShape(Rectangle())
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            if item.inStock {
                Button {
                    appState.markPantryItemOut(item)
                } label: {
                    Label("Mark out", systemImage: "xmark.circle")
                }
                .tint(.echoWarning)
            } else {
                Button {
                    appState.markPantryItemRestocked(item)
                } label: {
                    Label("Restocked", systemImage: "checkmark.circle")
                }
                .tint(.echoGreen)
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                appState.removePantryItem(item)
            } label: {
                Label("Remove", systemImage: "trash")
            }
        }
    }
}

/// Add sheet: name and category, mirroring the grocery list's freeform-item
/// sheet. New items start in stock.
private struct AddPantryItemSheet: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var category = "Pantry"

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Item, like rice or olive oil", text: $name)
                        .onSubmit(add)
                    Picker("Category", selection: $category) {
                        ForEach(MealPlan.freeformCategories, id: \.self) { name in
                            Text(name).tag(name)
                        }
                    }
                }
            }
            .navigationTitle("Add Pantry Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add", action: add)
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium])
    }

    private func add() {
        guard !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        appState.addPantryItem(name: name, category: category)
        dismiss()
    }
}
